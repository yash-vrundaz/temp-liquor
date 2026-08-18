import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "@/types";
import { products } from "@/data/products";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatAbv(abv: number) {
  return `${abv}% ABV`;
}

export function calculateTax(subtotal: number, rate = 0.08875) {
  return Math.round(subtotal * rate * 100) / 100;
}

export function calculateShipping(subtotal: number, fulfillment: "delivery" | "pickup") {
  if (fulfillment === "pickup") return 0;
  if (subtotal >= 150) return 0;
  return 12.5;
}

export function getRecommendations(
  prefs: {
    viewedIds?: string[];
    brandFavorites?: string[];
    maxPrice?: number;
    occasion?: string;
  },
  limit = 6,
): Product[] {
  const scored = products.map((p) => {
    let score = 0;
    if (prefs.viewedIds?.includes(p.id)) score += 3;
    if (prefs.brandFavorites?.some((b) => p.brand.toLowerCase().includes(b.toLowerCase())))
      score += 4;
    if (prefs.maxPrice && p.price <= prefs.maxPrice) score += 2;
    if (prefs.occasion === "gift" && p.tags.includes("gift")) score += 5;
    if (prefs.occasion === "celebration" && (p.category === "champagne" || p.isPremium))
      score += 5;
    if (p.isPremium) score += 1;
    score += p.rating;
    return { p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.p)
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, limit);
}

export function safeInternalPath(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

export const SITE = {
  name: "Sam's Discount Liquor",
  tagline: "Great bottles. Better prices.",
  url: "https://samsdiscountliquor.com",
  description:
    "Sam's Discount Liquor — immersive shopping with a virtual showroom, AR bottle viewing, and curated collections across three New York locations.",
};
