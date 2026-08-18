import { prisma, isDbConfigured } from "@/lib/db/prisma";
import {
  mapCategory,
  mapEvent,
  mapLocation,
  mapOrder,
  mapProduct,
  mapReview,
  mapUser,
} from "@/lib/db/mappers";
import type { CartItem, NewBottleInput, Order, Product, UserProfile } from "@/types";
import { categories as seedCategories } from "@/data/categories";
import { products as seedProducts } from "@/data/products";
import { locations as seedLocations } from "@/data/locations";
import { events as seedEvents, reviews as seedReviews, demoUser } from "@/data/events";
import { getCouponDiscount } from "@/lib/commerce";
import { calculateShipping, calculateTax } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { recordActivity } from "@/lib/db/activity";
import { attachProfileExtras } from "@/lib/db/users";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function splitCsv(value: string | undefined, fallback: string[]) {
  if (value == null) return fallback;
  const next = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
  return next.length ? next : fallback;
}

function composeProductImages(cover: string | undefined, extras: string[] | undefined, fallback: string[]) {
  const unique: string[] = [];
  for (const url of [cover ?? "", ...(extras ?? [])]) {
    const next = url.trim();
    if (next && !unique.includes(next)) unique.push(next);
  }
  return unique.length ? unique.slice(0, 8) : fallback;
}

export async function fetchAllProducts(): Promise<Product[]> {
  if (!isDbConfigured()) return seedProducts;
  const rows = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapProduct);
}

export async function fetchProductBySlug(slug: string) {
  if (!isDbConfigured()) return seedProducts.find((p) => p.slug === slug);
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? mapProduct(row) : undefined;
}

export async function fetchProductById(id: string) {
  if (!isDbConfigured()) return seedProducts.find((p) => p.id === id);
  const row = await prisma.product.findUnique({ where: { id } });
  return row ? mapProduct(row) : undefined;
}

export async function fetchAllLocations() {
  if (!isDbConfigured()) return seedLocations;
  const rows = await prisma.location.findMany({
    include: { inventory: true },
    orderBy: { name: "asc" },
  });
  return rows.map(mapLocation);
}

export async function fetchLocationBySlug(slug: string) {
  if (!isDbConfigured()) return seedLocations.find((l) => l.slug === slug);
  const row = await prisma.location.findUnique({
    where: { slug },
    include: { inventory: true },
  });
  return row ? mapLocation(row) : undefined;
}

export async function fetchLocationById(id: string) {
  if (!isDbConfigured()) return seedLocations.find((l) => l.id === id);
  const row = await prisma.location.findUnique({
    where: { id },
    include: { inventory: true },
  });
  return row ? mapLocation(row) : undefined;
}

export async function fetchCategories() {
  if (!isDbConfigured()) return seedCategories;
  const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapCategory);
}

function normalizeColor(value: string | undefined) {
  const raw = (value ?? "#C9A962").trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) return raw;
  if (/^[0-9a-fA-F]{3,8}$/.test(raw)) return `#${raw}`;
  return "#C9A962";
}

export async function createShopCategory(
  input: { name: string; tagline?: string; description?: string; color?: string; slug?: string },
  actorUserId?: string,
) {
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };
  const name = input.name.trim();
  let slug = (input.slug?.trim() || slugify(name)).slice(0, 40);
  if (!slug) return { error: "Category name is required.", status: 400 as const };
  const taken = await prisma.category.findUnique({ where: { slug } });
  if (taken) {
    let n = 2;
    while (await prisma.category.findUnique({ where: { slug: `${slug}-${n}` } })) n += 1;
    slug = `${slug}-${n}`;
  }
  const row = await prisma.category.create({
    data: {
      slug,
      name,
      tagline: input.tagline?.trim() || "Collection",
      description: input.description?.trim() || `${name} bottles at Sam's Discount Liquor.`,
      color: normalizeColor(input.color),
    },
  });
  const category = mapCategory(row);
  await recordActivity({
    actorUserId,
    action: "category.created",
    entityType: "category",
    entityId: category.slug,
    summary: `Added category “${category.name}”`,
  });
  return { category };
}

