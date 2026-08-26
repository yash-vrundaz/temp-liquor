import { NextResponse } from "next/server";
import {
  adjustInventory,
  deductOrderStock,
  fetchInventoryState,
  resetInventory,
  setInventoryOnHand,
  setProductVisibility,
} from "@/lib/db/queries";
import { inventoryPatchSchema } from "@/lib/db/validators";
import { requirePermission } from "@/lib/auth/require";
import { canAccessLocation, hasAllLocationAccess } from "@/lib/auth/location-access";

export async function GET() {
  try {
    const inventory = await fetchInventoryState();
    return NextResponse.json(inventory);
  } catch (error) {
    console.error("[GET /api/inventory]", error);
    return NextResponse.json({ error: "Failed to fetch inventory." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = inventoryPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid inventory payload." }, { status: 400 });
    }
    const body = parsed.data;
    const needsRestock =
      (body.action === "adjust" && body.reason === "restock" && body.delta > 0) ||
      (body.action === "set" && body.reason === "restock");
    const permissionKey =
      body.action === "reset"
        ? ("inventory.reset" as const)
        : body.action === "visibility"
          ? ("inventory.adjust" as const)
          : needsRestock
            ? ("inventory.restock" as const)
            : ("inventory.adjust" as const);
    const allowed = await requirePermission(permissionKey);
    if (allowed.error) return allowed.error;
    const actorUserId = allowed.user.id;
    if (body.action === "reset" && !body.locationId && !hasAllLocationAccess(allowed.user)) {
      return NextResponse.json(
        { error: "You can only reset stores you are assigned to." },
        { status: 403 },
      );
    }
    if (
      "locationId" in body &&
      body.locationId &&
      !canAccessLocation(allowed.user, body.locationId)
    ) {
      return NextResponse.json({ error: "You cannot change stock for that store." }, { status: 403 });
    }

    if (body.action === "set") {
      const onHand = await setInventoryOnHand(
        body.locationId,
        body.productId,
        body.quantity,
        body.reason ?? "adjustment",
        undefined,
        actorUserId,
      );
      return NextResponse.json({ ok: true, onHand });
    }

    if (body.action === "adjust") {
      const ok = await adjustInventory(
        body.locationId,
        body.productId,
        body.delta,
        body.reason ?? "adjustment",
        body.orderId,
        actorUserId,
      );
      if (!ok) {
        return NextResponse.json({ error: "Insufficient stock." }, { status: 409 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "deduct") {
      const result = await deductOrderStock(body.locationId, body.items, body.orderId);
      if (!result.ok) {
        return NextResponse.json({ ok: false, shortfalls: result.shortfalls }, { status: 409 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "visibility") {
      const result = await setProductVisibility(
        body.locationId,
        body.productId,
        body.hidden,
        actorUserId,
      );
      return NextResponse.json({ ok: true, ...result });
    }

    await resetInventory(body.locationId, actorUserId);
    const inventory = await fetchInventoryState();
    return NextResponse.json({ ok: true, inventory });
  } catch (error) {
    console.error("[PATCH /api/inventory]", error);
    return NextResponse.json({ error: "Failed to update inventory." }, { status: 500 });
  }
}
