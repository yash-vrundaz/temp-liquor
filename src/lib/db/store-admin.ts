import { prisma, isDbConfigured } from "@/lib/db/prisma";
import { mapEvent, mapLocation } from "@/lib/db/mappers";
import { recordActivity } from "@/lib/db/activity";
import { hasPermission } from "@/lib/auth/permissions";
import { canAccessLocation, hasAllLocationAccess } from "@/lib/auth/location-access";
import type { EventItem, StoreLocation, UserProfile } from "@/types";

const DEFAULT_HOURS = [
  { day: "Mon–Thu", open: "11:00", close: "21:00" },
  { day: "Fri–Sat", open: "10:00", close: "23:00" },
  { day: "Sun", open: "12:00", close: "20:00" },
];

const DEFAULT_HERO = "/store/downtown-maison.jpg";

export const EVENT_TYPES = ["wine-tasting", "whiskey-tasting", "launch", "festival"] as const;
export type AdminEventType = (typeof EVENT_TYPES)[number];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueLocationSlug(base: string, exceptId?: string) {
  let slug = slugify(base) || `store-${Date.now().toString(36)}`;
  let n = 2;
  while (true) {
    const hit = await prisma.location.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === exceptId) return slug;
    slug = `${slugify(base)}-${n++}`;
  }
}

async function uniqueEventSlug(base: string, exceptId?: string) {
  let slug = slugify(base) || `event-${Date.now().toString(36)}`;
  let n = 2;
  while (true) {
    const hit = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === exceptId) return slug;
    slug = `${slugify(base)}-${n++}`;
  }
}

export async function listLocationIds() {
  if (!isDbConfigured()) return [];
  const rows = await prisma.location.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
}

export type LocationInput = {
  name: string;
  shortName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  description?: string;
  pickupAvailable?: boolean;
  deliveryRadiusKm?: number;
  parking?: string;
  heroImage?: string;
  gallery?: string[];
  lat?: number;
  lng?: number;
};

function galleryUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function composeGallery(hero: string, extras: string[] = []) {
  const unique: string[] = [];
  for (const url of [hero, ...extras]) {
    const next = url.trim();
    if (next && !unique.includes(next)) unique.push(next);
  }
  return unique.slice(0, 8);
}

export async function createStoreLocation(actor: UserProfile, input: LocationInput) {
  if (!hasPermission(actor, "locations.create")) {
    return { error: "You cannot add locations.", status: 403 as const };
  }
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };

  const shortName = input.shortName.trim();
  const name = input.name.trim() || `Sam's Discount Liquor — ${shortName}`;
  const id = `loc-${crypto.randomUUID().slice(0, 8)}`;
  const slug = await uniqueLocationSlug(shortName || name);
  const heroImage = input.heroImage?.trim() || DEFAULT_HERO;
  const gallery = composeGallery(heroImage, input.gallery);

  await prisma.$transaction(async (tx) => {
    await tx.location.create({
      data: {
        id,
        slug,
        name,
        shortName,
        address: input.address.trim(),
        city: input.city.trim(),
        state: input.state.trim(),
        zip: input.zip.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        hours: DEFAULT_HOURS,
        lat: input.lat ?? 40.7209,
        lng: input.lng ?? -74.0007,
        heroImage,
        gallery,
        staff: [],
        services: ["Pickup", "Gift wrapping"],
        parking: input.parking?.trim() || "Street parking nearby.",
        pickupAvailable: input.pickupAvailable ?? true,
        deliveryRadiusKm: input.deliveryRadiusKm ?? 8,
        featuredOffers: [],
        description: input.description?.trim() || `${name} is now part of the Sam's Discount Liquor network.`,
      },
    });
    const products = await tx.product.findMany({ select: { id: true } });
    if (products.length) {
      await tx.locationInventory.createMany({
        data: products.map((product) => ({
          locationId: id,
          productId: product.id,
          seedStock: 0,
          onHand: 0,
        })),
      });
    }
  });

  const row = await prisma.location.findUnique({
    where: { id },
    include: { inventory: true },
  });
  if (!row) return { error: "Location was created but could not be loaded.", status: 500 as const };
  const location = mapLocation(row);
  await recordActivity({
    actorUserId: actor.id,
    action: "location.created",
    entityType: "location",
    entityId: location.id,
    locationId: location.id,
    summary: `${actor.name} added store ${location.shortName}`,
  });
  return { location };
}

