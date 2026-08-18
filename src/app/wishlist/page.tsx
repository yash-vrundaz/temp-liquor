"use client";

import { useWishlistStore } from "@/store/wishlist";
import { getProductById } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";

export default function WishlistPage() {
  const ids = useWishlistStore((s) => s.ids);
  const products = ids.map((id) => getProductById(id)).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4 sm:py-14 md:px-8 md:py-16">
      <h1 className="font-display text-3xl text-cream sm:text-4xl">Wishlist</h1>
      {!products.length ? (
        <p className="mt-6 text-muted">
          No saved bottles yet.{" "}
          <Link href="/shop" className="text-gold">
            Explore collections
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {products.map(
            (p, i) => p && <ProductCard key={p.id} product={p} index={i} />,
          )}
        </div>
      )}
    </div>
  );
}
