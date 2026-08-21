"use client";

import { useSyncExternalStore } from "react";
import { getAllLocations } from "@/data/locations";
import {
  getRuntimeCatalogRevision,
  subscribeRuntimeCatalog,
} from "@/lib/runtime-data";
import type { StoreLocation } from "@/types";

function getSnapshot(): StoreLocation[] {
  // Revision is read so React re-renders when catalog mutates.
  void getRuntimeCatalogRevision();
  return getAllLocations();
}

function getServerSnapshot(): StoreLocation[] {
  return getAllLocations();
}

/** Live store list — updates when bootstrap loads or dashboard add/edit/remove runs. */
export function useRuntimeLocations() {
  return useSyncExternalStore(subscribeRuntimeCatalog, getSnapshot, getServerSnapshot);
}
