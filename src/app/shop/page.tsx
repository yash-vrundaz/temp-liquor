import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/ShopCatalog";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse premium spirits, wine, beer, and champagne at Sam's Discount Liquor.",
};

export default function ShopPage() {
  return <ShopCatalog />;
}
