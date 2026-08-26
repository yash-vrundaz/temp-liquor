"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Contact, LayoutGrid, Table2, Truck } from "lucide-react";
import { DriversPanel } from "@/components/dashboard/DriversPanel";
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
import {
  compareValues,
  SortableTh,
  tableCellClass,
  tableHeadRowClass,
  tableRowClass,
  tableWrapClass,
  useTableSort,
} from "@/components/ui/SortableTh";
import { cn } from "@/lib/utils";
import type { DeliveryStatus, Driver, Order } from "@/types";

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  picked_up: "Picked up",
  en_route: "En route",
  delivered: "Delivered",
};

const STATUS_RANK: Record<DeliveryStatus, number> = {
  unassigned: 0,
  assigned: 1,
  picked_up: 2,
  en_route: 3,
  delivered: 4,
};

const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  assigned: "picked_up",
  picked_up: "en_route",
  en_route: "delivered",
};

type ViewMode = "cards" | "table";
type SortKey = "order" | "store" | "status" | "total";
type DeliveriesSection = "deliveries" | "drivers";

const DELIVERIES_SECTIONS: {
  id: DeliveriesSection;
  label: string;
  icon: typeof Truck;
}[] = [
  { id: "deliveries", label: "Deliveries", icon: Truck },
  { id: "drivers", label: "Drivers", icon: Contact },
];

function formatAddress(order: Order) {
  if (!order.delivery) return "Address captured at checkout";
  const line2 = order.delivery.line2 ? `, ${order.delivery.line2}` : "";
  return `${order.delivery.line1}${line2}, ${order.delivery.city}`;
}

function itemsSummary(order: Order) {
  if (order.items.length === 0) return "—";
  const first = order.items[0];
  const product = getProductById(first.productId);
  const name = product?.name ?? first.productId;
  if (order.items.length === 1) return `${name} × ${first.quantity}`;
  const qty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return `${name} + ${order.items.length - 1} more · ${qty} bottles`;
}

const selectClass =
  "rounded-sm border border-white/10 bg-(--bg-elevated) px-2 py-1.5 text-xs text-cream scheme-dark outline-none focus:border-(--gold)/40 [&_option]:bg-(--bg-elevated)";

