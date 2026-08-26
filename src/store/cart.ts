"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { useBranchStore } from "@/store/branch";
import { getLiveStock } from "@/store/inventory";
import { isValidCoupon } from "@/lib/commerce";
import { useCartFeedbackStore } from "@/store/cart-feedback";

export type AddItemResult = {
  ok: boolean;
  added: number;
  quantity: number;
};

type CartSnapshot = {
  items: CartItem[];
  savedForLater: string[];
  coupon: string | null;
  fulfillment: "delivery" | "pickup";
};

type CartState = CartSnapshot & {
  /** Active account for the current session. Null when logged out. */
  ownerId: string | null;
  /** Saved carts keyed by user id. */
  accounts: Record<string, CartSnapshot>;
  /** Guest cart while signed out (cleared when a session ends). */
  guest: CartSnapshot;
  addItem: (productId: string, qty?: number) => AddItemResult;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => AddItemResult;
  applyCoupon: (code: string | null) => boolean;
  setFulfillment: (f: "delivery" | "pickup") => void;
  clear: () => void;
  itemCount: () => number;
  bindUser: (userId: string) => void;
  unbindUser: () => void;
};

export { getCouponDiscount, isValidCoupon } from "@/lib/commerce";

const emptySnapshot = (): CartSnapshot => ({
  items: [],
  savedForLater: [],
  coupon: null,
  fulfillment: "delivery",
});

function snapshotFrom(state: CartSnapshot): CartSnapshot {
  return {
    items: state.items.map((item) => ({ ...item })),
    savedForLater: [...state.savedForLater],
    coupon: state.coupon,
    fulfillment: state.fulfillment,
  };
}

function applySnapshot(snapshot: CartSnapshot | undefined): CartSnapshot {
  if (!snapshot) return emptySnapshot();
  return {
    items: Array.isArray(snapshot.items) ? snapshot.items.map((item) => ({ ...item })) : [],
    savedForLater: Array.isArray(snapshot.savedForLater) ? [...snapshot.savedForLater] : [],
    coupon: snapshot.coupon ?? null,
    fulfillment: snapshot.fulfillment === "pickup" ? "pickup" : "delivery",
  };
}

function persistActive(state: CartState, patch: Partial<CartSnapshot>): Partial<CartState> {
  const next: CartSnapshot = {
    items: patch.items ?? state.items,
    savedForLater: patch.savedForLater ?? state.savedForLater,
    coupon: patch.coupon !== undefined ? patch.coupon : state.coupon,
    fulfillment: patch.fulfillment ?? state.fulfillment,
  };
  if (state.ownerId) {
    return {
      ...next,
      accounts: {
        ...state.accounts,
        [state.ownerId]: snapshotFrom(next),
      },
    };
  }
  return {
    ...next,
    guest: snapshotFrom(next),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      ...emptySnapshot(),
      accounts: {},
      guest: emptySnapshot(),
      addItem: (productId, qty = 1) => {
        const branchId = useBranchStore.getState().branchId;
        const onHand = getLiveStock(branchId, productId);
        const state = get();
        const existing = state.items.find((i) => i.productId === productId);
        const current = existing?.quantity ?? 0;
        const nextQty = Math.min(current + Math.max(0, qty), onHand);
        const added = nextQty - current;
        if (nextQty <= 0 || added <= 0) {
          return { ok: false, added: 0, quantity: current };
        }
        set((s) => {
          const items = existing
            ? s.items.map((i) =>
                i.productId === productId ? { ...i, quantity: nextQty } : i,
              )
            : [
                ...s.items,
                { productId, quantity: nextQty, fulfillment: s.fulfillment },
              ];
          return persistActive(s, {
            items,
            savedForLater: s.savedForLater.filter((id) => id !== productId),
          });
        });
        return { ok: true, added, quantity: nextQty };
      },
      removeItem: (productId) =>
        set((s) =>
          persistActive(s, {
            items: s.items.filter((i) => i.productId !== productId),
          }),
        ),
      setQuantity: (productId, quantity) =>
        set((s) => {
          const branchId = useBranchStore.getState().branchId;
          const onHand = getLiveStock(branchId, productId);
          const nextQty = Math.min(Math.max(0, quantity), onHand);
          return persistActive(s, {
            items:
              nextQty <= 0
                ? s.items.filter((i) => i.productId !== productId)
                : s.items.map((i) =>
                    i.productId === productId ? { ...i, quantity: nextQty } : i,
                  ),
          });
        }),
      saveForLater: (productId) =>
        set((s) =>
          persistActive(s, {
            items: s.items.filter((i) => i.productId !== productId),
            savedForLater: s.savedForLater.includes(productId)
              ? s.savedForLater
              : [...s.savedForLater, productId],
          }),
        ),
      moveToCart: (productId) => {
        const result = get().addItem(productId, 1);
        set((s) =>
          persistActive(s, {
            savedForLater: s.savedForLater.filter((id) => id !== productId),
          }),
        );
        return result;
      },
      applyCoupon: (code) => {
        const trimmed = code?.trim() || null;
        if (!trimmed) {
          set((s) => persistActive(s, { coupon: null }));
          return true;
        }
        const normalized = trimmed.toUpperCase();
        if (!isValidCoupon(normalized)) {
          return false;
        }
        set((s) => persistActive(s, { coupon: normalized }));
        return true;
      },
      setFulfillment: (fulfillment) =>
        set((s) =>
          persistActive(s, {
            fulfillment,
            items: s.items.map((i) => ({ ...i, fulfillment })),
          }),
        ),
      clear: () =>
        set((s) =>
          persistActive(s, {
            items: [],
            coupon: null,
          }),
        ),
      itemCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
      bindUser: (userId) => {
        const id = userId.trim();
        if (!id) return;
        set((s) => {
          const accounts =
            s.ownerId && s.ownerId !== id
              ? { ...s.accounts, [s.ownerId]: snapshotFrom(s) }
              : s.accounts;
          const loaded = applySnapshot(
            accounts[id] ?? (s.ownerId === id ? snapshotFrom(s) : undefined),
          );
          return {
            ownerId: id,
            accounts: {
              ...accounts,
              [id]: loaded,
            },
            guest: emptySnapshot(),
            ...loaded,
          };
        });
      },
      unbindUser: () => {
        set((s) => {
          // Already signed out — keep the guest cart as-is.
          if (!s.ownerId) {
            const guest = applySnapshot(
              s.items.length > 0 || s.savedForLater.length > 0 || s.coupon
                ? snapshotFrom(s)
                : s.guest,
            );
            return {
              ownerId: null,
              guest,
              ...guest,
            };
          }
          // Signed-in session ending — save account cart and clear the bag.
          return {
            ownerId: null,
            accounts: {
              ...s.accounts,
              [s.ownerId]: snapshotFrom(s),
            },
            guest: emptySnapshot(),
            ...emptySnapshot(),
          };
        });
        useCartFeedbackStore.getState().dismiss();
      },
    }),
    {
      name: "sams-cart",
      version: 2,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as {
          accounts?: Record<string, CartSnapshot>;
          guest?: CartSnapshot;
        };
        return {
          ownerId: null,
          ...emptySnapshot(),
          accounts: state.accounts ?? {},
          guest: emptySnapshot(),
        };
      },
      partialize: (state) => ({
        accounts: state.accounts,
        guest: state.ownerId ? state.guest : snapshotFrom(state),
      }),
    },
  ),
);
