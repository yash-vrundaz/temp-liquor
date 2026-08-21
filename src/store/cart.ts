"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { useBranchStore } from "@/store/branch";
import { getLiveStock } from "@/store/inventory";
import { isValidCoupon } from "@/lib/commerce";

export type AddItemResult = {
  ok: boolean;
  added: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  savedForLater: string[];
  coupon: string | null;
  fulfillment: "delivery" | "pickup";
  addItem: (productId: string, qty?: number) => AddItemResult;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => AddItemResult;
  applyCoupon: (code: string | null) => boolean;
  setFulfillment: (f: "delivery" | "pickup") => void;
  clear: () => void;
  itemCount: () => number;
};

export { getCouponDiscount, isValidCoupon } from "@/lib/commerce";

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],
      coupon: null,
      fulfillment: "delivery",
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
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === productId ? { ...i, quantity: nextQty } : i,
              ),
            };
          }
          return {
            items: [
              ...s.items,
              { productId, quantity: nextQty, fulfillment: s.fulfillment },
            ],
            savedForLater: s.savedForLater.filter((id) => id !== productId),
          };
        });
        return { ok: true, added, quantity: nextQty };
      },
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((s) => {
          const branchId = useBranchStore.getState().branchId;
          const onHand = getLiveStock(branchId, productId);
          const nextQty = Math.min(Math.max(0, quantity), onHand);
          return {
            items:
              nextQty <= 0
                ? s.items.filter((i) => i.productId !== productId)
                : s.items.map((i) =>
                    i.productId === productId ? { ...i, quantity: nextQty } : i,
                  ),
          };
        }),
      saveForLater: (productId) =>
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
          savedForLater: s.savedForLater.includes(productId)
            ? s.savedForLater
            : [...s.savedForLater, productId],
        })),
      moveToCart: (productId) => {
        const result = get().addItem(productId, 1);
        set((s) => ({
          savedForLater: s.savedForLater.filter((id) => id !== productId),
        }));
        return result;
      },
      applyCoupon: (code) => {
        const trimmed = code?.trim() || null;
        if (!trimmed) {
          set({ coupon: null });
          return true;
        }
        const normalized = trimmed.toUpperCase();
        if (!isValidCoupon(normalized)) {
          return false;
        }
        set({ coupon: normalized });
        return true;
      },
      setFulfillment: (fulfillment) =>
        set((s) => ({
          fulfillment,
          items: s.items.map((i) => ({ ...i, fulfillment })),
        })),
      clear: () => set({ items: [], coupon: null }),
      itemCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
    }),
    { name: "sams-cart" },
  ),
);
