"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  LayoutGrid,
  MoreVertical,
  RefreshCw,
  Search,
  Table2,
  Truck,
} from "lucide-react";
import { OrderSummaryView } from "@/components/dashboard/OrderSummaryView";
import { PanelLoading } from "@/components/dashboard/DashboardLoading";
import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { type LocationFilter } from "@/components/dashboard/LocationScopeBar";
import { useUserStore } from "@/store/user";
import { useInventoryStore } from "@/store/inventory";
import { isDbConnected } from "@/lib/runtime-data";
import {
  apiCancelOrder,
  apiFetchOrders,
  apiUpdateOrderStatus,
} from "@/lib/api-mutations";
import { getLocationById } from "@/data/locations";
import { getProductById } from "@/data/products";
import { hasPermission } from "@/lib/auth/permissions";
import { hasAllLocationAccess } from "@/lib/auth/location-access";
import { dashboardPath, parseDashboardPath } from "@/lib/dashboard/routes";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import {
  compareValues,
  SortableTh,
  tableCellClass,
  tableHeadRowClass,
  tableRowClass,
  tableWrapClass,
  useTableSort,
} from "@/components/ui/SortableTh";
import type { Order, StoreLocation } from "@/types";

type StoreOrder = Order & {
  customerId: string;
  customerName: string;
  customerEmail: string;
};

type SortKey = "customer" | "date" | "fulfillment" | "status" | "total" | "order";
type ViewMode = "cards" | "table";
type StatusTab = "all" | "open" | "ready" | "delivered" | "cancelled";

const STATUS_LABEL: Record<Order["status"], string> = {
  processing: "Processing",
  shipped: "Out for delivery",
  ready: "Ready",
  delivered: "Completed",
  cancelled: "Cancelled",
};

const STATUS_DOT: Record<Order["status"], string> = {
  processing: "bg-amber-400",
  shipped: "bg-sky-400",
  ready: "bg-emerald-400",
  delivered: "bg-emerald-300",
  cancelled: "bg-(--danger)",
};

const TYPE_PILL: Record<Order["fulfillment"], string> = {
  delivery: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  pickup: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  pos: "border-(--gold)/40 bg-(--gold)/10 text-gold",
};

const FULFILLMENT_LABEL: Record<Order["fulfillment"], string> = {
  delivery: "Delivery",
  pickup: "Pickup",
  pos: "In-store",
};

const filterSelectClass =
  "h-10 min-w-0 appearance-none rounded-sm border border-white/10 bg-(--bg-elevated) px-3 pr-8 text-sm text-cream scheme-dark outline-none focus:border-(--gold)/40 [&_option]:bg-(--bg-elevated)";

function itemsSummary(order: Order) {
  if (order.items.length === 0) return "—";
  const first = order.items[0];
  const product = getProductById(first.productId);
  const name = product?.name ?? first.productId;
  if (order.items.length === 1) return `${name} × ${first.quantity}`;
  const qty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return `${name} + ${order.items.length - 1} more · ${qty} bottles`;
}