export function DeliveriesPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section: DeliveriesSection =
    searchParams.get("section") === "drivers" ? "drivers" : "deliveries";

  const setSection = useCallback(
    (next: DeliveriesSection) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "deliveries");
      if (next === "drivers") params.set("section", "drivers");
      else params.delete("section");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <section className="mt-6 min-w-0">
      <div
        className="-mx-3 h-scroll border-b border-white/10 px-3 sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="Deliveries sections"
      >
        {DELIVERIES_SECTIONS.map((tab) => {
          const active = section === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSection(tab.id)}
              className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 py-3 text-xs uppercase tracking-[0.14em] transition-colors sm:px-4 sm:text-sm ${
                active
                  ? "border-(--gold) text-cream"
                  : "border-transparent text-muted hover:text-cream"
              }`}
            >
              <Icon size={14} className={active ? "text-gold" : ""} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {section === "drivers" ? <DriversPanel embedded /> : <DeliveriesQueuePanel />}
    </section>
  );
}

function DeliveriesQueuePanel() {
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
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const { sortKey, sortDir, toggleSort } = useTableSort<SortKey>("status", "asc", ["status"]);

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

  useEffect(() => {
    if (!isDbConnected()) setDrivers(localDrivers);
  }, [localDrivers]);

  const openCount = orders.filter((order) => order.deliveryStatus !== "delivered").length;

  const sortedOrders = useMemo(() => {
    const list = [...orders];
    return list.sort((a, b) => {
      const locA = getAllLocations().find((item) => item.id === a.locationId)?.shortName ?? a.locationId;
      const locB = getAllLocations().find((item) => item.id === b.locationId)?.shortName ?? b.locationId;
      const statusA = a.deliveryStatus ?? "unassigned";
      const statusB = b.deliveryStatus ?? "unassigned";
      if (sortKey === "order") return compareValues(a.id, b.id, sortDir);
      if (sortKey === "store") return compareValues(locA, locB, sortDir);
      if (sortKey === "total") return compareValues(a.total, b.total, sortDir);
      return compareValues(STATUS_RANK[statusA], STATUS_RANK[statusB], sortDir);
    });
  }, [orders, sortKey, sortDir]);

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

  const renderActions = (order: Order, compact = false) => {
    const status = order.deliveryStatus ?? "unassigned";
    const storeDrivers = drivers.filter((driver) => driver.locationId === order.locationId);
    const next = NEXT_STATUS[status];

    if (!canManage || status === "delivered") {
      return order.driver ? (
        <span className="text-xs text-muted">{order.driver.name}</span>
      ) : (
        <span className="text-xs text-muted">—</span>
      );
    }

    return (
      <div className={cn("space-y-2", compact ? "min-w-[10rem]" : "w-full max-w-sm")}>
        {order.driver ? (
          <div className="flex items-center gap-2">
            <UserAvatar name={order.driver.name} src={order.driver.photoUrl} size={compact ? 28 : 40} />
            <div className="min-w-0">
              <p className="truncate text-xs text-cream">{order.driver.name}</p>
              {!compact ? (
                <p className="truncate text-[11px] text-muted">{order.driver.vehicle}</p>
              ) : null}
            </div>
          </div>
        ) : compact ? (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted">
            <Truck size={12} /> Unassigned
          </span>
        ) : (
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <Truck size={14} /> Waiting for a driver
          </p>
        )}

        {compact ? (
          <select
            aria-label={`Assign driver for ${order.id}`}
            className={`${selectClass} w-full`}
            value={order.driverId ?? ""}
            disabled={busy === order.id}
            onChange={(e) => {
              if (e.target.value) void assign(order.id, e.target.value);
            }}
          >
            <option value="">Choose driver</option>
            {storeDrivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} · {driver.status === "available" ? "free" : driver.status.replace("_", " ")}
              </option>
            ))}
          </select>
        ) : (
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
        )}

        {next ? (
          <Button
            size="sm"
            className={compact ? "w-full" : "w-full"}
            disabled={busy === order.id || (status === "unassigned" && !order.driverId)}
            onClick={() => void advance(order)}
          >
            Mark {STATUS_LABEL[next].toLowerCase()}
          </Button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="pt-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-cream sm:text-3xl">Deliveries</h2>
          <p className="mt-1 text-sm text-muted">
            Sam&apos;s own drivers. Assign a run, then move it from pickup to en route to delivered.
          </p>
          <p className="mt-2 text-xs uppercase tracking-wider text-gold">
            {openCount} active · {drivers.filter((d) => d.status === "available").length} drivers free
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="inline-flex shrink-0 rounded-sm border border-white/10 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 px-3 text-[11px] uppercase tracking-wider transition",
              viewMode === "cards" ? "bg-gold/15 text-gold" : "text-muted hover:text-cream",
            )}
            aria-pressed={viewMode === "cards"}
          >
            <LayoutGrid size={14} />
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 px-3 text-[11px] uppercase tracking-wider transition",
              viewMode === "table" ? "bg-gold/15 text-gold" : "text-muted hover:text-cream",
            )}
            aria-pressed={viewMode === "table"}
          >
            <Table2 size={14} />
            Table
          </button>
          </div>
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No delivery orders yet.</p>
      ) : viewMode === "table" ? (
        <div className={`mt-6 ${tableWrapClass}`}>
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                <SortableTh
                  label="Order"
                  column="order"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Store"
                  column="store"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Status"
                  column="status"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <SortableTh
                  label="Total"
                  column="total"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  align="right"
                />
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => {
                const loc = getAllLocations().find((item) => item.id === order.locationId);
                const status = order.deliveryStatus ?? "unassigned";
                return (
                  <tr key={order.id} className={tableRowClass}>
                    <td className={tableCellClass}>
                      <p className="font-medium text-cream">{order.id}</p>
                      <p className="text-[11px] text-muted">{order.date}</p>
                    </td>
                    <td className={tableCellClass}>
                      <p className="text-cream">{loc?.shortName ?? order.locationId}</p>
                    </td>
                    <td className={tableCellClass}>
                      <span className="text-[11px] uppercase tracking-[0.14em] text-gold">
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className={`${tableCellClass} max-w-[14rem]`}>
                      <p className="truncate text-sm text-muted">{formatAddress(order)}</p>
                    </td>
                    <td className={`${tableCellClass} max-w-[16rem]`}>
                      <p className="truncate text-sm text-muted">{itemsSummary(order)}</p>
                    </td>
                    <td className={`${tableCellClass} text-right tabular-nums text-gold`}>
                      {formatPrice(order.total)}
                    </td>
                    <td className={`${tableCellClass} text-right align-top`}>
                      {renderActions(order, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {sortedOrders.map((order) => {
            const loc = getAllLocations().find((item) => item.id === order.locationId);
            const status = order.deliveryStatus ?? "unassigned";
            return (
              <article key={order.id} className="glass border border-white/10 p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
                      {order.id} · {loc?.shortName ?? order.locationId}
                    </p>
                    <p className="mt-1 font-display text-xl text-cream">{STATUS_LABEL[status]}</p>
                    <p className="mt-1 text-sm text-muted">{formatAddress(order)}</p>
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
                  {renderActions(order)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