export async function updateShopCategory(
  slug: string,
  input: { name?: string; tagline?: string; description?: string; color?: string },
  actorUserId?: string,
) {
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (!existing) return { error: "Category not found.", status: 404 as const };
  const row = await prisma.category.update({
    where: { slug },
    data: {
      name: input.name?.trim() || existing.name,
      tagline: input.tagline?.trim() || existing.tagline,
      description: input.description?.trim() || existing.description,
      color: input.color ? normalizeColor(input.color) : existing.color,
    },
  });
  const category = mapCategory(row);
  await recordActivity({
    actorUserId,
    action: "category.updated",
    entityType: "category",
    entityId: category.slug,
    summary: `Updated category “${category.name}”`,
  });
  return { category };
}

export async function deleteShopCategory(slug: string, actorUserId?: string) {
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (!existing) return { error: "Category not found.", status: 404 as const };
  const remaining = await prisma.category.count();
  if (remaining <= 1) {
    return { error: "The last category cannot be removed.", status: 409 as const };
  }
  const bottles = await prisma.product.count({ where: { categorySlug: slug } });
  if (bottles > 0) {
    return {
      error: `Move or delete the ${bottles} bottle${bottles === 1 ? "" : "s"} in this category first.`,
      status: 409 as const,
    };
  }
  await prisma.category.delete({ where: { slug } });
  await recordActivity({
    actorUserId,
    action: "category.deleted",
    entityType: "category",
    entityId: slug,
    summary: `Removed category “${existing.name}”`,
  });
  return { ok: true as const, slug };
}

export async function fetchEvents() {
  if (!isDbConfigured()) return seedEvents;
  const rows = await prisma.event.findMany({ orderBy: { date: "asc" } });
  return rows.map(mapEvent);
}

export async function fetchEventBySlug(slug: string) {
  if (!isDbConfigured()) return seedEvents.find((e) => e.slug === slug);
  const row = await prisma.event.findUnique({ where: { slug } });
  return row ? mapEvent(row) : undefined;
}

export async function fetchReviewsForProduct(productId: string) {
  if (!isDbConfigured()) return seedReviews.filter((r) => r.productId === productId);
  const rows = await prisma.review.findMany({
    where: { productId },
    orderBy: { date: "desc" },
  });
  return rows.map(mapReview);
}

export async function fetchInventoryState() {
  if (!isDbConfigured()) {
    const stocks: Record<string, number> = {};
    for (const loc of seedLocations) {
      for (const row of loc.inventory) {
        stocks[`${loc.id}:${row.productId}`] = row.stock;
      }
    }
    const seats: Record<string, number> = {};
    for (const e of seedEvents) seats[e.id] = e.seatsAvailable;
    return { stocks, seats };
  }

  const rows = await prisma.locationInventory.findMany();
  const stocks: Record<string, number> = {};
  for (const row of rows) {
    stocks[`${row.locationId}:${row.productId}`] = row.onHand;
  }

  const events = await prisma.event.findMany();
  const seats: Record<string, number> = {};
  for (const e of events) seats[e.id] = e.seatsAvailable;

  return { stocks, seats };
}