function bottleCount(order: Order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function nextPickupStatus(status: Order["status"]): Order["status"] | null {
  if (status === "processing") return "ready";
  if (status === "ready") return "delivered";
  return null;
}

function paymentLabel(order: Order) {
  if (order.status === "cancelled") return "Cancelled";
  if (order.fulfillment === "pos") return "Pay at register — paid";
  if (order.fulfillment === "delivery") {
    return order.status === "delivered" ? "Paid · delivered" : "Paid online";
  }
  return order.status === "delivered" || order.status === "ready"
    ? "Paid · pickup"
    : "Paid online";
}

function matchesTab(order: Order, tab: StatusTab) {
  if (tab === "all") return true;
  if (tab === "open") return order.status === "processing" || order.status === "shipped";
  if (tab === "ready") return order.status === "ready";
  if (tab === "delivered") return order.status === "delivered";
  return order.status === "cancelled";
}

type Props = {
  locationId: LocationFilter;
  onLocationChange: (id: LocationFilter) => void;
  locations: StoreLocation[];
};

export function OrdersPanel({ locationId, onLocationChange, locations }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useUserStore((s) => s.profile);
  const cancelLocal = useUserStore((s) => s.cancelOrder);
  const restockOrder = useInventoryStore((s) => s.restockOrder);
  const syncFromServer = useInventoryStore((s) => s.syncFromServer);
  const canView = hasPermission(profile, "orders.view");
  const canManage = hasPermission(profile, "orders.manage");
  const canViewDeliveries = hasPermission(profile, "deliveries.view");
  const allowAll = hasAllLocationAccess(profile);

  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<Order["fulfillment"] | "all">("all");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { sortKey, sortDir, toggleSort } = useTableSort<SortKey>("date", "desc");
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedId = parseDashboardPath(pathname).orderId;

  const setOrderParam = useCallback(
    (orderId: string | null) => {
      router.push(
        orderId
          ? dashboardPath("orders", { orderId })
          : dashboardPath("orders"),
        { scroll: false },
      );
    },
    [router],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!menuId) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuId(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuId]);

  const load = useCallback(async () => {
    if (!isDbConnected()) {
      const fallback = profile.orders
        .filter((o) => locationId === "all" || o.locationId === locationId)
        .filter((o) => fulfillmentFilter === "all" || o.fulfillment === fulfillmentFilter)
        .filter((o) => {
          if (!debouncedQ) return true;
          const q = debouncedQ.toLowerCase();
          return (
            o.id.toLowerCase().includes(q) ||
            profile.name.toLowerCase().includes(q) ||
            profile.email.toLowerCase().includes(q) ||
            (o.tracking ?? "").toLowerCase().includes(q)
          );
        })
        .map((o) => ({
          ...o,
          customerId: profile.id,
          customerName: profile.name,
          customerEmail: profile.email,
        }));
      setOrders(fallback);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetchOrders({
        locationId: locationId === "all" ? undefined : locationId,
        fulfillment: fulfillmentFilter,
        q: debouncedQ || undefined,
      });
      setOrders(data.orders);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQ,
    fulfillmentFilter,
    locationId,
    profile.email,
    profile.id,
    profile.name,
    profile.orders,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => orders.filter((order) => matchesTab(order, statusTab)),
    [orders, statusTab],
  );

  const tabCounts = useMemo(() => {
    const base = {
      all: orders.length,
      open: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      if (order.status === "processing" || order.status === "shipped") base.open += 1;
      if (order.status === "ready") base.ready += 1;
      if (order.status === "delivered") base.delivered += 1;
      if (order.status === "cancelled") base.cancelled += 1;
    }
    return base;
  }, [orders]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === "order") return compareValues(a.id, b.id, sortDir);
      if (sortKey === "date") return compareValues(a.date, b.date, sortDir);
      if (sortKey === "customer") return compareValues(a.customerName, b.customerName, sortDir);
      if (sortKey === "fulfillment") return compareValues(a.fulfillment, b.fulfillment, sortDir);
      if (sortKey === "status") return compareValues(a.status, b.status, sortDir);
      return compareValues(a.total, b.total, sortDir);
    });
  }, [filtered, sortDir, sortKey]);

  useEffect(() => {
    setPage(1);
  }, [locationId, statusTab, fulfillmentFilter, debouncedQ, pageSize, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, sorted.length);
  const pageOrders = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedOrder = selectedId
    ? orders.find((o) => o.id === selectedId) ?? null
    : null;

  const openSummary = (orderId: string) => {
    setMenuId(null);
    setOrderParam(orderId);
  };
  const closeSummary = () => setOrderParam(null);

  const handleCancel = async (order: StoreOrder) => {
    if (!canManage) return;
    if (!window.confirm(`Cancel order ${order.id} and restock bottles?`)) return;
    setBusyId(order.id);
    setMenuId(null);
    try {
      if (isDbConnected()) {
        const result = await apiCancelOrder(profile.id, order.id);
        if (result.inventory) {
          syncFromServer(
            result.inventory.stocks,
            result.inventory.seats,
            result.inventory.hidden,
          );
        }
      } else {
        const soldHere = useInventoryStore
          .getState()
          .ledger.some((e) => e.orderId === order.id && e.reason === "sale");
        cancelLocal(order.id);
        if (soldHere) restockOrder(order.locationId, order.items, order.id);
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o)),
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel order.");
    } finally {
      setBusyId(null);
    }
  };

  const handleStatus = async (order: StoreOrder, status: Order["status"]) => {
    if (!canManage) return;
    setBusyId(order.id);
    setMenuId(null);
    try {
      await apiUpdateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { id: StatusTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "ready", label: "Ready" },
    { id: "delivered", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  const locationOptions = [
    ...(allowAll ? [{ value: "all", label: "All locations" }] : []),
    ...locations.map((loc) => ({ value: loc.id, label: loc.shortName })),
  ];

  if (!canView) {
    return (
      <AccessDenied message="Order access is not enabled for this account. Ask an owner to grant View orders." />
    );
  }

  if (selectedId && selectedOrder) {
    return (
      <OrderSummaryView
        order={selectedOrder}
        onBack={closeSummary}
        canManage={canManage}
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              {selectedOrder.fulfillment !== "delivery" &&
              nextPickupStatus(selectedOrder.status) ? (
                <Button
                  size="sm"
                  disabled={busyId === selectedOrder.id}
                  onClick={() =>
                    void handleStatus(
                      selectedOrder,
                      nextPickupStatus(selectedOrder.status)!,
                    )
                  }
                >
                  Mark{" "}
                  {STATUS_LABEL[nextPickupStatus(selectedOrder.status)!].toLowerCase()}
                </Button>
              ) : null}
              {selectedOrder.status !== "cancelled" &&
              selectedOrder.status !== "delivered" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === selectedOrder.id}
                  onClick={() => void handleCancel(selectedOrder)}
                >
                  Cancel · restock
                </Button>
              ) : null}
              {selectedOrder.fulfillment === "delivery" && canViewDeliveries ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(dashboardPath("deliveries"))}
                >
                  <Truck size={14} />
                  Open deliveries
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />
    );
  }

  if (selectedId && loading) {
    return <PanelLoading label="Loading order…" />;
  }

  if (selectedId && !selectedOrder) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm text-cream">Order not found in this scope.</p>
        <p className="text-sm text-muted">It may belong to another store or was removed.</p>
        <Button type="button" variant="secondary" size="sm" onClick={closeSummary}>
          <ArrowLeft size={14} />
          Back to orders
        </Button>
      </div>
    );
  }

  return (
    <section className="mt-0 min-w-0 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-cream sm:text-3xl">Orders</h2>
          <p className="mt-1 text-sm text-muted">Manage and update order status.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full gap-2 sm:w-auto"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders"
            className="h-10 pl-9"
            aria-label="Search orders"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-sm border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "inline-flex min-h-9 min-w-9 items-center justify-center transition",
                viewMode === "cards" ? "bg-gold/15 text-gold" : "text-muted hover:text-cream",
              )}
              aria-label="Card view"
              aria-pressed={viewMode === "cards"}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex min-h-9 min-w-9 items-center justify-center transition",
                viewMode === "table" ? "bg-gold/15 text-gold" : "text-muted hover:text-cream",
              )}
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
            >
              <Table2 size={15} />
            </button>
          </div>

          <label className="relative min-w-[10.5rem] flex-1 sm:flex-none">
            <span className="sr-only">Status</span>
            <select
              value={statusTab}
              onChange={(e) => setStatusTab(e.target.value as StatusTab)}
              className={cn(filterSelectClass, "w-full")}
              aria-label="Filter by status"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} · {tabCounts[tab.id]}
                </option>
              ))}
            </select>
          </label>

          <label className="relative min-w-[9.5rem] flex-1 sm:flex-none">
            <span className="sr-only">Location</span>
            <select
              value={locationId}
              onChange={(e) => onLocationChange(e.target.value as LocationFilter)}
              className={cn(filterSelectClass, "w-full")}
            >
              {locationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="relative min-w-[8.5rem] flex-1 sm:flex-none">
            <span className="sr-only">Order type</span>
            <select
              value={fulfillmentFilter}
              onChange={(e) =>
                setFulfillmentFilter(e.target.value as Order["fulfillment"] | "all")
              }
              className={cn(filterSelectClass, "w-full")}
            >
              <option value="all">All types</option>
              <option value="pos">In-store</option>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-sm border border-(--danger)/30 bg-(--danger)/10 px-3 py-2 text-sm text-(--danger)"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          {loading
            ? "Loading…"
            : `${sorted.length} order${sorted.length === 1 ? "" : "s"}`}
          {!loading && sorted.length > 0 ? (
            <span>
              {" "}
              · showing {from}–{to}
            </span>
          ) : null}
        </p>
        {!loading && sorted.length > 0 ? (
          <PageSizeSelect
            value={pageSize}
            onChange={setPageSize}
            options={[5, 10, 20, 50]}
          />
        ) : null}
      </div>

      {loading ? (
        <PanelLoading label="Loading orders…" />
      ) : sorted.length === 0 ? (
        <div className="rounded-sm border border-dashed border-white/15 px-4 py-14 text-center">
          <p className="text-sm text-cream">No orders match these filters</p>
          <p className="mt-1 text-sm text-muted">Try another status tab, store, or search.</p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pageOrders.map((order) => {
            const loc = getLocationById(order.locationId);
            const next = order.fulfillment !== "delivery" ? nextPickupStatus(order.status) : null;
            return (
              <article
                key={order.id}
                className="flex flex-col border border-white/10 bg-black/20 p-4 transition hover:border-white/20"
              >
                <button
                  type="button"
                  onClick={() => openSummary(order.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-cream">
                        {order.customerName}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-muted">
                        {order.customerEmail}
                      </p>
                      <p className="mt-2 text-[11px] uppercase tracking-wider text-gold">
                        {order.id}
                      </p>
                    </div>
                    <p className="shrink-0 tabular-nums text-sm text-gold">
                      {formatPrice(order.total)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} />
                    <TypePill type={order.fulfillment} />
                  </div>

                  <p className="mt-3 text-[12px] text-muted">
                    {order.date}
                    {locationId === "all" ? ` · ${loc?.shortName ?? ""}` : ""}
                    {" · "}
                    {bottleCount(order)} bottle{bottleCount(order) === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] text-muted">
                    {itemsSummary(order)}
                  </p>
                  <p className="mt-2 text-[12px] text-muted">{paymentLabel(order)}</p>
                </button>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-9"
                    onClick={() => openSummary(order.id)}
                  >
                    <Eye size={14} />
                    Details
                  </Button>
                  {canManage && next ? (
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-9"
                      disabled={busyId === order.id}
                      onClick={() => void handleStatus(order, next)}
                    >
                      Mark {STATUS_LABEL[next].toLowerCase()}
                    </Button>
                  ) : null}
                  {canManage &&
                  order.status !== "cancelled" &&
                  order.status !== "delivered" ? (
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      className="min-h-9 px-2 text-[11px] uppercase tracking-wider text-muted hover:text-red-300 disabled:opacity-50"
                      onClick={() => void handleCancel(order)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <>
          {/* Mobile list (table too wide) */}
          <div className="space-y-2 lg:hidden">
            {pageOrders.map((order) => {
              const loc = getLocationById(order.locationId);
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => openSummary(order.id)}
                  className="flex w-full flex-col gap-2 border border-white/10 bg-black/20 px-3 py-3 text-left transition hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-cream">{order.customerName}</p>
                      <p className="truncate text-[11px] text-muted">{order.customerEmail}</p>
                    </div>
                    <p className="shrink-0 tabular-nums text-sm text-gold">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} />
                    <TypePill type={order.fulfillment} />
                    <span className="text-[11px] text-muted">{order.date}</span>
                    {locationId === "all" ? (
                      <span className="text-[11px] text-muted">{loc?.shortName}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className={cn("hidden lg:block", tableWrapClass)}>
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className={tableHeadRowClass}>
                  <SortableTh
                    label="Ordered by"
                    column="customer"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <SortableTh
                    label="Status"
                    column="status"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableTh
                    label="Type"
                    column="fulfillment"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableTh
                    label="Ordered on"
                    column="date"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <th className="px-3 py-3 font-medium">Payment</th>
                  <SortableTh
                    label="Total"
                    column="total"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className="text-right"
                  />
                  <th className="w-12 px-2 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageOrders.map((order) => {
                  const next =
                    order.fulfillment !== "delivery" ? nextPickupStatus(order.status) : null;
                  const phone = order.delivery?.phone ?? "—";
                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        tableRowClass,
                        "cursor-pointer hover:bg-white/[0.03]",
                        selectedId === order.id && "bg-(--gold)/5",
                      )}
                      onClick={() => openSummary(order.id)}
                    >
                      <td className={tableCellClass}>
                        <p className="font-medium text-cream">{order.customerName}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{order.id}</p>
                      </td>
                      <td className={cn(tableCellClass, "max-w-[12rem]")}>
                        <p className="truncate text-muted">{order.customerEmail}</p>
                      </td>
                      <td className={cn(tableCellClass, "text-muted")}>{phone}</td>
                      <td className={tableCellClass}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className={tableCellClass}>
                        <TypePill type={order.fulfillment} />
                      </td>
                      <td className={cn(tableCellClass, "text-muted")}>{order.date}</td>
                      <td className={cn(tableCellClass, "text-muted")}>
                        {paymentLabel(order)}
                      </td>
                      <td className={cn(tableCellClass, "text-right tabular-nums text-gold")}>
                        {formatPrice(order.total)}
                      </td>
                      <td
                        className={cn(tableCellClass, "relative text-right")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-sm text-muted hover:bg-white/5 hover:text-cream"
                          aria-label={`Actions for ${order.id}`}
                          aria-expanded={menuId === order.id}
                          onClick={() =>
                            setMenuId((id) => (id === order.id ? null : order.id))
                          }
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuId === order.id ? (
                          <div
                            ref={menuRef}
                            className="absolute right-2 top-full z-20 mt-1 w-48 border border-white/10 bg-(--bg-elevated) py-1 shadow-xl"
                          >
                            <MenuItem
                              icon={<Eye size={14} />}
                              label="View details"
                              onClick={() => openSummary(order.id)}
                            />
                            {canManage && next ? (
                              <MenuItem
                                label={`Mark ${STATUS_LABEL[next].toLowerCase()}`}
                                disabled={busyId === order.id}
                                onClick={() => void handleStatus(order, next)}
                              />
                            ) : null}
                            {canManage &&
                            canViewDeliveries &&
                            order.fulfillment === "delivery" ? (
                              <MenuItem
                                icon={<Truck size={14} />}
                                label="Open deliveries"
                                  onClick={() => {
                                    setMenuId(null);
                                    router.push(dashboardPath("deliveries"));
                                  }}
                              />
                            ) : null}
                            {canManage &&
                            order.status !== "cancelled" &&
                            order.status !== "delivered" ? (
                              <MenuItem
                                label="Cancel · restock"
                                danger
                                disabled={busyId === order.id}
                                onClick={() => void handleCancel(order)}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && sorted.length > 0 ? (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
          className="mt-6"
        />
      ) : null}
    </section>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-cream">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

function TypePill({ type }: { type: Order["fulfillment"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2 py-0.5 text-[11px] font-medium",
        TYPE_PILL[type],
      )}
    >
      {FULFILLMENT_LABEL[type]}
    </span>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition disabled:opacity-40",
        danger ? "text-(--danger) hover:bg-(--danger)/10" : "text-cream hover:bg-white/5",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
