import { apiFetch } from "@/lib/api-client";
import type { ActivityLogEntry, ManagedUser, Order, Product, UserProfile } from "@/types";
import type { NewBottleInput } from "@/types";
import { withActor } from "@/lib/current-actor";

type InventorySnapshot = { stocks: Record<string, number>; seats: Record<string, number> };

export async function apiSetInventory(
  locationId: string,
  productId: string,
  quantity: number,
  reason = "adjustment",
) {
  await apiFetch("/api/inventory", {
    method: "PATCH",
    body: JSON.stringify(
      withActor({
        action: "set",
        locationId,
        productId,
        quantity,
        reason,
      }),
    ),
  });
}

export async function apiAdjustInventory(
  locationId: string,
  productId: string,
  delta: number,
  reason = "adjustment",
  orderId?: string,
) {
  await apiFetch("/api/inventory", {
    method: "PATCH",
    body: JSON.stringify(
      withActor({
        action: "adjust",
        locationId,
        productId,
        delta,
        reason,
        orderId,
      }),
    ),
  });
}

export async function apiResetInventory(locationId?: string) {
  const res = await apiFetch("/api/inventory", {
    method: "PATCH",
    body: JSON.stringify(withActor({ action: "reset", locationId })),
  });
  return res as { inventory: InventorySnapshot };
}

export async function apiBookSeats(eventId: string, qty: number) {
  return apiFetch<{ ok: true; inventory?: InventorySnapshot }>("/api/events", {
    method: "POST",
    body: JSON.stringify(withActor({ eventId, qty })),
  });
}

