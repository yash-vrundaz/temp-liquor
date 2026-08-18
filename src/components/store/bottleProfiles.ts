import type { CategorySlug } from "@/types";

export type BottleShape =
  | "scotch"
  | "bourbon-square"
  | "vodka"
  | "gin"
  | "rum"
  | "tequila"
  | "cognac"
  | "wine"
  | "champagne"
  | "beer"
  | "liqueur";

/** Real-world bottle silhouette [radius, height] pairs for LatheGeometry (0–1 height). */
export const BOTTLE_PROFILES: Record<BottleShape, [number, number][]> = {
  scotch: [
    [0.0, 0.0],
    [0.22, 0.0],
    [0.225, 0.03],
    [0.21, 0.45],
    [0.2, 0.55],
    [0.14, 0.62],
    [0.085, 0.7],
    [0.075, 0.88],
    [0.08, 0.94],
    [0.09, 0.98],
    [0.0, 0.98],
  ],
  "bourbon-square": [
    // used as circular fallback; square uses separate mesh
    [0.0, 0.0],
    [0.2, 0.0],
    [0.2, 0.02],
    [0.19, 0.5],
    [0.12, 0.58],
    [0.07, 0.68],
    [0.065, 0.9],
    [0.075, 0.96],
    [0.0, 0.96],
  ],
  vodka: [
    [0.0, 0.0],
    [0.175, 0.0],
    [0.18, 0.02],
    [0.175, 0.55],
    [0.12, 0.65],
    [0.07, 0.72],
    [0.065, 0.95],
    [0.08, 1.0],
    [0.0, 1.0],
  ],
  gin: [
    [0.0, 0.0],
    [0.2, 0.0],
    [0.205, 0.03],
    [0.19, 0.42],
    [0.16, 0.52],
    [0.09, 0.62],
    [0.07, 0.9],
    [0.085, 0.96],
    [0.0, 0.96],
  ],
  rum: [
    [0.0, 0.0],
    [0.21, 0.0],
    [0.215, 0.04],
    [0.2, 0.4],
    [0.18, 0.5],
    [0.1, 0.6],
    [0.075, 0.7],
    [0.07, 0.92],
    [0.085, 0.98],
    [0.0, 0.98],
  ],
  tequila: [
    [0.0, 0.0],
    [0.19, 0.0],
    [0.2, 0.05],
    [0.22, 0.35],
    [0.18, 0.5],
    [0.09, 0.62],
    [0.07, 0.9],
    [0.09, 0.97],
    [0.0, 0.97],
  ],
  cognac: [
    [0.0, 0.0],
    [0.23, 0.0],
    [0.24, 0.04],
    [0.23, 0.35],
    [0.14, 0.55],
    [0.08, 0.68],
    [0.07, 0.9],
    [0.09, 0.97],
    [0.0, 0.97],
  ],
  wine: [
    [0.0, 0.0],
    [0.16, 0.0],
    [0.165, 0.03],
    [0.17, 0.35],
    [0.15, 0.5],
    [0.07, 0.62],
    [0.055, 0.75],
    [0.055, 0.95],
    [0.07, 1.0],
    [0.0, 1.0],
  ],
  champagne: [
    [0.0, 0.0],
    [0.155, 0.0],
    [0.16, 0.03],
    [0.165, 0.4],
    [0.12, 0.55],
    [0.06, 0.7],
    [0.055, 0.92],
    [0.07, 0.98],
    [0.0, 0.98],
  ],
  beer: [
    [0.0, 0.0],
    [0.14, 0.0],
    [0.145, 0.02],
    [0.14, 0.55],
    [0.1, 0.65],
    [0.065, 0.75],
    [0.06, 0.92],
    [0.07, 0.98],
    [0.0, 0.98],
  ],
  liqueur: [
    [0.0, 0.0],
    [0.18, 0.0],
    [0.185, 0.03],
    [0.17, 0.45],
    [0.1, 0.58],
    [0.07, 0.7],
    [0.065, 0.92],
    [0.08, 0.98],
    [0.0, 0.98],
  ],
};

export function shapeForCategory(category: CategorySlug): BottleShape {
  switch (category) {
    case "bourbon":
      return "bourbon-square";
    case "scotch":
    case "whiskey":
      return "scotch";
    case "vodka":
      return "vodka";
    case "gin":
      return "gin";
    case "rum":
      return "rum";
    case "tequila":
      return "tequila";
    case "cognac":
    case "brandy":
      return "cognac";
    case "wine":
      return "wine";
    case "champagne":
      return "champagne";
    case "beer":
      return "beer";
    case "liqueur":
      return "liqueur";
    default:
      return "scotch";
  }
}
