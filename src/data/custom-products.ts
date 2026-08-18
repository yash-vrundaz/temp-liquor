import type { Product } from "@/types";

/** Mutable registry so static helpers can resolve owner-created bottles. */
let customProducts: Product[] = [];

export function setCustomProducts(list: Product[]) {
  customProducts = list;
}

export function getCustomProducts() {
  return customProducts;
}

export function getCustomProductById(id: string) {
  return customProducts.find((p) => p.id === id);
}

export function getCustomProductBySlug(slug: string) {
  return customProducts.find((p) => p.slug === slug);
}
