"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useWishlistFeedbackStore } from "@/store/wishlist-feedback";

type ToggleResult = {
  added: boolean;
  requiresAuth: boolean;
};

type WishlistState = {
  /** Active account for the current session. Null when logged out. */
  ownerId: string | null;
  /** Visible wishlist for the active session. */
  ids: string[];
  /** Saved wishlists keyed by user id. */
  accounts: Record<string, string[]>;
  toggle: (productId: string) => ToggleResult;
  has: (productId: string) => boolean;
  bindUser: (userId: string) => void;
  unbindUser: () => void;
};

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      ids: [],
      accounts: {},
      toggle: (productId) => {
        const { ownerId, ids } = get();
        if (!ownerId) {
          useWishlistFeedbackStore.getState().notifyAuth();
          return { added: false, requiresAuth: true };
        }
        const already = ids.includes(productId);
        const nextIds = already
          ? ids.filter((id) => id !== productId)
          : [...ids, productId];
        set((s) => ({
          ids: nextIds,
          accounts: { ...s.accounts, [ownerId]: nextIds },
        }));
        if (!already) {
          useWishlistFeedbackStore.getState().notifyAdded(productId);
        }
        return { added: !already, requiresAuth: false };
      },
      has: (productId) => get().ids.includes(productId),
      bindUser: (userId) => {
        const id = userId.trim();
        if (!id) return;
        set((s) => {
          const previous =
            s.ownerId && s.ownerId !== id
              ? { ...s.accounts, [s.ownerId]: uniqueIds(s.ids) }
              : s.accounts;
          const nextAccounts = {
            ...previous,
            [id]: uniqueIds(previous[id] ?? (s.ownerId === id ? s.ids : [])),
          };
          return {
            ownerId: id,
            accounts: nextAccounts,
            ids: nextAccounts[id] ?? [],
          };
        });
      },
      unbindUser: () => {
        set((s) => {
          const accounts =
            s.ownerId != null
              ? { ...s.accounts, [s.ownerId]: uniqueIds(s.ids) }
              : s.accounts;
          return {
            ownerId: null,
            ids: [],
            accounts,
          };
        });
        useWishlistFeedbackStore.getState().dismiss();
      },
    }),
    {
      name: "sams-wishlist",
      version: 2,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as {
          accounts?: Record<string, string[]>;
        };
        return {
          ownerId: null,
          ids: [],
          accounts: state.accounts ?? {},
        };
      },
      partialize: (state) => ({
        accounts: state.accounts,
      }),
    },
  ),
);
