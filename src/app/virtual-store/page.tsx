import type { Metadata } from "next";
import { VirtualStoreClient } from "./VirtualStoreClient";

export const metadata: Metadata = {
  title: "Virtual Store",
  description:
    "Walk through Sam's Discount Liquor in 3D — whiskey, vodka, rum, gin, wine, premium and imported collections.",
};

export default function VirtualStorePage() {
  return (
    <div>
      <div className="flex flex-col gap-2 border-b border-white/5 px-3 py-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:px-4 sm:py-3 md:px-8">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
            Immersive showroom
          </p>
          <h1 className="font-display text-lg text-cream sm:text-2xl md:text-3xl">
            Virtual Liquor Store
          </h1>
        </div>
        <p className="text-[11px] text-muted sm:hidden">
          Drag to look · Tap aisle · Tap bottles
        </p>
        <p className="hidden text-xs text-muted sm:block md:hidden">
          Drag to look · Tap aisles and bottles
        </p>
        <p className="hidden text-xs text-muted md:block">
          U-shaped aisles · WASD walk · Click bottles
        </p>
      </div>
      <VirtualStoreClient />
    </div>
  );
}
