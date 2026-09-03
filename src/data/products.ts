import type { Product } from "@/types";
import {
  getCustomProductById,
  getCustomProductBySlug,
  getCustomProducts,
} from "@/data/custom-products";
import { marketCatalog } from "@/data/market-catalog";

/** Shop catalog from Spec's, Total Wine, and Ly's Liquor. */
export const products: Product[] = [...marketCatalog];

for (const p of products) {
  p.glbUrl = `/models/bottles/${p.slug}.glb`;
}

import { runtimeData } from "@/lib/runtime-data-bridge";

export function getAllProducts() {
  const runtime = runtimeData().getRuntimeProducts();
  const custom = getCustomProducts();
  const runtimeIds = new Set(runtime.map((p) => p.id));
  return [...runtime, ...custom.filter((p) => !runtimeIds.has(p.id))];
}

export function getProductBySlug(slug: string) {
  return (
    runtimeData().getRuntimeProducts().find((p) => p.slug === slug) ??
    getCustomProductBySlug(slug)
  );
}

export function getProductById(id: string) {
  return (
    runtimeData().getRuntimeProducts().find((p) => p.id === id) ??
    getCustomProductById(id)
  );
}

export function getProductsByCategory(category: string) {
  return runtimeData().getRuntimeProductsByCategory(category);
}

export function getSimilarProducts(product: Product, limit = 4) {
  return runtimeData().getRuntimeSimilarProducts(product, limit);
}

export function getProductsByBrand(brand: string) {
  return getAllProducts().filter(
    (p) => p.brand.toLowerCase() === brand.toLowerCase(),
  );
}

export function isCatalogProduct(id: string) {
  return runtimeData().isCatalogProductId(id);
}
