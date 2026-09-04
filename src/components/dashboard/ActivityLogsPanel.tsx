"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { apiFetchActivity, apiFetchUsers } from "@/lib/api-mutations";
import { accessibleLocations } from "@/lib/auth/location-access";
import { isDbConnected } from "@/lib/runtime-data";
import { isConnectionError } from "@/lib/connection-messages";
import { ConnectionNotice } from "@/components/dashboard/ConnectionNotice";
import { PanelLoading } from "@/components/dashboard/DashboardLoading";
import { hasPermission } from "@/lib/auth/permissions";
import { useUserStore } from "@/store/user";
import type { ActivityLogEntry } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { MobileSortBar, SortableTh, tableCellClass, tableHeadRowClass, tableRowClass, tableWrapClass, useTableSort } from "@/components/ui/SortableTh";

const ENTITY_LABELS: Record<string, string> = {
  user: "User",
  order: "Order",
  product: "Product",
  category: "Category",
  inventory: "Inventory",
  event: "Event",
  location: "Location",
  profile: "Profile",
  driver: "Driver",
};

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Sign in",
  "auth.signup": "Signed up",
  "order.placed": "Order placed",
  "pos.sale": "POS sale",
  "order.cancelled": "Order cancelled",
  "order.status": "Order status",
  "inventory.set": "Stock set",
  "inventory.adjust": "Stock adjusted",
  "inventory.restock": "Restocked",
  "inventory.reset": "Inventory reset",
  "inventory.visibility": "Bottle visibility",
  "catalog.created": "Bottle added",
  "catalog.updated": "Bottle updated",
  "catalog.deleted": "Bottle removed",
  "category.created": "Category added",
  "category.updated": "Category updated",
  "category.deleted": "Category removed",
  "event.booked": "Event booked",
  "user.created": "User created",
  "user.role_updated": "Role changed",
  "role.created": "Role created",
  "role.updated": "Role updated",
  "role.deleted": "Role deleted",
  "user.deactivated": "User deactivated",
  "user.activated": "User activated",
  "user.password_reset": "Password reset",
  "user.profile_updated": "Profile updated",
  "user.permissions_updated": "Permissions updated",
  "user.points_redeemed": "Points redeemed",
  "location.created": "Store added",
  "location.updated": "Store updated",
  "location.deleted": "Store removed",
  "event.created": "Event added",
  "event.updated": "Event updated",
  "event.deleted": "Event removed",
  "delivery.assigned": "Driver assigned",
  "delivery.status": "Delivery status",
  "driver.created": "Driver added",
  "driver.updated": "Driver updated",
  "driver.deactivated": "Driver deactivated",
};

const ACTION_TONE: Record<string, string> = {
  "auth.login": "border-sky-400/30 bg-sky-400/10 text-sky-200",
  "auth.signup": "border-sky-400/30 bg-sky-400/10 text-sky-200",
  "order.placed": "border-(--success)/30 bg-(--success)/10 text-(--success)",
  "pos.sale": "border-(--gold)/30 bg-(--gold)/10 text-gold",
  "order.cancelled": "border-(--danger)/30 bg-(--danger)/10 text-(--danger)",
  "order.status": "border-(--gold)/30 bg-(--gold)/10 text-gold",
  "inventory.set": "border-(--gold)/30 bg-(--gold)/10 text-gold",
  "inventory.adjust": "border-(--gold)/30 bg-(--gold)/10 text-gold",
  "inventory.restock": "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "inventory.reset": "border-white/20 bg-white/5 text-cream",
  "inventory.visibility": "border-(--gold)/30 bg-(--gold)/10 text-gold",
  "catalog.created": "border-violet-400/30 bg-violet-400/10 text-violet-200",
  "catalog.updated": "border-violet-400/30 bg-violet-400/10 text-violet-200",
  "catalog.deleted": "border-(--danger)/30 bg-(--danger)/10 text-(--danger)",
  "category.created": "border-violet-400/30 bg-violet-400/10 text-violet-200",
  "category.updated": "border-violet-400/30 bg-violet-400/10 text-violet-200",
  "category.deleted": "border-(--danger)/30 bg-(--danger)/10 text-(--danger)",
  "event.booked": "border-amber-400/30 bg-amber-400/10 text-amber-200",
  "user.created": "border-violet-400/30 bg-violet-400/10 text-violet-200",
  "user.role_updated": "border-violet-400/30 bg-violet-400/10 text-violet-200",
  "role.created": "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "role.updated": "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "role.deleted": "border-red-400/30 bg-red-400/10 text-red-200",
  "user.deactivated": "border-(--danger)/30 bg-(--danger)/10 text-(--danger)",
  "user.activated": "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "user.password_reset": "border-white/20 bg-white/5 text-muted",
  "user.profile_updated": "border-white/20 bg-white/5 text-muted",
  "user.permissions_updated": "border-violet-400/30 bg-violet-400/10 text-violet-200",
  "user.points_redeemed": "border-(--gold)/30 bg-(--gold)/10 text-gold",
  "location.created": "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "location.updated": "border-white/20 bg-white/5 text-muted",
  "location.deleted": "border-(--danger)/30 bg-(--danger)/10 text-(--danger)",
  "event.created": "border-amber-400/30 bg-amber-400/10 text-amber-200",
  "event.updated": "border-white/20 bg-white/5 text-muted",
  "event.deleted": "border-(--danger)/30 bg-(--danger)/10 text-(--danger)",
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/\./g, " ");
}

