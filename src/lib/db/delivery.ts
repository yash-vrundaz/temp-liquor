import type { DeliveryAddress, DeliveryStatus, Driver, Order } from "@/types";
import { prisma, isDbConfigured } from "@/lib/db/prisma";
import { drivers as seedDrivers } from "@/data/drivers";
import { recordActivity } from "@/lib/db/activity";
import { accessibleLocations, hasAllLocationAccess } from "@/lib/auth/location-access";
import type { UserProfile } from "@/types";

let ready = false;

export async function ensureDeliverySchema() {
  if (!isDbConfigured() || ready) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      vehicle TEXT NOT NULL,
      location_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      active BOOLEAN NOT NULL DEFAULT true,
      photo_url TEXT
    )
  `);
  await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_phone TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address JSONB`);
  for (const driver of seedDrivers) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO drivers (id, name, phone, email, vehicle, location_id, status, active, photo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         vehicle = EXCLUDED.vehicle,
         location_id = EXCLUDED.location_id,
         photo_url = EXCLUDED.photo_url`,
      driver.id,
      driver.name,
      driver.phone,
      driver.email ?? null,
      driver.vehicle,
      driver.locationId,
      driver.status,
      driver.active,
      driver.photoUrl ?? null,
    );
  }
  ready = true;
}

function asDriver(row: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle: string;
  location_id: string;
  status: string;
  active: boolean;
  photo_url: string | null;
}): Driver {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    vehicle: row.vehicle,
    locationId: row.location_id,
    status: row.status as Driver["status"],
    active: row.active,
    photoUrl: row.photo_url ?? undefined,
  };
}

function parseAddress(value: unknown): DeliveryAddress | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  if (typeof row.line1 !== "string" || typeof row.city !== "string") return undefined;
  return {
    name: typeof row.name === "string" ? row.name : "",
    phone: typeof row.phone === "string" ? row.phone : "",
    line1: row.line1,
    line2: typeof row.line2 === "string" ? row.line2 : undefined,
    city: row.city,
    state: typeof row.state === "string" ? row.state : "",
    zip: typeof row.zip === "string" ? row.zip : "",
    notes: typeof row.notes === "string" ? row.notes : undefined,
  };
}

export async function listDrivers(locationId?: string) {
  await ensureDeliverySchema();
  const rows = locationId
    ? await prisma.$queryRawUnsafe<Parameters<typeof asDriver>[0][]>(
        `SELECT * FROM drivers WHERE active = true AND location_id = $1 ORDER BY name`,
        locationId,
      )
    : await prisma.$queryRawUnsafe<Parameters<typeof asDriver>[0][]>(
        `SELECT * FROM drivers WHERE active = true ORDER BY name`,
      );
  return rows.map(asDriver);
}

export async function saveOrderDelivery(orderId: string, delivery: DeliveryAddress) {
  if (!isDbConfigured()) return;
  await ensureDeliverySchema();
  await prisma.$executeRawUnsafe(
    `UPDATE orders
     SET delivery_address = $1::jsonb,
         delivery_phone = $2,
         delivery_status = COALESCE(delivery_status, 'unassigned')
     WHERE id = $3`,
    JSON.stringify(delivery),
    delivery.phone,
    orderId,
  );
}

type DeliveryRow = {
  id: string;
  date: string;
  status: string;
  total: number;
  fulfillment: string;
  location_id: string;
  tracking: string | null;
  driver_id: string | null;
  delivery_status: string | null;
  delivery_phone: string | null;
  delivery_address: unknown;
  driver_name: string | null;
  driver_phone: string | null;
  driver_vehicle: string | null;
  driver_photo: string | null;
  driver_location: string | null;
  driver_status: string | null;
};

function mapDeliveryOrder(row: DeliveryRow, items: Order["items"]): Order {
  const driver =
    row.driver_id && row.driver_name
      ? {
          id: row.driver_id,
          name: row.driver_name,
          phone: row.driver_phone ?? "",
          vehicle: row.driver_vehicle ?? "",
          locationId: row.driver_location ?? row.location_id,
          status: (row.driver_status as Driver["status"]) ?? "on_route",
          active: true,
          photoUrl: row.driver_photo ?? undefined,
        }
      : undefined;
  return {
    id: row.id,
    date: row.date,
    status: row.status as Order["status"],
    items,
    total: row.total,
    fulfillment: row.fulfillment as Order["fulfillment"],
    locationId: row.location_id,
    tracking: row.tracking ?? undefined,
    deliveryStatus: (row.delivery_status as DeliveryStatus | null) ?? undefined,
    driverId: row.driver_id ?? undefined,
    driver,
    delivery: parseAddress(row.delivery_address),
  };
}

export async function listDeliveryOrders(actor: UserProfile) {
  await ensureDeliverySchema();
  const allowAll = hasAllLocationAccess(actor);
  const ids = accessibleLocations(actor).map((loc) => loc.id);
  const rows = allowAll
    ? await prisma.$queryRawUnsafe<DeliveryRow[]>(
        `SELECT o.id, o.date, o.status, o.total, o.fulfillment, o.location_id, o.tracking,
                o.driver_id, o.delivery_status, o.delivery_phone, o.delivery_address,
                d.name AS driver_name, d.phone AS driver_phone, d.vehicle AS driver_vehicle,
                d.photo_url AS driver_photo, d.location_id AS driver_location, d.status AS driver_status
         FROM orders o
         LEFT JOIN drivers d ON d.id = o.driver_id
         WHERE o.fulfillment = 'delivery' AND o.status <> 'cancelled'
         ORDER BY o.created_at DESC
         LIMIT 80`,
      )
    : ids.length
      ? await prisma.$queryRawUnsafe<DeliveryRow[]>(
          `SELECT o.id, o.date, o.status, o.total, o.fulfillment, o.location_id, o.tracking,
                  o.driver_id, o.delivery_status, o.delivery_phone, o.delivery_address,
                  d.name AS driver_name, d.phone AS driver_phone, d.vehicle AS driver_vehicle,
                  d.photo_url AS driver_photo, d.location_id AS driver_location, d.status AS driver_status
           FROM orders o
           LEFT JOIN drivers d ON d.id = o.driver_id
           WHERE o.fulfillment = 'delivery' AND o.status <> 'cancelled'
             AND o.location_id IN (${ids.map((_, i) => `$${i + 1}`).join(",")})
           ORDER BY o.created_at DESC
           LIMIT 80`,
          ...ids,
        )
      : [];

  const orders: Order[] = [];
  for (const row of rows) {
    const items = await prisma.orderItem.findMany({ where: { orderId: row.id } });
    orders.push(
      mapDeliveryOrder(
        row,
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      ),
    );
  }
  return orders;
}

export async function assignDriver(orderId: string, driverId: string, actorUserId?: string) {
  await ensureDeliverySchema();
  const orderRows = await prisma.$queryRawUnsafe<
    { id: string; fulfillment: string; location_id: string; status: string }[]
  >(
    `SELECT id, fulfillment, location_id, status FROM orders WHERE id = $1 LIMIT 1`,
    orderId,
  );
  const order = orderRows[0];
  if (!order) throw new Error("Order not found.");
  if (order.fulfillment !== "delivery") throw new Error("Only delivery orders can be assigned a driver.");
  if (order.status === "cancelled" || order.status === "delivered") {
    throw new Error("This order can no longer be assigned.");
  }

  const driverRows = await prisma.$queryRawUnsafe<Parameters<typeof asDriver>[0][]>(
    `SELECT * FROM drivers WHERE id = $1 AND active = true LIMIT 1`,
    driverId,
  );
  const driver = driverRows[0] ? asDriver(driverRows[0]) : null;
  if (!driver) throw new Error("Driver not found.");
  if (driver.locationId !== order.location_id) {
    throw new Error("Driver must belong to the same store as the order.");
  }

  await prisma.$executeRawUnsafe(
    `UPDATE orders SET driver_id = $1, delivery_status = 'assigned', status = 'shipped' WHERE id = $2`,
    driverId,
    orderId,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE drivers SET status = 'on_route' WHERE id = $1`,
    driverId,
  );
  await recordActivity({
    actorUserId,
    action: "delivery.assigned",
    entityType: "delivery",
    entityId: orderId,
    locationId: driver.locationId,
    summary: `Assigned ${driver.name} to order ${orderId}`,
    metadata: { driverId, orderId },
  });
  return driver;
}

