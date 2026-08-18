"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAllLocations, getLocationById } from "@/data/locations";
import type { StoreLocation } from "@/types";

type BranchState = {
  branchId: string;
  setBranch: (id: string) => void;
  branch: () => StoreLocation;
};

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branchId: "loc1",
      setBranch: (id) => set({ branchId: id }),
      branch: () => {
        const locs = getAllLocations();
        return getLocationById(get().branchId) ?? locs[0];
      },
    }),
    { name: "sams-branch" },
  ),
);
