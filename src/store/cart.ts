"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { useBranchStore } from "@/store/branch";
import { getLiveStock } from "@/store/inventory";

type CartState = {
  items: CartItem[];
  savedForLater: string[];
  coupon: string | null;
  fulfillment: "delivery" | "pickup";
  addItem: (productId: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  applyCoupon: (code: string | null) => void;
  setFulfillment: (f: "delivery" | "pickup") => void;
  clear: () => void;
  itemCount: () => number;
};

export { getCouponDiscount } from "@/lib/commerce";

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],
      coupon: null,
      fulfillment: "delivery",
      addItem: (productId, qty = 1) =>
        set((s) => {
          const branchId = useBranchStore.getState().branchId;
          const onHand = getLiveStock(branchId, productId);
          const existing = s.items.find((i) => i.productId === productId);
          const current = existing?.quantity ?? 0;
          const nextQty = Math.min(current + Math.max(0, qty), onHand);
          if (nextQty <= 0) return s;
          if (existing) {
            if (nextQty === current) return s;
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
        }),
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
        get().addItem(productId, 1);
        set((s) => ({
          savedForLater: s.savedForLater.filter((id) => id !== productId),
        }));
      },
      applyCoupon: (code) => set({ coupon: code }),
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
