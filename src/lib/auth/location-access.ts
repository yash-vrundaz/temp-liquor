import type { UserRole } from "@/types";
import { getAllLocations } from "@/data/locations";
import type { StoreLocation } from "@/types";

export type LocationAccessSubject = {
  role: UserRole;
  allowedLocationIds?: string[] | null;
};

export function parseLocationIds(value: unknown): string[] | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return parseLocationIds(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value)) return null;
  const ids = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return ids.length ? ids : [];
}

/** null = every store. Empty array is stored as null (all stores). */
export function normalizeAllowedLocationIds(
  role: UserRole,
  ids?: readonly string[] | null,
): string[] | null {
  if (role === "owner" || role === "customer") return null;
  if (ids == null) return null;
  const unique = [...new Set(ids.filter(Boolean))];
  return unique.length ? unique : null;
}

export function hasAllLocationAccess(subject: LocationAccessSubject) {
  if (subject.role === "owner") return true;
  return !subject.allowedLocationIds || subject.allowedLocationIds.length === 0;
}

export function canAccessLocation(subject: LocationAccessSubject, locationId: string) {
  if (locationId === "all") return hasAllLocationAccess(subject);
  if (hasAllLocationAccess(subject)) return true;
  return (subject.allowedLocationIds ?? []).includes(locationId);
}

export function accessibleLocations(subject: LocationAccessSubject, all = getAllLocations()): StoreLocation[] {
  if (hasAllLocationAccess(subject)) return all;
  const allowed = new Set(subject.allowedLocationIds ?? []);
  return all.filter((location) => allowed.has(location.id));
}

export function sanitizeAssignedLocations(
  actor: LocationAccessSubject,
  role: UserRole,
  requested: readonly string[] | null | undefined,
  knownIds: readonly string[],
) {
  const normalized = normalizeAllowedLocationIds(role, requested);
  if (normalized == null) return null;
  const actorIds = hasAllLocationAccess(actor)
    ? new Set(knownIds)
    : new Set((actor.allowedLocationIds ?? []).filter((id) => knownIds.includes(id)));
  const next = normalized.filter((id) => actorIds.has(id));
  return next.length ? next : null;
}
