import type { CategorySlug } from "@/types";

export const categories: {
  slug: CategorySlug;
  name: string;
  tagline: string;
  description: string;
  color: string;
}[] = [
  {
    slug: "whiskey",
    name: "Whiskey",
    tagline: "Aged character",
    description: "Bold expressions from grain to glass.",
    color: "#8B5A2B",
  },
  {
    slug: "scotch",
    name: "Scotch",
    tagline: "Highland heritage",
    description: "Peat, oak, and centuries of craft.",
    color: "#C9A962",
  },
  {
    slug: "bourbon",
    name: "Bourbon",
    tagline: "American oak",
    description: "Sweet corn warmth and charred barrel depth.",
    color: "#B87333",
  },
  {
    slug: "vodka",
    name: "Vodka",
    tagline: "Crystal clarity",
    description: "Pure distillates for elevated mixing.",
    color: "#A8C5D4",
  },
  {
    slug: "gin",
    name: "Gin",
    tagline: "Botanical elegance",
    description: "Juniper-forward spirits with citrus lift.",
    color: "#7BA17B",
  },
  {
    slug: "rum",
    name: "Rum",
    tagline: "Caribbean soul",
    description: "Molasses richness and tropical spice.",
    color: "#A0522D",
  },
  {
    slug: "tequila",
    name: "Tequila",
    tagline: "Agave fire",
    description: "From highland estates to your bar.",
    color: "#D4C48A",
  },
  {
    slug: "brandy",
    name: "Brandy",
    tagline: "Fruit & oak",
    description: "Distilled fruit with velvet finish.",
    color: "#8B4513",
  },
  {
    slug: "cognac",
    name: "Cognac",
    tagline: "French refinement",
    description: "Grande Champagne prestige in every pour.",
    color: "#DAA520",
  },
  {
    slug: "wine",
    name: "Wine",
    tagline: "Vineyard stories",
    description: "Curated bottles from world-class terroirs.",
    color: "#722F37",
  },
  {
    slug: "beer",
    name: "Beer",
    tagline: "Craft pours",
    description: "Local and imported selections on ice.",
    color: "#D4A017",
  },
  {
    slug: "champagne",
    name: "Champagne",
    tagline: "Celebration",
    description: "Prestige cuvées and vintage bubbles.",
    color: "#F5E6C8",
  },
  {
    slug: "liqueur",
    name: "Liqueur",
    tagline: "Sweet finish",
    description: "Herbals, creams, and dessert spirits.",
    color: "#9B6B9E",
  },
  {
    slug: "mezcal",
    name: "Mezcal",
    tagline: "Smoke & agave",
    description: "Artisanal agave spirits from Oaxaca and beyond.",
    color: "#6B5344",
  },
  {
    slug: "rtd",
    name: "Ready to Drink",
    tagline: "Cocktails to go",
    description: "Premixed cocktails, hard seltzers, and party-ready cans.",
    color: "#E07A5F",
  },
];

import { runtimeData } from "@/lib/runtime-data-bridge";

export function getCategories() {
  return runtimeData().getRuntimeCategories();
}