export async function fetchUserByEmail(email: string): Promise<UserProfile | null> {
  if (!isDbConfigured()) {
    if (email === demoUser.email) return demoUser;
    return null;
  }
  const row = await prisma.user.findUnique({
    where: { email },
    include: {
      orders: {
        include: { items: true },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!row) return null;
  return attachProfileExtras(mapUser(row, row.orders.map(mapOrder)));
}

export async function fetchUserById(id: string): Promise<UserProfile | null> {
  if (!isDbConfigured()) {
    if (id === demoUser.id) return demoUser;
    return null;
  }
  const row = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        include: { items: true },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!row) return null;
  return attachProfileExtras(mapUser(row, row.orders.map(mapOrder)));
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<
    Pick<UserProfile, "name" | "preferredBranchId" | "recentlyViewed" | "addresses">
  >,
) {
  if (!isDbConfigured()) return;
  await prisma.user.update({
    where: { id: userId },
    data: patch,
  });
  if (patch.preferredBranchId || patch.addresses) {
    await recordActivity({
      actorUserId: userId,
      action: "user.profile_updated",
      entityType: "profile",
      entityId: userId,
      summary: patch.preferredBranchId
        ? `Updated preferred branch to ${patch.preferredBranchId}`
        : "Updated saved addresses",
      metadata: {
        fields: Object.keys(patch).filter((k) => k !== "recentlyViewed"),
      },
    });
  }
}

export async function redeemLoyaltyPoints(userId: string, points: number) {
  if (!isDbConfigured()) return true;
  const result = await prisma.user.updateMany({
    where: { id: userId, loyaltyPoints: { gte: points } },
    data: { loyaltyPoints: { decrement: points } },
  });
  if (result.count === 1) {
    await recordActivity({
      actorUserId: userId,
      action: "user.points_redeemed",
      entityType: "profile",
      entityId: userId,
      summary: `Redeemed ${points} loyalty points`,
      metadata: { points },
    });
  }
  return result.count === 1;
}

type Tx = Prisma.TransactionClient;

export class StockConflictError extends Error {
  shortfalls: { productId: string; requested: number; onHand: number }[];
  constructor(shortfalls: { productId: string; requested: number; onHand: number }[]) {
    super("Insufficient stock for one or more items.");
    this.name = "StockConflictError";
    this.shortfalls = shortfalls;
  }
}

async function writeStockChange(
  tx: Tx,
  locationId: string,
  productId: string,
  nextQty: number,
  reason: string,
  orderId?: string,
) {
  const existing = await tx.locationInventory.findUnique({
    where: { locationId_productId: { locationId, productId } },
  });
  const current = existing?.onHand ?? 0;
  const delta = nextQty - current;

  await tx.locationInventory.upsert({
    where: { locationId_productId: { locationId, productId } },
    create: {
      locationId,
      productId,
      seedStock: nextQty,
      onHand: nextQty,
    },
    update: { onHand: nextQty },
  });

  if (delta !== 0) {
    await tx.inventoryLedger.create({
      data: {
        locationId,
        productId,
        delta,
        onHandAfter: nextQty,
        reason,
        orderId,
      },
    });
  }

  return nextQty;
}

export async function createCustomProduct(
  input: NewBottleInput,
  allSlugs: string[],
  actorUserId?: string,
) {
  const baseSlug = slugify(`${input.brand} ${input.name}`) || "new-bottle";
  let slug = baseSlug;
  let n = 2;
  const taken = new Set(allSlugs);
  while (taken.has(slug)) {
    slug = `${baseSlug}-${n}`;
    n += 1;
  }

  const id = `custom-${slug}-${Date.now().toString(36)}`;
  const notes = splitCsv(input.tastingNotes, ["To taste"]);
  const pairings = splitCsv(input.foodPairings, []);
  const imageFallback =
    seedProducts[0]?.images[0] || "/products/bottles/jd-old-no-7.png";
  const images = composeProductImages(input.imageUrl, input.images, [imageFallback]);

  const product: Product = {
    id,
    slug,
    name: input.name.trim(),
    brand: input.brand.trim(),
    category: input.category,
    description: input.description.trim() || `${input.name} from ${input.brand}.`,
    brandStory:
      input.brandStory?.trim() || `${input.brand} — added to Sam's Discount Liquor collection.`,
    origin: input.origin.trim() || "Unknown",
    country: input.country.trim() || "USA",
    abv: input.abv,
    volumeMl: input.volumeMl,
    price: input.price,
    compareAtPrice: input.compareAtPrice && input.compareAtPrice > 0 ? input.compareAtPrice : undefined,
    rating: 0,
    reviewCount: 0,
    tastingNotes: notes,
    foodPairings: pairings,
    cocktails: [],
    images,
    color: "#2a1a12",
    accentColor: "#c9a962",
    labelColor: "#f3ead7",
    bottleHeight: 1,
    isPremium: input.isPremium,
    isImported: input.isImported,
    tags: ["owner-added"],
    glbUrl: `/models/bottles/${slug}.glb`,
  };

  if (!isDbConfigured()) return { product, inventory: await fetchInventoryState() };

  await prisma.$transaction(async (tx) => {
    await tx.product.create({
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        categorySlug: product.category,
        description: product.description,
        brandStory: product.brandStory,
        origin: product.origin,
        country: product.country,
        abv: product.abv,
        volumeMl: product.volumeMl,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        rating: product.rating,
        reviewCount: product.reviewCount,
        tastingNotes: product.tastingNotes,
        foodPairings: product.foodPairings,
        cocktails: product.cocktails,
        images: product.images,
        color: product.color,
        accentColor: product.accentColor,
        labelColor: product.labelColor,
        bottleHeight: product.bottleHeight,
        isPremium: product.isPremium,
        isImported: product.isImported,
        tags: product.tags,
        glbUrl: product.glbUrl,
        isCustom: true,
      },
    });

    const locations = await tx.location.findMany({ select: { id: true } });
    const qty = Math.floor(input.initialStock);
    const targetIds =
      input.stockLocationIds && input.stockLocationIds.length > 0
        ? new Set(input.stockLocationIds)
        : new Set(locations.map((l) => l.id));

    await tx.locationInventory.createMany({
      data: locations.map((loc) => {
        const stock = targetIds.has(loc.id) ? qty : 0;
        return {
          locationId: loc.id,
          productId: product.id,
          seedStock: stock,
          onHand: stock,
        };
      }),
    });
  });

  await recordActivity({
    actorUserId,
    action: "catalog.created",
    entityType: "product",
    entityId: product.id,
    summary: `Added bottle “${product.name}” (${product.brand}) with ${Math.floor(input.initialStock)} units`,
    metadata: {
      brand: product.brand,
      category: product.category,
      initialStock: Math.floor(input.initialStock),
      stockLocationIds: input.stockLocationIds ?? "all",
    },
  });

  return { product, inventory: await fetchInventoryState() };
}

export async function updateCatalogProduct(
  productId: string,
  input: Partial<Omit<NewBottleInput, "initialStock" | "stockLocationIds">>,
  actorUserId?: string,
) {
  if (!isDbConfigured()) return { error: "Database is not configured.", status: 503 as const };
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return { error: "Bottle not found.", status: 404 as const };
  const mapped = mapProduct(existing);
  const tastingNotes = splitCsv(input.tastingNotes, mapped.tastingNotes);
  const foodPairings = splitCsv(input.foodPairings, mapped.foodPairings);
  const images = composeProductImages(input.imageUrl, input.images, mapped.images);
  const compareAtPrice =
    input.compareAtPrice === undefined
      ? existing.compareAtPrice
      : input.compareAtPrice && input.compareAtPrice > 0
        ? input.compareAtPrice
        : null;

  const row = await prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name?.trim() ?? existing.name,
      brand: input.brand?.trim() ?? existing.brand,
      categorySlug: input.category ?? existing.categorySlug,
      description: input.description?.trim() || existing.description,
      brandStory: input.brandStory?.trim() || existing.brandStory,
      origin: input.origin?.trim() || existing.origin,
      country: input.country?.trim() || existing.country,
      abv: input.abv ?? existing.abv,
      volumeMl: input.volumeMl ?? existing.volumeMl,
      price: input.price ?? existing.price,
      compareAtPrice,
      tastingNotes,
      foodPairings,
      images,
      isPremium: input.isPremium ?? existing.isPremium,
      isImported: input.isImported ?? existing.isImported,
    },
  });
  const product = mapProduct(row);
  await recordActivity({
    actorUserId,
    action: "catalog.updated",
    entityType: "product",
    entityId: product.id,
    summary: `Updated bottle “${product.name}” (${product.brand})`,
    metadata: {
      brand: product.brand,
      category: product.category,
      price: product.price,
    },
  });
  return { product };
}

