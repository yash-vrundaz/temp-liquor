import type {
  EventItem,
  InventoryItem,
  InventoryLedgerEntry,
  Order,
  Product,
  Review,
  StoreLocation,
  UserProfile,
} from "@/types";
import { mapLocationPricing } from "@/lib/db/location-pricing";
import type {
  Category as DbCategory,
  Event as DbEvent,
  InventoryLedger as DbLedger,
  Location as DbLocation,
  LocationInventory as DbInventory,
  Order as DbOrder,
  OrderItem as DbOrderItem,
  Product as DbProduct,
  Review as DbReview,
  User as DbUser,
} from "@prisma/client";

type DbProductRow = DbProduct;
type DbLocationRow = DbLocation & { inventory: DbInventory[] };
type DbOrderRow = DbOrder & { items: DbOrderItem[] };

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function asCocktails(value: unknown): Product["cocktails"] {
  if (!Array.isArray(value)) return [];
  return value as Product["cocktails"];
}

function asNutrition(value: unknown): Product["nutrition"] {
  if (!value || typeof value !== "object") return undefined;
  return value as Product["nutrition"];
}

export function mapProduct(row: DbProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.categorySlug,
    subcategory: row.subcategory ?? undefined,
    description: row.description,
    brandStory: row.brandStory,
    origin: row.origin,
    country: row.country,
    abv: row.abv,
    volumeMl: row.volumeMl,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    rating: row.rating,
    reviewCount: row.reviewCount,
    tastingNotes: asStringArray(row.tastingNotes),
    foodPairings: asStringArray(row.foodPairings),
    cocktails: asCocktails(row.cocktails),
    images: asStringArray(row.images),
    color: row.color,
    accentColor: row.accentColor,
    labelColor: row.labelColor,
    bottleHeight: row.bottleHeight,
    isPremium: row.isPremium,
    isImported: row.isImported,
    tags: asStringArray(row.tags),
    nutrition: asNutrition(row.nutrition),
    glbUrl: row.glbUrl ?? undefined,
    usdzUrl: row.usdzUrl ?? undefined,
  };
}

export function mapInventoryItem(row: DbInventory): InventoryItem {
  return {
    productId: row.productId,
    stock: row.seedStock,
    promoPrice: row.promoPrice ?? undefined,
    featured: row.featured,
    hidden: Boolean((row as { hidden?: boolean }).hidden),
  };
}

export function mapLocation(row: DbLocationRow): StoreLocation {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    phone: row.phone,
    email: row.email,
    hours: row.hours as StoreLocation["hours"],
    lat: row.lat,
    lng: row.lng,
    heroImage: row.heroImage,
    gallery: asStringArray(row.gallery),
    staff: row.staff as StoreLocation["staff"],
    services: asStringArray(row.services),
    parking: row.parking,
    pickupAvailable: row.pickupAvailable,
    ...mapLocationPricing(row),
    deliveryRadiusKm: row.deliveryRadiusKm,
    inventory: row.inventory.map(mapInventoryItem),
    featuredOffers: asStringArray(row.featuredOffers),
    description: row.description,
  };
}

export function mapEvent(row: DbEvent & { active?: boolean | null }): EventItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type as EventItem["type"],
    description: row.description,
    locationId: row.locationId,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    price: row.price,
    seatsTotal: row.seatsTotal,
    seatsAvailable: row.seatsAvailable,
    image: row.image,
    hosts: asStringArray(row.hosts),
    active: row.active !== false,
  };
}

export function mapReview(row: DbReview): Review {
  return {
    id: row.id,
    productId: row.productId,
    userName: row.userName,
    rating: row.rating,
    title: row.title,
    body: row.body,
    date: row.date,
    verified: row.verified,
    images: row.images ? asStringArray(row.images) : undefined,
    helpful: row.helpful,
  };
}

export function mapCategory(row: DbCategory) {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    color: row.color,
  };
}

export function mapOrder(row: DbOrderRow): Order {
  return {
    id: row.id,
    date: row.date,
    status: row.status as Order["status"],
    items: row.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      price: i.price,
    })),
    total: row.total,
    fulfillment: row.fulfillment as Order["fulfillment"],
    locationId: row.locationId,
    tracking: row.tracking ?? undefined,
  };
}

export function mapUser(row: DbUser, orders: Order[]): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserProfile["role"],
    active: row.active !== false,
    preferredBranchId: row.preferredBranchId,
    loyaltyPoints: row.loyaltyPoints,
    loyaltyTier: row.loyaltyTier as UserProfile["loyaltyTier"],
    addresses: row.addresses as UserProfile["addresses"],
    recentlyViewed: asStringArray(row.recentlyViewed),
    orders,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : undefined,
    avatarUrl:
      typeof (row as { avatarUrl?: unknown }).avatarUrl === "string" &&
      (row as { avatarUrl: string }).avatarUrl
        ? (row as { avatarUrl: string }).avatarUrl
        : undefined,
  };
}

export function mapLedger(row: DbLedger): InventoryLedgerEntry {
  return {
    id: row.id,
    locationId: row.locationId,
    productId: row.productId,
    delta: row.delta,
    onHandAfter: row.onHandAfter,
    reason: row.reason as InventoryLedgerEntry["reason"],
    orderId: row.orderId ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date().toISOString(),
  };
}
