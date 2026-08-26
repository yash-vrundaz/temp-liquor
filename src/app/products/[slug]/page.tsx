import type { Metadata } from "next";
import { ProductDetailPage } from "./ProductDetailClient";
import { fetchProductBySlug } from "@/lib/db/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug).catch(() => undefined);
  if (!product) {
    return { title: "Bottle", robots: { index: false, follow: true } };
  }
  const description = product.description.slice(0, 160);
  const image = product.images[0];
  return {
    title: `${product.name} · ${product.brand}`,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  await params;
  return <ProductDetailPage />;
}
