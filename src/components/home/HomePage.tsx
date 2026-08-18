"use client";

import Link from "next/link";
import { products } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { LandingHero } from "./LandingHero";
import { BottleCarousel } from "./BottleCarousel";
import { ExperienceCollections } from "./ExperienceCollections";
import { HomeLocations } from "./HomeLocations";
import { HomeEvents } from "./HomeEvents";

export function HomePage() {
  const featured = products.filter((p) => p.isPremium).slice(0, 4);
  const carouselBottles = products.filter((p) => p.brand === "Jack Daniel's");

  return (
    <>
      <LandingHero />

      <BottleCarousel
        products={carouselBottles}
        eyebrow="Our whiskeys"
        title="Explore the collection"
      />

      <ExperienceCollections />

      <section className="border-y border-white/5 bg-[#0a0a0a] py-24">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Premium"
              title="House selections"
              className="mb-0"
            />
            <Link href="/shop" className="shrink-0">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <HomeLocations />

      <HomeEvents />
    </>
  );
}
