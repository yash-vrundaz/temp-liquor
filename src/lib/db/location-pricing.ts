import { prisma, isDbConfigured } from "@/lib/db/prisma";
import { DEFAULT_FULFILLMENT_PRICING } from "@/lib/fulfillment-pricing";

let locationPricingSchemaReady = false;

/** Ensures delivery/pricing columns exist on older databases without a full migrate. */
export async function ensureLocationPricingSchema() {
  if (!isDbConfigured() || locationPricingSchemaReady) return;
  await prisma.$executeRawUnsafe(
    `ALTER TABLE locations ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN NOT NULL DEFAULT true`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE locations ADD COLUMN IF NOT EXISTS delivery_fee DOUBLE PRECISION NOT NULL DEFAULT 12.5`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE locations ADD COLUMN IF NOT EXISTS delivery_free_minimum DOUBLE PRECISION NOT NULL DEFAULT 150`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE locations ADD COLUMN IF NOT EXISTS tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0.08875`,
  );
  locationPricingSchemaReady = true;
}

export type LocationPricingRow = {
  deliveryAvailable?: boolean | null;
  deliveryFee?: number | null;
  deliveryFreeMinimum?: number | null;
  taxRate?: number | null;
};

export function mapLocationPricing(row: LocationPricingRow | Record<string, unknown>) {
  const source = row as LocationPricingRow;
  return {
    deliveryAvailable: source.deliveryAvailable ?? DEFAULT_FULFILLMENT_PRICING.deliveryAvailable,
    deliveryFee: source.deliveryFee ?? DEFAULT_FULFILLMENT_PRICING.deliveryFee,
    deliveryFreeMinimum: source.deliveryFreeMinimum ?? DEFAULT_FULFILLMENT_PRICING.deliveryFreeMinimum,
    taxRate: source.taxRate ?? DEFAULT_FULFILLMENT_PRICING.taxRate,
  };
}
