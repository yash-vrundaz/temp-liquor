"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist";
import { useUserStore } from "@/store/user";
import { getProductById } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";

export default function WishlistPage() {
  const authReady = useUserStore((s) => s.authReady);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const ids = useWishlistStore((s) => s.ids);
  const products = ids.map((id) => getProductById(id)).filter(Boolean);

  if (!authReady) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4 sm:py-14 md:px-8 md:py-16">
        <h1 className="font-display text-3xl text-cream sm:text-4xl">Wishlist</h1>
        <p className="mt-6 text-sm text-muted">Loading your saved bottles…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4 sm:py-14 md:px-8 md:py-16">
        <h1 className="font-display text-3xl text-cream sm:text-4xl">Wishlist</h1>
        <div className="mt-8 max-w-md border border-white/10 bg-white/[0.02] p-6">
          <Heart className="text-gold" size={22} />
          <p className="mt-4 font-display text-2xl text-cream">Sign in to save bottles</p>
          <p className="mt-2 text-sm text-muted">
            Your wishlist stays with your account. Sign out and it clears from this device until you
            sign back in.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/login?next=/wishlist">
              <Button size="sm">Sign in</Button>
            </Link>
            <Link href="/signup?next=/wishlist">
              <Button size="sm" variant="secondary">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
