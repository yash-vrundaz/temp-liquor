"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { useUserStore } from "@/store/user";
import { isDbConnected } from "@/lib/runtime-data";
import { apiAssignDelivery, apiFetchDeliveries, apiUpdateDeliveryStatus } from "@/lib/api-mutations";
import { drivers as seedDrivers } from "@/data/drivers";
import { demoUser } from "@/data/events";
import { getAllLocations } from "@/data/locations";
import { getProductById } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { useDeliveryStore } from "@/store/delivery";
import { hasPermission } from "@/lib/auth/permissions";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { DeliveryStatus, Driver, Order } from "@/types";

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  picked_up: "Picked up",
  en_route: "En route",
  delivered: "Delivered",
};

const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  assigned: "picked_up",
  picked_up: "en_route",
  en_route: "delivered",
};

export function DeliveriesPanel() {
  const profile = useUserStore((s) => s.profile);
  const canManage = hasPermission(profile, "deliveries.manage");
  const enrich = useDeliveryStore((s) => s.enrich);
  const localAssign = useDeliveryStore((s) => s.assign);
  const localStatus = useDeliveryStore((s) => s.setStatus);
  const localDrivers = useDeliveryStore((s) => s.drivers);
  const [drivers, setDrivers] = useState<Driver[]>(seedDrivers);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!isDbConnected()) {
      const fallback = demoUser.orders
        .filter((order) => order.fulfillment === "delivery" && order.status !== "cancelled")
        .map((order) => enrich(order));
      setDrivers(localDrivers);
      setOrders(fallback);
      return;
    }
    try {
      const data = await apiFetchDeliveries();
      setDrivers(data.drivers);
      setOrders(data.orders.map((order) => enrich(order)));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load deliveries.");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCount = orders.filter((order) => order.deliveryStatus !== "delivered").length;

  const assign = async (orderId: string, driverId: string) => {
    setBusy(orderId);
    try {
      if (isDbConnected()) {
        await apiAssignDelivery(orderId, driverId);
      } else {
        localAssign(orderId, driverId);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign driver.");
    } finally {
      setBusy(null);
    }
  };

  const advance = async (order: Order) => {
    const current = order.deliveryStatus ?? "unassigned";
    const next = NEXT_STATUS[current];
    if (!next) return;
    setBusy(order.id);
    try {
      if (isDbConnected()) {
        await apiUpdateDeliveryStatus(order.id, next);
      } else {
        localStatus(order.id, next);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mt-6">
      <div className="border-b border-white/10 pb-5">
        <h2 className="font-display text-2xl text-cream sm:text-3xl">Deliveries</h2>
        <p className="mt-1 text-sm text-muted">
          Sam&apos;s own drivers. Assign a run, then move it from pickup to en route to delivered.
        </p>
        <p className="mt-2 text-xs uppercase tracking-wider text-gold">
          {openCount} active · {drivers.filter((d) => d.status === "available").length} drivers free
        </p>
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted">No delivery orders yet.</p>
        ) : (
          orders.map((order) => {
            const loc = getAllLocations().find((item) => item.id === order.locationId);
            const status = order.deliveryStatus ?? "unassigned";
            const storeDrivers = drivers.filter((driver) => driver.locationId === order.locationId);
            const next = NEXT_STATUS[status];
            return (
              <article key={order.id} className="glass border border-white/10 p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
                      {order.id} · {loc?.shortName ?? order.locationId}
                    </p>
                    <p className="mt-1 font-display text-xl text-cream">{STATUS_LABEL[status]}</p>
                    <p className="mt-1 text-sm text-muted">
                      {order.delivery
                        ? `${order.delivery.line1}${order.delivery.line2 ? `, ${order.delivery.line2}` : ""}, ${order.delivery.city}`
                        : "Address captured at checkout"}
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-muted">
                      {order.items.map((item) => {
                        const product = getProductById(item.productId);
                        return (
                          <li key={`${order.id}-${item.productId}`}>
                            {product?.name ?? item.productId} × {item.quantity}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 text-sm text-gold">{formatPrice(order.total)}</p>
                  </div>

                  <div className="w-full max-w-sm space-y-3">
                    {order.driver ? (
                      <div className="flex items-center gap-3 border border-white/10 bg-white/5 p-3">
                        <UserAvatar name={order.driver.name} src={order.driver.photoUrl} size={40} />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-cream">{order.driver.name}</p>
                          <p className="truncate text-xs text-muted">{order.driver.vehicle}</p>
                          <p className="text-xs text-gold">{order.driver.phone}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                        <Truck size={14} /> Waiting for a driver
                      </p>
                    )}

                    {canManage && status !== "delivered" ? (
                      <>
                        <Select
                          label="Assign driver"
                          value={order.driverId ?? ""}
                          onChange={(value) => {
                            if (value) void assign(order.id, value);
                          }}
                          options={[
                            { value: "", label: "Choose a driver" },
                            ...storeDrivers.map((driver) => ({
                              value: driver.id,
                              label: `${driver.name} · ${driver.status === "available" ? "free" : driver.status.replace("_", " ")}`,
                            })),
                          ]}
                        />
                        {next ? (
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={busy === order.id || (status === "unassigned" && !order.driverId)}
                            onClick={() => void advance(order)}
                          >
                            Mark {STATUS_LABEL[next].toLowerCase()}
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