async function logStockActivity(opts: {
  actorUserId?: string;
  locationId: string;
  productId?: string;
  reason: string;
  quantity?: number;
  delta?: number;
}) {
  const location =
    opts.locationId && opts.locationId !== "all"
      ? await prisma.location.findUnique({
          where: { id: opts.locationId },
          select: { shortName: true },
        })
      : null;
  const product = opts.productId
    ? await prisma.product.findUnique({
        where: { id: opts.productId },
        select: { name: true },
      })
    : null;
  const branch = location?.shortName ?? (opts.locationId === "all" ? "all stores" : opts.locationId);
  const bottle = product?.name ?? opts.productId ?? "catalog";
  const action =
    opts.reason === "restock"
      ? "inventory.restock"
      : opts.reason === "reset"
        ? "inventory.reset"
        : typeof opts.delta === "number"
          ? "inventory.adjust"
          : "inventory.set";
  const summary =
    action === "inventory.reset"
      ? `Reset inventory to catalog seed at ${branch}`
      : action === "inventory.restock"
        ? `Restocked ${bottle} at ${branch}${typeof opts.quantity === "number" ? ` to ${opts.quantity}` : typeof opts.delta === "number" ? ` (${opts.delta > 0 ? "+" : ""}${opts.delta})` : ""}`
        : typeof opts.delta === "number"
          ? `Adjusted ${bottle} at ${branch} by ${opts.delta > 0 ? "+" : ""}${opts.delta}`
          : `Set ${bottle} at ${branch} to ${opts.quantity ?? 0} on hand`;

  await recordActivity({
    actorUserId: opts.actorUserId,
    action,
    entityType: "inventory",
    entityId: opts.productId,
    summary,
    locationId: opts.locationId === "all" ? undefined : opts.locationId,
    metadata: {
      reason: opts.reason,
      quantity: opts.quantity,
      delta: opts.delta,
    },
  });
}

