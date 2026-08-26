import type { Metadata } from "next";
import { ARPage } from "./ARViewerClient";
import { fetchProductBySlug } from "@/lib/db/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug).catch(() => undefined);
  if (!product) {
    return { title: "AR viewer", robots: { index: false, follow: true } };
  }
  return {
    title: `View ${product.name} in AR`,
    description: `Place ${product.name} in your space with augmented reality.`,
  };
}

export default async function Page({ params }: Props) {
  await params;
  return <ARPage />;
}
