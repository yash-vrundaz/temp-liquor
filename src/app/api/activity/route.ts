import { NextResponse } from "next/server";
import { fetchActivityLogs } from "@/lib/db/activity";
import { requirePermission } from "@/lib/auth/require";
import {
  accessibleLocations,
  canAccessLocation,
  hasAllLocationAccess,
} from "@/lib/auth/location-access";

export async function GET(request: Request) {
  try {
    const { user, error } = await requirePermission("activity.view");
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const requestedLocationId = searchParams.get("locationId") ?? undefined;

    if (
      requestedLocationId &&
      requestedLocationId !== "all" &&
      !canAccessLocation(user, requestedLocationId)
    ) {
      return NextResponse.json({ logs: [], total: 0 });
    }

    const scopedLocationIds = hasAllLocationAccess(user)
      ? undefined
      : accessibleLocations(user).map((loc) => loc.id);

    const result = await fetchActivityLogs({
      action: searchParams.get("action") ?? undefined,
      actorUserId: searchParams.get("actorUserId") ?? undefined,
      entityType: searchParams.get("entityType") ?? undefined,
      locationId:
        requestedLocationId && requestedLocationId !== "all"
          ? requestedLocationId
          : undefined,
      locationIds: scopedLocationIds,
      q: searchParams.get("q") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 50),
      offset: Number(searchParams.get("offset") ?? 0),
      sortKey: searchParams.get("sortKey") ?? undefined,
      sortDir: searchParams.get("sortDir") === "asc" ? "asc" : "desc",
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/activity]", error);
    return NextResponse.json({ error: "Failed to load activity logs." }, { status: 500 });
  }
}