export async function setInventoryOnHand(
  locationId: string,
  productId: string,
  quantity: number,
  reason: string,
  orderId?: string,
  actorUserId?: string,
) {
  if (!isDbConfigured()) return quantity;
  const nextQty = Math.max(0, Math.floor(quantity));
  await prisma.$transaction((tx) =>
    writeStockChange(tx, locationId, productId, nextQty, reason, orderId),
  );
  await logStockActivity({
    actorUserId,
    locationId,
    productId,
    reason,
    quantity: nextQty,
  });
  return nextQty;
}

export async function adjustInventory(
  locationId: string,
  productId: string,
  delta: number,
  reason: string,
  orderId?: string,
  actorUserId?: string,
) {
  if (!isDbConfigured()) return true;
  if (!delta) return true;

  const ok = await prisma.$transaction(async (tx) => {
    const existing = await tx.locationInventory.findUnique({
      where: { locationId_productId: { locationId, productId } },
    });
    const current = existing?.onHand ?? 0;
    const nextQty = current + delta;
    if (nextQty < 0) return false;
    await writeStockChange(tx, locationId, productId, nextQty, reason, orderId);
    return true;
  });
  if (ok) {
    await logStockActivity({
      actorUserId,
      locationId,
      productId,
      reason,
      delta,
    });
  }
  return ok;
}

async function deductOrderStockTx(
  tx: Tx,
  locationId: string,
  items: Pick<CartItem, "productId" | "quantity">[],
  orderId: string,
) {
  const shortfalls: { productId: string; requested: number; onHand: number }[] = [];

  for (const item of items) {
    const result = await tx.locationInventory.updateMany({
      where: {
        locationId,
        productId: item.productId,
        onHand: { gte: item.quantity },
      },
      data: { onHand: { decrement: item.quantity } },
    });

    if (result.count !== 1) {
      const row = await tx.locationInventory.findUnique({
        where: { locationId_productId: { locationId, productId: item.productId } },
      });
      shortfalls.push({
        productId: item.productId,
        requested: item.quantity,
        onHand: row?.onHand ?? 0,
      });
    }
  }

  if (shortfalls.length) throw new StockConflictError(shortfalls);

  for (const item of items) {
    const row = await tx.locationInventory.findUnique({
      where: { locationId_productId: { locationId, productId: item.productId } },
    });
    await tx.inventoryLedger.create({
      data: {
        locationId,
        productId: item.productId,
        delta: -item.quantity,
        onHandAfter: row?.onHand ?? 0,
        reason: "sale",
        orderId,
      },
    });
  }
}

