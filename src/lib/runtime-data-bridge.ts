/* Lazy load breaks circular deps between seed data and runtime cache. */
let cache: typeof import("@/lib/runtime-data") | null = null;

export function runtimeData() {
  if (!cache) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cache = require("@/lib/runtime-data") as typeof import("@/lib/runtime-data");
  }
  return cache;
}

export function productData() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/data/products") as typeof import("@/data/products");
}
