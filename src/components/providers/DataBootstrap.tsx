"use client";

import { useEffect } from "react";
import { hydrateRuntimeData } from "@/lib/runtime-data";
import { useInventoryStore } from "@/store/inventory";
import { useUserStore } from "@/store/user";

function whenHydrated(
  persistApi: { hasHydrated: () => boolean; onFinishHydration: (cb: () => void) => () => void },
  fn: () => void,
) {
  if (persistApi.hasHydrated()) {
    fn();
    return () => {};
  }
  return persistApi.onFinishHydration(fn);
}

export function DataBootstrap() {
  const setHydrated = useInventoryStore((s) => s.setHydrated);
  const syncFromServer = useInventoryStore((s) => s.syncFromServer);
  const hydrateSession = useUserStore((s) => s.hydrateSession);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const res = await fetch("/api/bootstrap");
        if (!res.ok) throw new Error("bootstrap failed");
        const data = await res.json();
        if (cancelled) return;

        hydrateRuntimeData({
          products: data.products,
          locations: data.locations,
          categories: data.categories,
          events: data.events,
          reviews: data.reviews,
          dbConnected: data.dbConnected,
        });

        if (data.inventory?.stocks) {
          syncFromServer(data.inventory.stocks, data.inventory.seats);
        } else {
          setHydrated(true);
        }
      } catch (error) {
        console.warn("[DataBootstrap] Using seed fallback:", error);
        if (!cancelled) setHydrated(true);
      }
    }

    const unsubInventory = whenHydrated(useInventoryStore.persist, () => {
      void loadCatalog();
    });
    void hydrateSession();

    return () => {
      cancelled = true;
      unsubInventory();
    };
  }, [setHydrated, syncFromServer, hydrateSession]);

  return null;
}