export async function deductOrderStock(
  locationId: string,
  items: Pick<CartItem, "productId" | "quantity">[],
  orderId: string,
) {
  if (!isDbConfigured()) return { ok: true as const };

  try {
    await prisma.$transaction((tx) => deductOrderStockTx(tx, locationId, items, orderId));
    return { ok: true as const };
  } catch (error) {
    if (error instanceof StockConflictError) {
      return { ok: false as const, shortfalls: error.shortfalls };
    }
    throw error;
  }
}

export async function bookEventSeats(eventId: string, qty: number, actorUserId?: string) {
  if (!isDbConfigured()) return true;
  if (qty <= 0) return false;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return false;
  const result = await prisma.event.updateMany({
    where: { id: eventId, seatsAvailable: { gte: qty } },
    data: { seatsAvailable: { decrement: qty } },
  });
  if (result.count === 1) {
    await recordActivity({
      actorUserId,
      action: "event.booked",
      entityType: "event",
      entityId: eventId,
      locationId: event.locationId,
      summary: `Booked ${qty} seat${qty === 1 ? "" : "s"} for “${event.title}”`,
      metadata: { qty, guestName: actorUserId ? undefined : "guest" },
    });
  }
  return result.count === 1;
}

async function ensureCustomer(
  tx: Tx,
  input: { email: string; name: string; userId?: string; preferredBranchId: string },
) {
  const email = input.email.trim().toLowerCase();
  if (input.userId) {
    const byId = await tx.user.findUnique({ where: { id: input.userId } });
    if (byId) return byId;
  }
  const existing = await tx.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.name !== input.name) {
      return tx.user.update({
        where: { id: existing.id },
        data: { name: input.name },
      });
    }
    return existing;
  }
  return tx.user.create({
    data: {
      id: `u-${crypto.randomUUID()}`,
      email,
      name: input.name.trim(),
      role: "customer",
      preferredBranchId: input.preferredBranchId,
      loyaltyPoints: 0,
      loyaltyTier: "Member",
      addresses: [],
      recentlyViewed: [],
    },
  });
}

export async function placeOrder(input: {
  email: string;
  name: string;
  userId?: string;
  locationId: string;
  fulfillment: Order["fulfillment"];
  items: Pick<CartItem, "productId" | "quantity">[];
  coupon?: string | null;
}) {
  if (!isDbConfigured()) {
    throw new Error("Database is not configured.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const location = await tx.location.findUnique({
      where: { id: input.locationId },
      include: { inventory: true },
    });
    if (!location) throw new Error("Location not found.");

    const orderItems: Order["items"] = [];
    let subtotal = 0;
    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Unknown product: ${item.productId}`);
      const inv = location.inventory.find((row) => row.productId === item.productId);
      const unitPrice = inv?.promoPrice ?? product.price;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: unitPrice,
      });
      subtotal += unitPrice * item.quantity;
    }

    const discount = getCouponDiscount(input.coupon, subtotal);
    const shipping = calculateShipping(subtotal - discount, input.fulfillment);
    const tax = calculateTax(subtotal - discount);
    const total = subtotal - discount + shipping + tax;
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 900 + 100,
    )}`;
    const order: Order = {
      id: orderId,
      date: new Date().toISOString().slice(0, 10),
      status: input.fulfillment === "pickup" ? "ready" : "processing",
      items: orderItems,
      total,
      fulfillment: input.fulfillment,
      locationId: input.locationId,
      tracking:
        input.fulfillment === "delivery"
          ? `1Z${Math.floor(Math.random() * 1e12)
              .toString()
              .padStart(12, "0")}`
          : undefined,
    };

    const user = await ensureCustomer(tx, {
      email: input.email,
      name: input.name,
      userId: input.userId,
      preferredBranchId: input.locationId,
    });

    await deductOrderStockTx(tx, input.locationId, input.items, order.id);

    await tx.order.create({
      data: {
        id: order.id,
        userId: user.id,
        date: order.date,
        status: order.status,
        total: order.total,
        fulfillment: order.fulfillment,
        locationId: order.locationId,
        tracking: order.tracking,
        items: {
          create: order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    const pointsEarned = Math.max(0, Math.floor(order.total));
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { loyaltyPoints: { increment: pointsEarned } },
    });

    return {
      order,
      userId: updatedUser.id,
      loyaltyPoints: updatedUser.loyaltyPoints,
    };
  });

  await recordActivity({
    actorUserId: result.userId,
    action: "order.placed",
    entityType: "order",
    entityId: result.order.id,
    locationId: result.order.locationId,
    summary: `Placed ${result.order.fulfillment} order ${result.order.id} for $${result.order.total.toFixed(2)}`,
    metadata: {
      itemCount: result.order.items.length,
      fulfillment: result.order.fulfillment,
      total: result.order.total,
    },
  });

  return result;
}