export async function updateStoreLocation(
  actor: UserProfile,
  locationId: string,
  input: Partial<LocationInput>,
) {
  if (!hasPermission(actor, "locations.edit")) {
    return { error: "You cannot edit locations.", status: 403 as const };
  }
  if (!canAccessLocation(actor, locationId)) {
    return { error: "You cannot manage that store.", status: 403 as const };
  }
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };
  const existing = await prisma.location.findUnique({ where: { id: locationId } });
  if (!existing) return { error: "Location not found.", status: 404 as const };

  const shortName = input.shortName?.trim() ?? existing.shortName;
  const slug =
    input.shortName && input.shortName.trim() !== existing.shortName
      ? await uniqueLocationSlug(shortName, locationId)
      : existing.slug;
  const heroImage = input.heroImage?.trim() || existing.heroImage;
  const previousExtras = galleryUrls(existing.gallery).filter((url) => url !== existing.heroImage);
  const gallery =
    input.gallery != null
      ? composeGallery(heroImage, input.gallery)
      : composeGallery(heroImage, previousExtras);

  await prisma.location.update({
    where: { id: locationId },
    data: {
      slug,
      name: input.name?.trim() ?? existing.name,
      shortName,
      address: input.address?.trim() ?? existing.address,
      city: input.city?.trim() ?? existing.city,
      state: input.state?.trim() ?? existing.state,
      zip: input.zip?.trim() ?? existing.zip,
      phone: input.phone?.trim() ?? existing.phone,
      email: input.email?.trim().toLowerCase() ?? existing.email,
      description: input.description?.trim() ?? existing.description,
      pickupAvailable: input.pickupAvailable ?? existing.pickupAvailable,
      deliveryRadiusKm: input.deliveryRadiusKm ?? existing.deliveryRadiusKm,
      parking: input.parking?.trim() ?? existing.parking,
      heroImage,
      gallery,
      lat: input.lat ?? existing.lat,
      lng: input.lng ?? existing.lng,
    },
  });

  const row = await prisma.location.findUnique({
    where: { id: locationId },
    include: { inventory: true },
  });
  if (!row) return { error: "Location not found.", status: 404 as const };
  const location = mapLocation(row);
  await recordActivity({
    actorUserId: actor.id,
    action: "location.updated",
    entityType: "location",
    entityId: location.id,
    locationId: location.id,
    summary: `${actor.name} updated store ${location.shortName}`,
  });
  return { location };
}

export async function deleteStoreLocation(actor: UserProfile, locationId: string) {
  if (!hasPermission(actor, "locations.delete")) {
    return { error: "You cannot remove locations.", status: 403 as const };
  }
  if (!canAccessLocation(actor, locationId)) {
    return { error: "You cannot manage that store.", status: 403 as const };
  }
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };

  const existing = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, shortName: true },
  });
  if (!existing) return { error: "Location not found.", status: 404 as const };

  const remaining = await prisma.location.count();
  if (remaining <= 1) {
    return { error: "The last store cannot be removed.", status: 409 as const };
  }
  const orders = await prisma.order.count({ where: { locationId } });
  if (orders > 0) {
    return {
      error: "This store has orders, so it cannot be deleted. Deactivate it by leaving it unpublished in a future update, or keep it for history.",
      status: 409 as const,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.event.deleteMany({ where: { locationId } });
    await tx.inventoryLedger.deleteMany({ where: { locationId } });
    await tx.location.delete({ where: { id: locationId } });
  });

  await recordActivity({
    actorUserId: actor.id,
    action: "location.deleted",
    entityType: "location",
    entityId: locationId,
    summary: `${actor.name} removed store ${existing.shortName}`,
  });
  return { ok: true as const, id: locationId };
}

export type EventInput = {
  title: string;
  type: AdminEventType;
  description: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  seatsTotal: number;
  image?: string;
  hosts?: string[];
};

