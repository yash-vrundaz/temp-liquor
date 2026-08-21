import { z } from "zod";

export const categorySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z][a-z0-9-]{1,39}$/, "Use a short lowercase slug, like mezcal.");

export const categoryWriteSchema = z.object({
  name: z.string().trim().min(2).max(40),
  tagline: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(400).optional().default(""),
  color: z.string().trim().max(20).optional().default("#C9A962"),
  slug: categorySlugSchema.optional(),
});

export const categoryPatchSchema = z.object({
  slug: categorySlugSchema,
  patch: categoryWriteSchema.partial(),
});

const mediaUrlSchema = z.string().trim().max(4000);

export const bottleFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(80),
  category: categorySlugSchema,
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  abv: z.number().gt(0).lte(80),
  volumeMl: z.number().int().positive(),
  origin: z.string().max(120).default(""),
  country: z.string().max(80).default(""),
  description: z.string().max(4000).default(""),
  brandStory: z.string().max(4000).default(""),
  imageUrl: mediaUrlSchema.default(""),
  images: z.array(mediaUrlSchema).max(8).optional(),
  tastingNotes: z.string().max(500).default(""),
  foodPairings: z.string().max(500).default(""),
  isPremium: z.boolean().default(false),
  isImported: z.boolean().default(false),
});

export const newBottleSchema = bottleFieldsSchema.extend({
  initialStock: z.number().int().min(0).default(0),
  stockLocationIds: z.array(z.string().min(1)).optional(),
  actorUserId: z.string().min(1).optional(),
});

export const patchBottleSchema = z.object({
  productId: z.string().min(1),
  patch: bottleFieldsSchema.partial(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const addressSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(80),
  line1: z.string().min(1).max(200),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(40),
  zip: z.string().min(1).max(20),
  isDefault: z.boolean(),
});

const avatarUrlSchema = z.string().max(900_000);

export const mePatchSchema = z.union([
  z.object({
    patch: z.object({
      name: z.string().trim().min(2).max(120).optional(),
      email: z.string().email().optional(),
      avatarUrl: avatarUrlSchema.nullable().optional(),
      preferredBranchId: z.string().min(1).optional(),
      recentlyViewed: z.array(z.string()).max(12).optional(),
      addresses: z.array(addressSchema).optional(),
      password: z.string().min(8).max(200).optional(),
    }),
  }),
  z.object({
    redeemPoints: z.number().int().positive(),
  }),
]);

const permissionListSchema = z.array(z.enum([
  "dashboard.access",
  "dashboard.overview",
  "inventory.view",
  "inventory.adjust",
  "inventory.restock",
  "inventory.reset",
  "catalog.create",
  "catalog.edit",
  "catalog.delete",
  "activity.view",
  "users.view",
  "users.create",
  "users.edit",
  "users.assign_roles",
  "users.deactivate",
  "users.reset_password",
  "locations.view",
  "locations.create",
  "locations.edit",
  "locations.delete",
  "events.view",
  "events.create",
  "events.edit",
  "events.delete",
  "deliveries.view",
  "deliveries.manage",
]));

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["customer", "staff", "admin", "owner"]),
  preferredBranchId: z.string().min(1).optional(),
  avatarUrl: avatarUrlSchema.optional(),
  permissionGrants: permissionListSchema.optional(),
  permissionRevokes: permissionListSchema.optional(),
  allowedLocationIds: z.array(z.string().min(1)).nullable().optional(),
});

export const patchUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: z.enum(["customer", "staff", "admin", "owner"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
  avatarUrl: avatarUrlSchema.nullable().optional(),
  permissionGrants: permissionListSchema.optional(),
  permissionRevokes: permissionListSchema.optional(),
  allowedLocationIds: z.array(z.string().min(1)).nullable().optional(),
});