export async function createOrder(userId: string, order: Order) {
  if (!isDbConfigured()) return order;

  await prisma.$transaction(async (tx) => {
    await tx.order.create({
      data: {
        id: order.id,
        userId,
        date: order.date,
        status: order.status,
        total: order.total,
        fulfillment: order.fulfillment,
        locationId: order.locationId,
        tracking: order.tracking,
        items: {
          create: order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });
    const pointsEarned = Math.max(0, Math.floor(order.total));
    await tx.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: pointsEarned } },
    });
  });

  return order;
}

export async function cancelOrder(orderId: string, userId: string) {
  if (!isDbConfigured()) return null;

  const cancelled = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order || order.status === "cancelled") return null;

    await tx.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });

    const sales = await tx.inventoryLedger.findMany({
      where: { orderId, reason: "sale" },
    });
    if (sales.length) {
      for (const item of order.items) {
        const existing = await tx.locationInventory.findUnique({
          where: {
            locationId_productId: {
              locationId: order.locationId,
              productId: item.productId,
            },
          },
        });
        const nextQty = (existing?.onHand ?? 0) + item.quantity;
        await writeStockChange(tx, order.locationId, item.productId, nextQty, "cancel", orderId);
      }
    }

    return mapOrder(order);
  });

  if (cancelled) {
    await recordActivity({
      actorUserId: userId,
      action: "order.cancelled",
      entityType: "order",
      entityId: cancelled.id,
      locationId: cancelled.locationId,
      summary: `Cancelled order ${cancelled.id}`,
      metadata: { total: cancelled.total, fulfillment: cancelled.fulfillment },
    });
  }

  return cancelled;
}

export async function resetInventory(locationId?: string, actorUserId?: string) {
  if (!isDbConfigured()) return;

  await prisma.$transaction(async (tx) => {
    const rows = await tx.locationInventory.findMany(
      locationId ? { where: { locationId } } : undefined,
    );
    for (const row of rows) {
      await writeStockChange(tx, row.locationId, row.productId, row.seedStock, "reset");
    }
    if (!locationId) {
      const events = await tx.event.findMany();
      for (const e of events) {
        await tx.event.update({
          where: { id: e.id },
          data: { seatsAvailable: e.seatsTotal },
        });
      }
    }
  });

  await logStockActivity({
    actorUserId,
    locationId: locationId ?? "all",
    reason: "reset",
  });
}

export async function fetchBootstrapPayload() {
  const [products, locations, categories, events, reviews, inventory] = await Promise.all([
    fetchAllProducts(),
    fetchAllLocations(),
    fetchCategories(),
    fetchEvents(),
    isDbConfigured()
      ? prisma.review.findMany().then((rows) => rows.map(mapReview))
      : Promise.resolve(seedReviews),
    fetchInventoryState(),
  ]);

  return {
    products,
    locations,
    categories,
    events,
    reviews,
    inventory,
  };
}
