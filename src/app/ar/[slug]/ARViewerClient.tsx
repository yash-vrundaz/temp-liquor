"use client";

import { notFound, useParams } from "next/navigation";
import { getProductBySlug } from "@/data/products";
import { ARViewer } from "@/components/ar/ARViewer";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function ARPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-10 sm:px-4 sm:py-12 md:px-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
        Augmented Reality
      </p>
      <h1 className="mt-2 font-display text-3xl text-cream sm:text-4xl md:text-5xl">
        View in Your Space
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Rotate the real 3D bottle below. On a phone, tap View in Your Space to place it on your
        table (Android WebXR / Scene Viewer, iPhone Quick Look).
      </p>
      <div className="mt-8">
        <ARViewer product={product} />
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={`/products/${product.slug}`} className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">Back to product</Button>
        </Link>
        <Link href="/virtual-store" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">Return to showroom</Button>
        </Link>
      </div>
    </div>
  );
}
