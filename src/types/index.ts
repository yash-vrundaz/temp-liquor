export type CategorySlug = string;

export type ShopCategory = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  subcategory?: string;
  description: string;
  brandStory: string;
  origin: string;
  country: string;
  abv: number;
  volumeMl: number;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  tastingNotes: string[];
  foodPairings: string[];
  cocktails: { name: string; ingredients: string[]; method: string }[];
  images: string[];
  color: string;
  accentColor: string;
  labelColor: string;
  bottleHeight: number;
  isPremium: boolean;
  isImported: boolean;
  tags: string[];
  nutrition?: { calories: number; carbs: number; sugar: number };
  glbUrl?: string;
  usdzUrl?: string;
};

export type InventoryItem = {
  productId: string;
  /** Catalog / seed on-hand count for this branch. Live stock lives in the inventory store. */
  stock: number;
  promoPrice?: number;
  featured?: boolean;
};

export type InventoryLedgerReason =
  | "sale"
  | "restock"
  | "adjustment"
  | "cancel"
  | "reset";

export type InventoryLedgerEntry = {
  id: string;
  locationId: string;
  productId: string;
  delta: number;
  onHandAfter: number;
  reason: InventoryLedgerReason;
  orderId?: string;
  createdAt: string;
};

export type ActivityAction =
  | "auth.login"
  | "auth.signup"
  | "order.placed"
  | "order.cancelled"
  | "inventory.set"
  | "inventory.adjust"
  | "inventory.restock"
  | "inventory.reset"
  | "catalog.created"
  | "catalog.updated"
  | "category.created"
  | "category.updated"
  | "category.deleted"
  | "event.booked"
  | "user.created"
  | "user.role_updated"
  | "user.deactivated"
  | "user.activated"
  | "user.password_reset"
  | "user.profile_updated"
  | "user.permissions_updated"
  | "user.points_redeemed"
  | "location.created"
  | "location.updated"
  | "location.deleted"
  | "event.created"
  | "event.updated"
  | "event.deleted";

export type ActivityEntityType =
  | "user"
  | "order"
  | "product"
  | "category"
  | "inventory"
  | "event"
  | "location"
  | "profile";

export type ActivityLogEntry = {
  id: string;
  actorUserId?: string;
  actorName: string;
  actorEmail?: string;
  actorRole: string;
  action: ActivityAction | string;
  entityType: ActivityEntityType | string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  locationId?: string;
  createdAt: string;
};

export type StoreLocation = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  hours: { day: string; open: string; close: string }[];
  lat: number;
  lng: number;
  heroImage: string;
  gallery: string[];
  staff: { name: string; role: string; image: string }[];
  services: string[];
  parking: string;
  pickupAvailable: boolean;
  deliveryRadiusKm: number;
  inventory: InventoryItem[];
  featuredOffers: string[];
  description: string;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  type: "wine-tasting" | "whiskey-tasting" | "launch" | "festival";
  description: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  seatsTotal: number;
  seatsAvailable: number;
  image: string;
  hosts: string[];
};

export type Review = {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  images?: string[];
  helpful: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
  fulfillment: "delivery" | "pickup";
};

export type SavedItem = {
  productId: string;
  savedAt: string;
};

export type Order = {
  id: string;
  date: string;
  status: "processing" | "shipped" | "ready" | "delivered" | "cancelled";
  items: { productId: string; quantity: number; price: number }[];
  total: number;
  fulfillment: "delivery" | "pickup";
  locationId: string;
  tracking?: string;
};

export type UserRole = "customer" | "staff" | "admin" | "owner";
export type LoyaltyTier = "Member" | "Connoisseur" | "Collector" | "VIP";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  hasPassword: boolean;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  preferredBranchId: string;
  orderCount: number;
  createdAt: string;
  avatarUrl?: string;
  permissionGrants?: string[];
  permissionRevokes?: string[];
  allowedLocationIds?: string[] | null;
};

export type NewBottleInput = {
  name: string;
  brand: string;
  category: CategorySlug;
  price: number;
  compareAtPrice?: number | null;
  abv: number;
  volumeMl: number;
  origin: string;
  country: string;
  description: string;
  brandStory?: string;
  imageUrl: string;
  images?: string[];
  tastingNotes: string;
  foodPairings?: string;
  isPremium: boolean;
  isImported: boolean;
  initialStock: number;
  stockLocationIds?: string[];
};

export type BottlePatch = Partial<Omit<NewBottleInput, "initialStock" | "stockLocationIds">>;

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  preferredBranchId: string;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  addresses: {
    id: string;
    label: string;
    line1: string;
    city: string;
    state: string;
    zip: string;
    isDefault: boolean;
  }[];
  recentlyViewed: string[];
  orders: Order[];
  createdAt?: string;
  avatarUrl?: string;
  permissionGrants?: string[];
  permissionRevokes?: string[];
  allowedLocationIds?: string[] | null;
};
