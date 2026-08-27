"use client";

import { useSyncExternalStore } from "react";
import { getAllLocations } from "@/data/locations";
import {
  getRuntimeCatalogRevision,
  subscribeRuntimeCatalog,
} from "@/lib/runtime-data";
import type { StoreLocation } from "@/types";

let locationsCacheRev = -1;
let locationsCache: StoreLocation[] = getAllLocations();

function locationsSnapshot(): StoreLocation[] {
  const rev = getRuntimeCatalogRevision();
  if (rev !== locationsCacheRev) {
    locationsCacheRev = rev;
    locationsCache = getAllLocations();
  }
  return locationsCache;
}

/** Live store list — updates when bootstrap loads or dashboard add/edit/remove runs. */
export function useRuntimeLocations() {
  return useSyncExternalStore(subscribeRuntimeCatalog, locationsSnapshot, locationsSnapshot);
}
