"use client";

import { create } from "zustand";

export type WishlistNotice =
  | { id: number; kind: "added"; productId: string }
  | { id: number; kind: "auth" };

type WishlistFeedbackState = {
  notice: WishlistNotice | null;
  notifyAdded: (productId: string) => void;
  notifyAuth: () => void;
  dismiss: () => void;
};

let nextId = 1;

export const useWishlistFeedbackStore = create<WishlistFeedbackState>((set) => ({
  notice: null,
  notifyAdded: (productId) =>
    set({
      notice: { id: nextId++, kind: "added", productId },
    }),
  notifyAuth: () =>
    set({
      notice: { id: nextId++, kind: "auth" },
    }),
  dismiss: () => set({ notice: null }),
}));
