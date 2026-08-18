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
import { useInventoryStore } from "@/store/inventory";
import { setCurrentActorId } from "@/lib/current-actor";

export { isStaffRole, canManageUsers };

function applySession(isLoggedIn: boolean, profile: UserProfile) {
  setCurrentActorId(isLoggedIn ? profile.id : undefined);
  return { isLoggedIn, profile };
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
    patch: Partial<Pick<UserProfile, "name" | "email" | "avatarUrl">> & { password?: string },
  ) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
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
    const { user } = await apiLogin(email, password);
    set({ ...applySession(true, user), authReady: true });
  },
  signup: async (name, email, password) => {
    const { user } = await apiSignup(name, email, password);
    set({ ...applySession(true, user), authReady: true });
  },
  logout: async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error(error);
    }
    set({ ...applySession(false, demoUser), authReady: true });
  },
  hydrateSession: async () => {
    try {
      const { user } = await apiMe();
      set({ ...applySession(true, user), authReady: true });
    } catch {
      set({ ...applySession(false, demoUser), authReady: true });
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
    set((s) => applySession(s.isLoggedIn, user));
  },
  updateProfile: async (patch) => {
    const { user } = await apiUpdateMe(patch);
    set((s) => applySession(s.isLoggedIn, user));
  },
  changePassword: async (password) => {
    await apiUpdateMe({ password });
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
    if (!order || order.status === "cancelled") return null;
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
              .syncFromServer(res.inventory.stocks, res.inventory.seats);
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
