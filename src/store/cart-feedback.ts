"use client";

import { create } from "zustand";

export type CartNotice = {
  id: number;
  productId: string;
  added: number;
  quantity: number;
};

type CartFeedbackState = {
  notice: CartNotice | null;
  bump: number;
  notify: (productId: string, added: number, quantity: number) => void;
  dismiss: () => void;
};

let nextId = 1;

export const useCartFeedbackStore = create<CartFeedbackState>((set) => ({
  notice: null,
  bump: 0,
  notify: (productId, added, quantity) =>
    set({
      notice: { id: nextId++, productId, added, quantity },
      bump: Date.now(),
    }),
  dismiss: () => set({ notice: null }),
}));
