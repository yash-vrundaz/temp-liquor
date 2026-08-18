import { getAllLocations, getStock } from "@/data/locations";
import { getAllEvents } from "@/data/events";

export const LOW_STOCK_THRESHOLD = 5;
export const REORDER_POINT = 3;

export function stockKey(locationId: string, productId: string) {
  return `${locationId}:${productId}`;
}

/** Catalog seed — never mutates. Used to initialize / reset live inventory. */
export function getCatalogStock(locationId: string, productId: string) {
  return getStock(locationId, productId)?.stock ?? 0;
}

export function seedBottleStocks(): Record<string, number> {
  const stocks: Record<string, number> = {};
  for (const loc of getAllLocations()) {
    for (const item of loc.inventory) {
      stocks[stockKey(loc.id, item.productId)] = Math.max(0, item.stock);
    }
  }
  return stocks;
}

export function seedEventSeats(): Record<string, number> {
  return Object.fromEntries(getAllEvents().map((e) => [e.id, e.seatsAvailable]));
}

export function mergeSeedStocks(
  saved: Record<string, number> | undefined,
  seed: Record<string, number>,
): Record<string, number> {
  if (!saved) return { ...seed };
  return { ...seed, ...saved };
}

export function stockStatus(onHand: number): "out" | "low" | "ok" {
  if (onHand <= 0) return "out";
  if (onHand <= REORDER_POINT) return "low";
  return "ok";
}
