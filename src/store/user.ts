"use client";

import { create } from "zustand";
import { demoUser } from "@/data/events";
import type { Order, UserProfile } from "@/types";
import { isDbConnected } from "@/lib/runtime-data";
import { isStaffRole, canManageUsers } from "@/lib/auth/roles";
import {
  apiCancelOrder,
  apiLogin,
  apiLogout,
  apiMe,
  apiRedeemPoints,
  apiSignup,
  apiUpdateMe,
} from "@/lib/api-mutations";
import { clearClientAccessToken, setClientAccessToken } from "@/lib/auth/client-token";
import { useInventoryStore } from "@/store/inventory";
import { useBranchStore } from "@/store/branch";
import { useWishlistStore } from "@/store/wishlist";
import { useCartStore } from "@/store/cart";
import { setCurrentActorId } from "@/lib/current-actor";

export { isStaffRole, canManageUsers };

function applyAuth(isLoggedIn: boolean, profile: UserProfile) {
  setCurrentActorId(isLoggedIn ? profile.id : undefined);
  if (isLoggedIn) {
    useWishlistStore.getState().bindUser(profile.id);
    useCartStore.getState().bindUser(profile.id);
  } else {
    useWishlistStore.getState().unbindUser();
    useCartStore.getState().unbindUser();
  }
  return { isLoggedIn, profile };
}

function syncPreferredBranch(profile: UserProfile) {
  if (profile.preferredBranchId) {
    useBranchStore.getState().setBranch(profile.preferredBranchId);
  }
}

type UserState = {
  isLoggedIn: boolean;
  profile: UserProfile;
  authReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrateSession: () => Promise<void>;
  addViewed: (productId: string) => void;
  setPreferredBranch: (id: string) => void;
  updateName: (name: string) => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<UserProfile, "name" | "email" | "avatarUrl">> & {
      password?: string;
      currentPassword?: string;
    },
  ) => Promise<void>;
  changePassword: (password: string, currentPassword: string) => Promise<void>;
  redeemPoints: (points: number) => boolean;
  addOrder: (order: Order, options?: { loyaltyPoints?: number }) => void;
  cancelOrder: (orderId: string) => Order | null;
  isStaff: () => boolean;
  canManageUsers: () => boolean;
};

export const useUserStore = create<UserState>()((set, get) => ({
  isLoggedIn: false,
  profile: demoUser,
  authReady: false,
  login: async (email, password) => {
    const { user, accessToken } = await apiLogin(email, password);
    setClientAccessToken(accessToken);
    syncPreferredBranch(user);
    set({ ...applyAuth(true, user), authReady: true });
  },
  signup: async (name, email, password) => {
    const { user, accessToken } = await apiSignup(name, email, password);
    setClientAccessToken(accessToken);
    syncPreferredBranch(user);
    set({ ...applyAuth(true, user), authReady: true });
  },
  logout: async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error(error);
    }
    clearClientAccessToken();
    set({ ...applyAuth(false, demoUser), authReady: true });
  },
  hydrateSession: async () => {
    try {
      const { user } = await apiMe();
      syncPreferredBranch(user);
      set({ ...applyAuth(true, user), authReady: true });
    } catch {
      clearClientAccessToken();
      set({ ...applyAuth(false, demoUser), authReady: true });
    }
  },
  addViewed: (productId) =>
    set((s) => {
      const recentlyViewed = [
        productId,
        ...s.profile.recentlyViewed.filter((id) => id !== productId),
      ].slice(0, 12);
      if (isDbConnected() && s.isLoggedIn) {
        void apiUpdateMe({ recentlyViewed }).catch(console.error);
      }
      return {
        profile: { ...s.profile, recentlyViewed },
      };
    }),
  setPreferredBranch: (id) =>
    set((s) => {
      if (isDbConnected() && s.isLoggedIn) {
        void apiUpdateMe({ preferredBranchId: id }).catch(console.error);
      }
      return {
        profile: { ...s.profile, preferredBranchId: id },
      };
    }),
  updateName: async (name) => {
    const { user } = await apiUpdateMe({ name });
    set((s) => applyAuth(s.isLoggedIn, user));
  },
  updateProfile: async (patch) => {
    const { user } = await apiUpdateMe(patch);
    set((s) => applyAuth(s.isLoggedIn, user));
  },
  changePassword: async (password, currentPassword) => {
    await apiUpdateMe({ password, currentPassword });
  },
  redeemPoints: (points) => {
    const current = get().profile.loyaltyPoints;
    if (current < points) return false;
    if (isDbConnected()) {
      void apiRedeemPoints(points).catch(console.error);
    }
    set((s) => ({
      profile: { ...s.profile, loyaltyPoints: current - points },
    }));
    return true;
  },
  addOrder: (order, options) =>
    set((s) => {
      const pointsEarned = Math.max(0, Math.floor(order.total));
      const existing = s.profile.orders.filter((o) => o.id !== order.id);
      return {
        profile: {
          ...s.profile,
          orders: [order, ...existing],
          loyaltyPoints: options?.loyaltyPoints ?? s.profile.loyaltyPoints + pointsEarned,
        },
      };
    }),
  cancelOrder: (orderId) => {
    const order = get().profile.orders.find((o) => o.id === orderId);
    if (!order || order.status === "cancelled" || order.status === "delivered") return null;
    set((s) => ({
      profile: {
        ...s.profile,
        orders: s.profile.orders.map((o) =>
          o.id === orderId ? { ...o, status: "cancelled" as const } : o,
        ),
      },
    }));
    if (isDbConnected()) {
      void apiCancelOrder(get().profile.id, orderId)
        .then((res) => {
          if (res.inventory) {
            useInventoryStore
              .getState()
              .syncFromServer(res.inventory.stocks, res.inventory.seats, res.inventory.hidden);
          }
        })
        .catch(console.error);
    }
    return order;
  },
  isStaff: () => {
    const s = get();
    return s.isLoggedIn && isStaffRole(s.profile);
  },
  canManageUsers: () => {
    const s = get();
    return s.isLoggedIn && canManageUsers(s.profile);
  },
}));