export async function createStoreEvent(actor: UserProfile, input: EventInput) {
  if (!hasPermission(actor, "events.create")) {
    return { error: "You cannot add events.", status: 403 as const };
  }
  if (!canAccessLocation(actor, input.locationId)) {
    return { error: "You cannot add events for that store.", status: 403 as const };
  }
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };
  const location = await prisma.location.findUnique({ where: { id: input.locationId } });
  if (!location) return { error: "Location not found.", status: 404 as const };

  const seatsTotal = Math.max(1, Math.floor(input.seatsTotal));
  const id = `evt-${crypto.randomUUID().slice(0, 8)}`;
  const slug = await uniqueEventSlug(input.title);
  const row = await prisma.event.create({
    data: {
      id,
      slug,
      title: input.title.trim(),
      type: input.type,
      description: input.description.trim(),
      locationId: input.locationId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      price: input.price,
      seatsTotal,
      seatsAvailable: seatsTotal,
      image: input.image?.trim() || location.heroImage || DEFAULT_HERO,
      hosts: input.hosts?.filter(Boolean) ?? [],
    },
  });
  const event = mapEvent(row);
  await recordActivity({
    actorUserId: actor.id,
    action: "event.created",
    entityType: "event",
    entityId: event.id,
    locationId: event.locationId,
    summary: `${actor.name} added event “${event.title}”`,
  });
  return { event };
}

export async function updateStoreEvent(
  actor: UserProfile,
  eventId: string,
  input: Partial<EventInput>,
) {
  if (!hasPermission(actor, "events.edit")) {
    return { error: "You cannot edit events.", status: 403 as const };
  }
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return { error: "Event not found.", status: 404 as const };
  if (!canAccessLocation(actor, existing.locationId)) {
    return { error: "You cannot manage that event.", status: 403 as const };
  }
  const nextLocationId = input.locationId ?? existing.locationId;
  if (!canAccessLocation(actor, nextLocationId)) {
    return { error: "You cannot move this event to that store.", status: 403 as const };
  }

  const seatsTotal = input.seatsTotal != null ? Math.max(1, Math.floor(input.seatsTotal)) : existing.seatsTotal;
  const sold = existing.seatsTotal - existing.seatsAvailable;
  const seatsAvailable = Math.max(0, seatsTotal - sold);

  const row = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: input.title?.trim() ?? existing.title,
      slug: input.title && input.title.trim() !== existing.title
        ? await uniqueEventSlug(input.title, eventId)
        : existing.slug,
      type: input.type ?? existing.type,
      description: input.description?.trim() ?? existing.description,
      locationId: nextLocationId,
      date: input.date ?? existing.date,
      startTime: input.startTime ?? existing.startTime,
      endTime: input.endTime ?? existing.endTime,
      price: input.price ?? existing.price,
      seatsTotal,
      seatsAvailable,
      image: input.image?.trim() || existing.image,
      hosts: (input.hosts ?? existing.hosts) as string[],
    },
  });
  const event = mapEvent(row);
  await recordActivity({
    actorUserId: actor.id,
    action: "event.updated",
    entityType: "event",
    entityId: event.id,
    locationId: event.locationId,
    summary: `${actor.name} updated event “${event.title}”`,
  });
  return { event };
}

export async function deleteStoreEvent(actor: UserProfile, eventId: string) {
  if (!hasPermission(actor, "events.delete")) {
    return { error: "You cannot remove events.", status: 403 as const };
  }
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return { error: "Event not found.", status: 404 as const };
  if (!canAccessLocation(actor, existing.locationId)) {
    return { error: "You cannot manage that event.", status: 403 as const };
  }
  await prisma.event.delete({ where: { id: eventId } });
  await recordActivity({
    actorUserId: actor.id,
    action: "event.deleted",
    entityType: "event",
    entityId: eventId,
    locationId: existing.locationId,
    summary: `${actor.name} removed event “${existing.title}”`,
  });
  return { ok: true as const, id: eventId };
}

export type { StoreLocation, EventItem };
export { hasAllLocationAccess };