function entityLabel(entityType: string) {
  return ENTITY_LABELS[entityType] ?? entityType;
}

function roleLabel(role: string) {
  if (role === "owner" || role === "admin" || role === "staff" || role === "guest") {
    return role;
  }
  return "customer";
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfLocalDay(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

function endOfLocalDay(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

type DatePreset = "all" | "today" | "7d" | "30d" | "month" | "custom";

function rangeForPreset(preset: DatePreset): { fromDate: string; toDate: string } {
  const now = new Date();
  const toDate = toYmd(now);
  if (preset === "today") return { fromDate: toDate, toDate };
  if (preset === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { fromDate: toYmd(start), toDate };
  }
  if (preset === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return { fromDate: toYmd(start), toDate };
  }
  if (preset === "month") {
    return { fromDate: toYmd(new Date(now.getFullYear(), now.getMonth(), 1)), toDate };
  }
  return { fromDate: "", toDate: "" };
}

export function ActivityLogsPanel() {
  const profile = useUserStore((s) => s.profile);
  const canListUsers = hasPermission(profile, "users.view");
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [actor, setActor] = useState("all");
  const [locationId, setLocationId] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { sortKey, sortDir, toggleSort } = useTableSort<"when" | "user" | "action" | "entity">(
    "when",
    "desc",
    ["when"],
  );
  const [knownActors, setKnownActors] = useState<Map<string, string>>(
    () => new Map(profile.id ? [[profile.id, profile.name]] : []),
  );

  useEffect(() => {
    if (!canListUsers || !isDbConnected()) return;
    let cancelled = false;
    void apiFetchUsers({ limit: 100 })
      .then(({ users }) => {
        if (cancelled) return;
        setKnownActors((prev) => {
          const next = new Map(prev);
          for (const user of users) next.set(user.id, user.name);
          return next;
        });
      })
      .catch(() => {
        /* Directory is optional for the user filter. */
      });
    return () => {
      cancelled = true;
    };
  }, [canListUsers]);

  const load = async (pageOverride?: number) => {
    const activePage = pageOverride ?? page;
    if (!isDbConnected()) {
      setLogs([]);
      setTotal(0);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rangeStart = fromDate ? startOfLocalDay(fromDate <= (toDate || fromDate) ? fromDate : toDate) : undefined;
      const rangeEnd = toDate ? endOfLocalDay(toDate >= (fromDate || toDate) ? toDate : fromDate) : undefined;
      const data = await apiFetchActivity({
        q: q.trim() || undefined,
        action: action === "all" ? undefined : action,
        entityType: entityType === "all" ? undefined : entityType,
        actorUserId: actor === "all" ? undefined : actor,
        locationId: locationId === "all" ? undefined : locationId,
        from: rangeStart,
        to: rangeEnd,
        limit: pageSize,
        offset: (activePage - 1) * pageSize,
        sortKey,
        sortDir,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setKnownActors((prev) => {
        const next = new Map(prev);
        for (const log of data.logs) {
          if (log.actorUserId) next.set(log.actorUserId, log.actorName);
        }
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load activity.";
      setError(isConnectionError(message) ? "" : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [action, entityType, actor, locationId, pageSize, sortKey, sortDir, fromDate, toDate]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, entityType, actor, locationId, page, pageSize, sortKey, sortDir, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const actors = useMemo(() => [...knownActors.entries()], [knownActors]);

  const locations = useMemo(() => accessibleLocations(profile), [profile]);

  return (
    <section className="mt-0">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-5">
        <div className="min-w-0">
          <p className="hidden text-[10px] uppercase tracking-[0.22em] text-gold lg:flex lg:items-center lg:gap-2">
            <ClipboardList size={12} className="text-gold" />
            Activity
          </p>
          <h2 className="hidden font-display text-3xl text-cream lg:mt-2 lg:block xl:text-4xl">
            Activity
          </h2>
          <p className="max-w-2xl text-sm text-muted lg:mt-2">
            Audit trail of stock, orders, catalog, and account changes.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Button size="sm" variant="secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {!isDbConnected() ? (
        <ConnectionNotice className="mt-5" feature="view activity history" />
      ) : null}

      <div className="mt-5 space-y-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] lg:grid-cols-[minmax(0,1.6fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)_auto]">
          <label className="min-w-0 sm:col-span-3 lg:col-span-1">
            <span className="sr-only">Search</span>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <Input
                className="py-2 pl-9"
                placeholder="Search activity…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    void load(1);
                  }
                }}
              />
            </div>
          </label>
          <Select
            value={datePreset}
            ariaLabel="Date range"
            onChange={(value) => {
              const preset = value as DatePreset;
              setDatePreset(preset);
              if (preset === "custom") {
                setFiltersOpen(true);
                return;
              }
              const next = rangeForPreset(preset);
              setFromDate(next.fromDate);
              setToDate(next.toDate);
            }}
            options={[
              { value: "all", label: "All time" },
              { value: "today", label: "Today" },
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
              { value: "month", label: "This month" },
              { value: "custom", label: "Custom range" },
            ]}
          />
          <div className="hidden lg:contents">
            <Select
              value={action}
              onChange={setAction}
              ariaLabel="Action"
              options={[
                { value: "all", label: "All actions" },
                ...Object.entries(ACTION_LABELS).map(([id, label]) => ({
                  value: id,
                  label,
                })),
              ]}
            />
            <Select
              value={entityType}
              onChange={setEntityType}
              ariaLabel="Entity"
              options={[
                { value: "all", label: "All entities" },
                ...Object.entries(ENTITY_LABELS).map(([id, label]) => ({
                  value: id,
                  label,
                })),
              ]}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-sm border border-white/10 px-3 text-[11px] uppercase tracking-[0.14em] text-muted transition hover:border-(--gold)/40 hover:text-cream"
          >
            {filtersOpen ? "Less" : "Filters"}
            {(action !== "all" ||
              entityType !== "all" ||
              locationId !== "all" ||
              actor !== "all" ||
              datePreset === "custom") &&
            !filtersOpen ? (
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
            ) : null}
          </button>
        </div>

        {filtersOpen || datePreset === "custom" ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {datePreset === "custom" ? (
              <>
                <label className="block text-xs text-muted">
                  From
                  <Input
                    className="mt-1 py-2 scheme-dark"
                    type="date"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setDatePreset("custom");
                    }}
                  />
                </label>
                <label className="block text-xs text-muted">
                  To
                  <Input
                    className="mt-1 py-2 scheme-dark"
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setDatePreset("custom");
                    }}
                  />
                </label>
              </>
            ) : null}
            <div className="contents lg:hidden">
              <Select
                label="Action"
                value={action}
                onChange={setAction}
                options={[
                  { value: "all", label: "All actions" },
                  ...Object.entries(ACTION_LABELS).map(([id, label]) => ({
                    value: id,
                    label,
                  })),
                ]}
              />
              <Select
                label="Entity"
                value={entityType}
                onChange={setEntityType}
                options={[
                  { value: "all", label: "All entities" },
                  ...Object.entries(ENTITY_LABELS).map(([id, label]) => ({
                    value: id,
                    label,
                  })),
                ]}
              />
            </div>
            <Select
              label="Location"
              value={locationId}
              onChange={setLocationId}
              options={[
                { value: "all", label: "All branches" },
                ...locations.map((loc) => ({
                  value: loc.id,
                  label: loc.shortName,
                })),
              ]}
            />
            <Select
              label="User"
              value={actor}
              onChange={setActor}
              options={[
                { value: "all", label: "Everyone" },
                ...actors
                  .slice()
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([id, name]) => ({
                    value: id,
                    label: name,
                  })),
              ]}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {loading
            ? "Loading…"
            : total === 0
              ? "No events"
              : `Showing ${from}–${to} of ${total} event${total === 1 ? "" : "s"}`}
        </p>
        <PageSizeSelect value={pageSize} onChange={setPageSize} options={[5, 10, 20, 50]} />
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

      {loading && logs.length === 0 ? (
        <PanelLoading label="Loading activity…" />
      ) : (
      <>
      <MobileSortBar
        className="mt-4 lg:hidden"
        columns={[
          { key: "when", label: "When" },
          { key: "user", label: "User" },
          { key: "action", label: "Action" },
          { key: "entity", label: "Entity" },
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
      />

      <div className={`mt-4 hidden lg:block ${tableWrapClass}`}>
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <SortableTh label="When" column="when" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="User" column="user" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Action" column="action" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Entity" column="entity" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 font-medium">Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const loc = locations.find((l) => l.id === log.locationId);
              const when = new Date(log.createdAt);
              return (
                <tr key={log.id} className={tableRowClass}>
                  <td className={`${tableCellClass} align-top text-xs text-muted whitespace-nowrap`}>
                    <time dateTime={log.createdAt} title={format(when, "PPpp")}>
                      {formatDistanceToNow(when, { addSuffix: true })}
                      <span className="mt-1 block text-[10px] uppercase tracking-wider">
                        {format(when, "MMM d, HH:mm")}
                      </span>
                    </time>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-cream">{log.actorName}</p>
                    <p className="text-[11px] uppercase tracking-wider text-gold/80">{roleLabel(log.actorRole)}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${
                        ACTION_TONE[log.action] ?? "border-white/15 text-muted"
                      }`}
                    >
                      {actionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted">
                    {entityLabel(log.entityType)}
                    {loc ? ` · ${loc.shortName}` : ""}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-cream">{log.summary}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ol className="mt-4 space-y-3 lg:hidden">
        {logs.map((log) => {
          const loc = locations.find((l) => l.id === log.locationId);
          const when = new Date(log.createdAt);
          return (
            <li
              key={log.id}
              className="glass border border-white/5 p-4 sm:flex sm:items-start sm:justify-between sm:gap-6"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${
                      ACTION_TONE[log.action] ?? "border-white/15 text-muted"
                    }`}
                  >
                    {actionLabel(log.action)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
                    {entityLabel(log.entityType)}
                  </span>
                  {loc && (
                    <span className="text-[10px] uppercase tracking-wider text-muted">
                      {loc.shortName}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-cream">{log.summary}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <UserRound size={12} />
                    {log.actorName}
                    <span className="uppercase tracking-wider text-gold/80">
                      {roleLabel(log.actorRole)}
                    </span>
                  </span>
                  {log.actorEmail && <span>{log.actorEmail}</span>}
                  {log.entityId && (
                    <span className="font-mono text-[11px] text-white/50">
                      {entityLabel(log.entityType)} · {log.entityId}
                    </span>
                  )}
                </p>
              </div>
              <time
                dateTime={log.createdAt}
                className="mt-3 shrink-0 text-right text-xs text-muted sm:mt-0"
                title={format(when, "PPpp")}
              >
                {formatDistanceToNow(when, { addSuffix: true })}
                <span className="mt-1 block text-[10px] uppercase tracking-wider">
                  {format(when, "MMM d, HH:mm")}
                </span>
              </time>
            </li>
          );
        })}
      </ol>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onChange={setPage}
        className="mt-8"
      />

      {!loading && logs.length === 0 && !error && (
        <div className="mt-10 text-center text-sm text-muted">
          <ClipboardList className="mx-auto mb-3 text-gold/70" size={28} />
          No activity yet. Place an order, restock a bottle, or sign in as owner to start the trail.
        </div>
      )}
      </>
      )}
    </section>
  );
}