export async function apiCreateCategory(input: {
  name: string;
  tagline?: string;
  description?: string;
  color?: string;
}) {
  return apiFetch<{ category: import("@/types").ShopCategory }>("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiPatchCategory(
  slug: string,
  patch: Partial<{ name: string; tagline: string; description: string; color: string }>,
) {
  return apiFetch<{ category: import("@/types").ShopCategory }>("/api/categories", {
    method: "PATCH",
    body: JSON.stringify({ slug, patch }),
  });
}

export async function apiDeleteCategory(slug: string) {
  return apiFetch<{ ok: true; slug: string }>(`/api/categories?slug=${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}

export async function apiCreateProduct(input: NewBottleInput) {
  return apiFetch<{ product: Product; inventory?: InventorySnapshot }>("/api/products", {
    method: "POST",
    body: JSON.stringify(withActor({ ...input })),
  });
}

export async function apiPatchProduct(
  productId: string,
  patch: import("@/types").BottlePatch,
) {
  return apiFetch<{ product: Product }>("/api/products", {
    method: "PATCH",
    body: JSON.stringify({ productId, patch }),
  });
}

export async function apiPlaceOrder(input: {
  email: string;
  name: string;
  userId?: string;
  locationId: string;
  fulfillment: Order["fulfillment"];
  items: { productId: string; quantity: number }[];
  coupon?: string | null;
}) {
  return apiFetch<{
    order: Order;
    userId: string;
    loyaltyPoints: number;
    inventory: InventorySnapshot;
  }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiCancelOrder(userId: string, orderId: string) {
  return apiFetch<{ order: Order; inventory?: InventorySnapshot }>("/api/orders", {
    method: "PATCH",
    body: JSON.stringify({ userId, orderId }),
  });
}

export async function apiLogin(email: string, password: string) {
  return apiFetch<{ user: UserProfile }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiSignup(name: string, email: string, password: string) {
  return apiFetch<{ user: UserProfile }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function apiLogout() {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function apiMe() {
  return apiFetch<{ user: UserProfile }>("/api/auth/me");
}

export async function apiUpdateMe(
  patch: Partial<
    Pick<UserProfile, "name" | "email" | "avatarUrl" | "preferredBranchId" | "recentlyViewed" | "addresses">
  > & { password?: string },
) {
  return apiFetch<{ user: UserProfile }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ patch }),
  });
}

export async function apiRedeemPoints(redeemPoints: number) {
  return apiFetch<{ user: UserProfile }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ redeemPoints }),
  });
}

export async function apiFetchUsers(params?: {
  q?: string;
  role?: string;
  limit?: number;
  offset?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.role) search.set("role", params.role);
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  if (params?.sortKey) search.set("sortKey", params.sortKey);
  if (params?.sortDir) search.set("sortDir", params.sortDir);
  const query = search.toString();
  return apiFetch<{ users: ManagedUser[]; total: number }>(
    `/api/users${query ? `?${query}` : ""}`,
  );
}

export async function apiCreateUser(input: {
  name: string;
  email: string;
  password: string;
  role: ManagedUser["role"];
  avatarUrl?: string;
  permissionGrants?: string[];
  permissionRevokes?: string[];
  allowedLocationIds?: string[] | null;
}) {
  return apiFetch<{ user: ManagedUser }>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiPatchUser(input: {
  userId: string;
  name?: string;
  email?: string;
  role?: ManagedUser["role"];
  active?: boolean;
  password?: string;
  avatarUrl?: string | null;
  permissionGrants?: string[];
  permissionRevokes?: string[];
  allowedLocationIds?: string[] | null;
}) {
  return apiFetch<{ user: ManagedUser }>("/api/users", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function apiFetchActivity(params?: {
  action?: string;
  actorUserId?: string;
  entityType?: string;
  locationId?: string;
  q?: string;
  limit?: number;
  offset?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  from?: string;
  to?: string;
}) {
  const search = new URLSearchParams();
  if (params?.action) search.set("action", params.action);
  if (params?.actorUserId) search.set("actorUserId", params.actorUserId);
  if (params?.entityType) search.set("entityType", params.entityType);
  if (params?.locationId) search.set("locationId", params.locationId);
  if (params?.q) search.set("q", params.q);
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  if (params?.sortKey) search.set("sortKey", params.sortKey);
  if (params?.sortDir) search.set("sortDir", params.sortDir);
  const query = search.toString();
  return apiFetch<{ logs: ActivityLogEntry[]; total: number }>(
    `/api/activity${query ? `?${query}` : ""}`,
  );
}

export async function apiCreateLocation(input: {
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
  heroImage?: string;
  gallery?: string[];
}) {
  return apiFetch<{ location: import("@/types").StoreLocation }>("/api/locations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiPatchLocation(
  locationId: string,
  patch: Partial<{
    name: string;
    shortName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    description: string;
    pickupAvailable: boolean;
    heroImage: string;
    gallery: string[];
  }>,
) {
  return apiFetch<{ location: import("@/types").StoreLocation }>("/api/locations", {
    method: "PATCH",
    body: JSON.stringify({ locationId, patch }),
  });
}

export async function apiDeleteLocation(locationId: string) {
  return apiFetch<{ ok: true; id: string }>(`/api/locations?id=${encodeURIComponent(locationId)}`, {
    method: "DELETE",
  });
}

export async function apiCreateEvent(input: {
  title: string;
  type: import("@/types").EventItem["type"];
  description: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  seatsTotal: number;
  image?: string;
  hosts?: string[];
}) {
  return apiFetch<{ event: import("@/types").EventItem }>("/api/events", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function apiPatchEvent(
  eventId: string,
  patch: Partial<{
    title: string;
    type: import("@/types").EventItem["type"];
    description: string;
    locationId: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    seatsTotal: number;
    image: string;
    hosts: string[];
  }>,
) {
  return apiFetch<{ event: import("@/types").EventItem }>("/api/events", {
    method: "PATCH",
    body: JSON.stringify({ eventId, patch }),
  });
}

export async function apiDeleteEvent(eventId: string) {
  return apiFetch<{ ok: true; id: string }>(`/api/events?id=${encodeURIComponent(eventId)}`, {
    method: "DELETE",
  });
}
