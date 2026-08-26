import { prisma, isDbConfigured } from "@/lib/db/prisma";

let inventoryVisibilitySchemaReady = false;

/**
 * Ensures location_inventory.hidden exists on older databases without a full migrate.
 *
 * Must be awaited before any typed Prisma read of LocationInventory (including
 * `location.findMany({ include: { inventory: true } })`), because Prisma selects
 * every column in the schema and errors with P2022 when one is missing.
 *
 * Always call this outside `$transaction` — the ALTER needs ACCESS EXCLUSIVE and
 * would block behind locks held by an open transaction on the same table.
 */
export async function ensureInventoryVisibilityColumn() {
  if (!isDbConfigured() || inventoryVisibilitySchemaReady) return;
  await prisma.$executeRawUnsafe(
    `ALTER TABLE location_inventory ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`,
  );
  inventoryVisibilitySchemaReady = true;
}