export const profilePatchSchema = z.union([
  z.object({
    userId: z.string().min(1),
    patch: z.object({
      preferredBranchId: z.string().min(1).optional(),
      recentlyViewed: z.array(z.string()).max(12).optional(),
      addresses: z.array(addressSchema).optional(),
    }),
  }),
  z.object({
    userId: z.string().min(1),
    redeemPoints: z.number().int().positive(),
  }),
]);

const deliveryAddressSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Enter a valid phone like (212) 555-0100"),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(40),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Use a 5-digit ZIP"),
  notes: z.string().trim().max(240).optional(),
});

export const placeOrderSchema = z
  .object({
    email: z.string().email(),
    name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Enter a valid phone like (212) 555-0100"),
    /** Ignored by the API — session user id is authoritative when present. */
    userId: z.string().min(1).optional(),
    locationId: z.string().min(1),
    fulfillment: z.enum(["delivery", "pickup"]),
    coupon: z.string().nullable().optional(),
    delivery: deliveryAddressSchema.optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().positive().max(99),
        }),
      )
      .min(1),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment === "delivery" && !data.delivery) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Delivery address is required for delivery orders.",
        path: ["delivery"],
      });
    }
  });

export const cancelOrderSchema = z.object({
  orderId: z.string().min(1),
  /** @deprecated Ignored — cancel requires a signed-in session. */
  userId: z.string().min(1).optional(),
});

export const bookSeatsSchema = z.object({
  eventId: z.string().min(1),
  qty: z.number().int().positive().max(12),
  actorUserId: z.string().min(1).optional(),
});

export const inventoryPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set"),
    locationId: z.string().min(1),
    productId: z.string().min(1),
    quantity: z.number().int().min(0),
    reason: z.string().max(40).optional(),
    actorUserId: z.string().min(1).optional(),
  }),
  z.object({
    action: z.literal("adjust"),
    locationId: z.string().min(1),
    productId: z.string().min(1),
    delta: z.number().int(),
    reason: z.string().max(40).optional(),
    orderId: z.string().optional(),
    actorUserId: z.string().min(1).optional(),
  }),
  z.object({
    action: z.literal("deduct"),
    locationId: z.string().min(1),
    orderId: z.string().min(1),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
    actorUserId: z.string().min(1).optional(),
  }),
  z.object({
    action: z.literal("reset"),
    locationId: z.string().min(1).optional(),
    actorUserId: z.string().min(1).optional(),
  }),
]);

export const locationWriteSchema = z.object({
  name: z.string().trim().min(2).max(160),
  shortName: z.string().trim().min(2).max(40),
  address: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(40),
  zip: z.string().trim().min(3).max(20),
  phone: z.string().trim().min(7).max(40),
  email: z.string().email(),
  description: z.string().trim().max(4000).optional(),
  pickupAvailable: z.boolean().optional(),
  deliveryRadiusKm: z.number().min(0).max(200).optional(),
  parking: z.string().trim().max(400).optional(),
  heroImage: z.string().trim().max(4000).optional(),
  gallery: z.array(z.string().trim().max(4000)).max(8).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const locationPatchSchema = z.object({
  locationId: z.string().min(1),
  patch: locationWriteSchema.partial(),
});

const eventFieldsSchema = z.object({
  title: z.string().trim().min(3).max(160),
  type: z.enum(["wine-tasting", "whiskey-tasting", "launch", "festival"]),
  description: z.string().trim().min(8).max(4000),
  locationId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  startTime: z.string().min(4).max(16),
  endTime: z.string().min(4).max(16),
  price: z.number().min(0).max(10000),
  seatsTotal: z.number().int().min(1).max(2000),
  image: z.string().trim().max(4000).optional(),
  hosts: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
  active: z.boolean().optional(),
});

function refineEventTimes<T extends { startTime?: string; endTime?: string }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End time must be after start time.",
      path: ["endTime"],
    });
  }
}

export const eventWriteSchema = eventFieldsSchema.superRefine(refineEventTimes);

export const eventPatchSchema = z.object({
  eventId: z.string().min(1),
  patch: eventFieldsSchema.partial().superRefine(refineEventTimes),
});
