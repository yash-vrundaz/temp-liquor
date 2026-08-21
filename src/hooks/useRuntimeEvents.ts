"use client";

import { useSyncExternalStore } from "react";
import { getAllEvents, getPublicEvents } from "@/data/events";
import {
  getRuntimeCatalogRevision,
  subscribeRuntimeCatalog,
} from "@/lib/runtime-data";
import type { EventItem } from "@/types";

/** Cache filtered lists so useSyncExternalStore keeps a stable snapshot reference. */
let publicCacheRev = -1;
let publicCache: EventItem[] = getPublicEvents();

function publicSnapshot(): EventItem[] {
  const rev = getRuntimeCatalogRevision();
  if (rev !== publicCacheRev) {
    publicCacheRev = rev;
    publicCache = getPublicEvents();
  }
  return publicCache;
}

function allSnapshot(): EventItem[] {
  void getRuntimeCatalogRevision();
  return getAllEvents();
}

/** All events (dashboard) — updates after bootstrap / add / hide / remove. */
export function useRuntimeEvents() {
  return useSyncExternalStore(subscribeRuntimeCatalog, allSnapshot, getAllEvents);
}

/** Active events only (public site). */
export function usePublicEvents() {
  return useSyncExternalStore(subscribeRuntimeCatalog, publicSnapshot, getPublicEvents);
}
