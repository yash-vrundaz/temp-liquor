import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require";
import { driverPatchSchema, driverWriteSchema } from "@/lib/db/validators";
import {
  createDriver,
  deactivateDriver,
  listDriversForAdmin,
  updateDriver,
} from "@/lib/db/drivers-admin";
import { isDbConfigured } from "@/lib/db/prisma";
import { drivers as seedDrivers } from "@/data/drivers";
import { canAccessLocation } from "@/lib/auth/location-access";

export async function GET(request: Request) {
  const { user, error } = await requirePermission("deliveries.view");
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "1";
    const locationId = searchParams.get("locationId") ?? undefined;

    if (!isDbConfigured()) {
      let drivers = seedDrivers.filter((driver) => canAccessLocation(user, driver.locationId));
      if (locationId) drivers = drivers.filter((driver) => driver.locationId === locationId);
      if (!includeInactive) drivers = drivers.filter((driver) => driver.active);
      return NextResponse.json({ drivers });
    }

    const drivers = await listDriversForAdmin(user, { includeInactive, locationId });
    return NextResponse.json({ drivers });
  } catch (err) {
    console.error("[GET /api/drivers]", err);
    return NextResponse.json({ error: "Failed to load drivers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user, error } = await requirePermission("deliveries.manage");
  if (error) return error;
  try {
    const parsed = driverWriteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Driver name, phone, vehicle, and store are required." },
        { status: 400 },
      );
    }
    const { email, ...rest } = parsed.data;
    const result = await createDriver(user, { ...rest, email: email || undefined });
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ driver: result.driver });
  } catch (err) {
    console.error("[POST /api/drivers]", err);
    return NextResponse.json({ error: "Failed to create driver." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { user, error } = await requirePermission("deliveries.manage");
  if (error) return error;
  try {
    const parsed = driverPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid driver update." },
        { status: 400 },
      );
    }
    const { email, ...rest } = parsed.data.patch;
    const result = await updateDriver(user, parsed.data.driverId, {
      ...rest,
      ...(email !== undefined ? { email: email || undefined } : {}),
    });
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ driver: result.driver });
  } catch (err) {
    console.error("[PATCH /api/drivers]", err);
    return NextResponse.json({ error: "Failed to update driver." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, error } = await requirePermission("deliveries.manage");
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("id");
    if (!driverId) {
      return NextResponse.json({ error: "Driver id is required." }, { status: 400 });
    }
    const result = await deactivateDriver(user, driverId);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, driver: result.driver });
  } catch (err) {
    console.error("[DELETE /api/drivers]", err);
    return NextResponse.json({ error: "Failed to deactivate driver." }, { status: 500 });
  }
}
