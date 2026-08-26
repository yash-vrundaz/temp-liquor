import type { Metadata } from "next";
import { CategoryPage } from "./CategoryClient";
import { getCategories } from "@/data/categories";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const meta = getCategories().find((item) => item.slug === category);
  if (!meta) {
    return { title: "Collection", robots: { index: false, follow: true } };
  }
  return {
    title: meta.name,
    description: meta.description || `Shop ${meta.name} at Sam's Discount Liquor.`,
  };
}

export default async function Page({ params }: Props) {
  await params;
  return <CategoryPage />;
}