export async function updateDeliveryStatus(
  orderId: string,
  status: DeliveryStatus,
  actorUserId?: string,
) {
  await ensureDeliverySchema();
  const orderStatus =
    status === "delivered" ? "delivered" : status === "unassigned" ? "processing" : "shipped";
  await prisma.$executeRawUnsafe(
    `UPDATE orders SET delivery_status = $1, status = $2 WHERE id = $3`,
    status,
    orderStatus,
    orderId,
  );
  if (status === "delivered" || status === "unassigned") {
    await prisma.$executeRawUnsafe(
      `UPDATE drivers SET status = 'available'
       WHERE id = (SELECT driver_id FROM orders WHERE id = $1)`,
      orderId,
    );
  }
  if (status === "unassigned") {
    await prisma.$executeRawUnsafe(`UPDATE orders SET driver_id = NULL WHERE id = $1`, orderId);
  }
  await recordActivity({
    actorUserId,
    action: "delivery.status",
    entityType: "delivery",
    entityId: orderId,
    summary: `Updated order ${orderId} to ${status.replace("_", " ")}`,
    metadata: { status, orderId },
  });
}

export async function hydrateOrderDelivery(order: Order): Promise<Order> {
  if (!isDbConfigured()) return order;
  await ensureDeliverySchema();
  const rows = await prisma.$queryRawUnsafe<DeliveryRow[]>(
    `SELECT o.id, o.date, o.status, o.total, o.fulfillment, o.location_id, o.tracking,
            o.driver_id, o.delivery_status, o.delivery_phone, o.delivery_address,
            d.name AS driver_name, d.phone AS driver_phone, d.vehicle AS driver_vehicle,
            d.photo_url AS driver_photo, d.location_id AS driver_location, d.status AS driver_status
     FROM orders o
     LEFT JOIN drivers d ON d.id = o.driver_id
     WHERE o.id = $1
     LIMIT 1`,
    order.id,
  );
  const row = rows[0];
  if (!row) return order;
  return mapDeliveryOrder(row, order.items);
}
