"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  MapPin,
  Package,
  Sparkles,
  Tags,
  TrendingUp,
  UserRound,
  Users,
  Wine,
  X,
} from "lucide-react";
import { useUserStore } from "@/store/user";
import { useBranchStore } from "@/store/branch";
import { useInventoryStore } from "@/store/inventory";
import { isDbConnected } from "@/lib/runtime-data";
import { getLocationById, getAllLocations } from "@/data/locations";
import { InventoryPanel } from "@/components/dashboard/InventoryPanel";
import { ActivityLogsPanel } from "@/components/dashboard/ActivityLogsPanel";
import { UsersPanel } from "@/components/dashboard/UsersPanel";
import { LocationsPanel } from "@/components/dashboard/LocationsPanel";
import { EventsPanel } from "@/components/dashboard/EventsPanel";
import { CategoriesPanel } from "@/components/dashboard/CategoriesPanel";
import { ProfilePanel } from "@/components/dashboard/ProfilePanel";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { accessibleLocations, canAccessLocation, hasAllLocationAccess } from "@/lib/auth/location-access";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatPrice } from "@/lib/utils";
import { compareValues, MobileSortBar, SortableTh, tableHeadRowClass, tableWrapClass, useTableSort } from "@/components/ui/SortableTh";
import {
  branchSpendSeries,
  buildDashboardMetrics,
  buildSelectionDetails,
  categorySpendSeries,
  type ChartSelection,
  CHART_COLORS,
  filterOrdersByLocation,
  fulfillmentSeries,
  monthlySpendSeries,
  sameSelection,
  statusSeries,
  topProductsSeries,
} from "@/lib/dashboardAnalytics";
import type { Order } from "@/types";

type LocationFilter = "all" | string;
type DashboardTab =
  | "overview"
  | "inventory"
  | "categories"
  | "locations"
  | "events"
  | "activity"
  | "users"
  | "profile";

const DASHBOARD_TABS: {
  id: DashboardTab;
  label: string;
  icon: typeof TrendingUp;
  permission: Permission;
}[] = [
  { id: "overview", label: "Overview", icon: TrendingUp, permission: "dashboard.overview" },
  { id: "inventory", label: "Inventory", icon: Package, permission: "inventory.view" },
  { id: "categories", label: "Categories", icon: Tags, permission: "catalog.create" },
  { id: "locations", label: "Locations", icon: MapPin, permission: "locations.view" },
  { id: "events", label: "Events", icon: CalendarDays, permission: "events.view" },
  { id: "activity", label: "Activity", icon: ClipboardList, permission: "activity.view" },
  { id: "users", label: "Users", icon: Users, permission: "users.view" },
  { id: "profile", label: "Profile", icon: UserRound, permission: "dashboard.access" },
];

function isDashboardTab(value: string | null): value is DashboardTab {
  return DASHBOARD_TABS.some((tab) => tab.id === value);
}

function canAccessDashboardTab(
  profile: Parameters<typeof hasPermission>[0],
  tab: (typeof DASHBOARD_TABS)[number],
) {
  if (tab.id === "categories") {
    return (
      hasPermission(profile, "catalog.create") ||
      hasPermission(profile, "catalog.edit") ||
      hasPermission(profile, "catalog.delete")
    );
  }
  return hasPermission(profile, tab.permission);
}

function useBreakpoint() {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setBp("mobile");
      else if (w < 1024) setBp("tablet");
      else setBp("desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return bp;
}

const STATUS_STYLES: Record<Order["status"], string> = {
  processing: "text-[var(--gold-bright)] bg-[var(--gold)]/10",
  shipped: "text-[#9bb0c8] bg-[#7a8fa8]/15",
  ready: "text-gold bg-[var(--gold)]/10",
  delivered: "text-[var(--success)] bg-[var(--success)]/10",
  cancelled: "text-[var(--danger)] bg-[var(--danger)]/10",
};

function dimFill(
  fill: string,
  active: boolean,
  hasFocus: boolean,
  hovered = false,
) {
  if (hovered || active) return fill;
  if (hasFocus) return `${fill}44`;
  return fill;
}

function ActivePieShape(props: PieSectorDataItem) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    name,
    value,
    midAngle,
  } = props;
  const rad = Math.PI / 180;
  const sin = Math.sin(-(midAngle ?? 0) * rad);
  const cos = Math.cos(-(midAngle ?? 0) * rad);
  const or = outerRadius as number;
  const sx = (cx ?? 0) + (or + 10) * cos;
  const sy = (cy ?? 0) + (or + 10) * sin;
  const mx = (cx ?? 0) + (or + 20) * cos;
  const my = (cy ?? 0) + (or + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 10;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";
  const displayValue =
    typeof value === "number" && value >= 20 ? formatPrice(value) : value;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={or + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={CHART_COLORS.cream}
        strokeWidth={2}
        style={{ filter: "drop-shadow(0 0 10px rgba(201,169,98,0.35))" }}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={CHART_COLORS.gold}
        fill="none"
        strokeWidth={1}
      />
      <circle cx={ex} cy={ey} r={2.5} fill={CHART_COLORS.gold} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 5 : -5)}
        y={ey}
        dy={3}
        textAnchor={textAnchor}
        fill={CHART_COLORS.cream}
        fontSize={11}
        fontWeight={500}
      >
        {name}
      </text>
      <text
        x={ex + (cos >= 0 ? 5 : -5)}
        y={ey}
        dy={16}
        textAnchor={textAnchor}
        fill={CHART_COLORS.muted}
        fontSize={10}
      >
        {displayValue}
      </text>
    </g>
  );
}

/** Invisible tooltip — keeps Recharts hover/active tracking without the card */
function SilentTooltip() {
  return <Tooltip content={() => null} cursor={false} wrapperStyle={{ outline: "none" }} />;
}

function PointCallout(props: {
  cx?: number;
  cy?: number;
  payload?: { month?: string; label?: string; spend?: number };
}) {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;
  const title = payload.month ?? payload.label ?? "";
  const value = formatPrice(payload.spend ?? 0);
  const up = cy > 56;
  const ly = up ? cy - 18 : cy + 18;
  const ty = up ? cy - 42 : cy + 36;

  return (
    <g style={{ pointerEvents: "none" }}>
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={CHART_COLORS.goldBright}
        stroke={CHART_COLORS.cream}
        strokeWidth={2}
      />
      <path
        d={`M${cx},${cy}L${cx},${ly}L${cx + 14},${ly}`}
        stroke={CHART_COLORS.gold}
        fill="none"
        strokeWidth={1}
      />
      <circle cx={cx + 14} cy={ly} r={2.5} fill={CHART_COLORS.gold} />
      <text
        x={cx + 20}
        y={ty}
        fill={CHART_COLORS.cream}
        fontSize={12}
        fontWeight={500}
      >
        {title}
      </text>
      <text x={cx + 20} y={ty + 14} fill={CHART_COLORS.muted} fontSize={11}>
        {value}
      </text>
    </g>
  );
}

function HorizontalBarCallout(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { shortName?: string; name?: string; spend?: number };
  fill?: string;
  compact?: boolean;
}) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    payload,
    fill,
    compact = false,
  } = props;
  const value = formatPrice(payload?.spend ?? 0);
  const sx = x + width;
  const sy = y + height / 2;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={CHART_COLORS.cream}
        strokeWidth={1.5}
        rx={2}
      />
      <g style={{ pointerEvents: "none" }}>
        {compact ? (
          <text
            x={sx + 6}
            y={sy + 4}
            fill={CHART_COLORS.gold}
            fontSize={11}
            fontWeight={500}
          >
            {value}
          </text>
        ) : (
          <>
            <path
              d={`M${sx},${sy}L${sx + 14},${sy}`}
              stroke={CHART_COLORS.gold}
              fill="none"
              strokeWidth={1}
            />
            <circle cx={sx + 14} cy={sy} r={2.5} fill={CHART_COLORS.gold} />
            <text
              x={sx + 20}
              y={sy - 4}
              fill={CHART_COLORS.cream}
              fontSize={11}
              fontWeight={500}
            >
              {(payload?.shortName ?? payload?.name ?? "").length > 16
                ? `${(payload?.shortName ?? payload?.name ?? "").slice(0, 14)}…`
                : (payload?.shortName ?? payload?.name ?? "")}
            </text>
            <text x={sx + 20} y={sy + 10} fill={CHART_COLORS.muted} fontSize={11}>
              {value}
            </text>
          </>
        )}
      </g>
    </g>
  );
}

function VerticalBarCallout(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { name?: string; spend?: number };
  fill?: string;
  compact?: boolean;
}) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    payload,
    fill,
    compact = false,
  } = props;
  const title = payload?.name ?? "";
  const value = formatPrice(payload?.spend ?? 0);
  const sx = x + width / 2;
  const sy = y;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={CHART_COLORS.cream}
        strokeWidth={1.5}
        rx={2}
      />
      <g style={{ pointerEvents: "none" }}>
        {compact ? (
          <text
            x={sx}
            y={sy - 8}
            textAnchor="middle"
            fill={CHART_COLORS.gold}
            fontSize={11}
            fontWeight={500}
          >
            {value}
          </text>
        ) : (
          <>
            <path
              d={`M${sx},${sy}L${sx},${sy - 14}L${sx + 12},${sy - 14}`}
              stroke={CHART_COLORS.gold}
              fill="none"
              strokeWidth={1}
            />
            <circle cx={sx + 12} cy={sy - 14} r={2.5} fill={CHART_COLORS.gold} />
            <text
              x={sx + 18}
              y={sy - 18}
              fill={CHART_COLORS.cream}
              fontSize={11}
              fontWeight={500}
            >
              {title}
            </text>
            <text x={sx + 18} y={sy - 4} fill={CHART_COLORS.muted} fontSize={11}>
              {value}
            </text>
          </>
        )}
      </g>
    </g>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  delay = 0,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Package;
  trend?: number;
  delay?: number;
}) {
  const up = trend !== undefined && trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="glass relative overflow-hidden p-4 sm:p-5"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-(--gold)/5" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-gold sm:tracking-[0.22em]">
            {label}
          </p>
          <p className="mt-2 font-display text-[1.45rem] leading-none text-cream sm:text-3xl md:text-4xl">
            {value}
          </p>
        </div>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-(--border) bg-(--gold)/10 text-gold sm:h-9 sm:w-9">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        {trend !== undefined ? (
          <span
            className={`inline-flex items-center gap-0.5 ${up ? "text-(--success)" : "text-(--danger)"}`}
          >
            {up ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend).toFixed(0)}%
          </span>
        ) : null}
        <span className="truncate">{hint}</span>
      </div>
    </motion.div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
  action,
  highlighted = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden border bg-(--bg-elevated)/60 p-4 transition-[border-color,box-shadow] duration-300 sm:p-5 md:p-6 ${
        highlighted
          ? "border-(--gold)/50 shadow-[0_0_0_1px_rgba(201,169,98,0.2)]"
          : "border-white/5"
      } ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-cream sm:text-2xl md:text-[1.65rem]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SelectionDetails({
  selection,
  orders,
  onClear,
}: {
  selection: ChartSelection;
  orders: Order[];
  onClear: () => void;
}) {
  const details = buildSelectionDetails(orders, selection);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="border border-(--gold)/35 bg-linear-to-br from-[rgba(201,169,98,0.12)] to-(--bg-elevated) p-4 sm:p-5 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
            {details.typeLabel} detail
          </p>
          <h2 className="mt-1 font-display text-xl text-cream sm:text-2xl md:text-3xl">
            {details.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 border border-white/10 px-3 py-1.5 text-xs text-muted transition-colors hover:border-(--gold)/40 hover:text-cream"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {[
          { label: "Orders", value: String(details.orderCount) },
          {
            label: "Spend",
            value: formatPrice(details.spend),
          },
          { label: "Bottles", value: String(details.bottles) },
          {
            label: "Avg order",
            value: formatPrice(details.avgOrder),
          },
        ].map((stat) => (
          <div key={stat.label} className="min-w-0 border border-white/5 bg-black/20 px-3 py-3 sm:px-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
              {stat.label}
            </p>
            <p className="mt-1 truncate font-display text-lg text-cream sm:text-xl">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {details.lines.length > 0 ? (
        <ul className="mt-5 max-h-64 space-y-2 overflow-y-auto">
          {details.lines.map((line, i) => {
            const content = (
              <>
                <div className="min-w-0">
                  <p className="truncate text-sm text-cream">{line.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{line.detail}</p>
                </div>
                {line.amount !== undefined ? (
                  <span className="shrink-0 tabular-nums text-sm text-gold">
                    {formatPrice(line.amount)}
                  </span>
                ) : null}
              </>
            );
            return line.href ? (
              <li key={`${line.label}-${i}`}>
                <Link
                  href={line.href}
                  className="flex items-center justify-between gap-3 border border-white/5 px-3 py-2.5 transition-colors hover:border-(--gold)/30"
                >
                  {content}
                </Link>
              </li>
            ) : (
              <li
                key={`${line.label}-${i}`}
                className="flex items-center justify-between gap-3 border border-white/5 px-3 py-2.5"
              >
                {content}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-muted">
          No matching orders for this selection.
        </p>
      )}
    </motion.div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center px-4 text-center text-sm text-muted">
      {message}
    </div>
  );
}

function LocationFilterBar({
  value,
  onChange,
  counts,
  locations,
  allowAll,
}: {
  value: LocationFilter;
  onChange: (id: LocationFilter) => void;
  counts: Record<string, number>;
  locations: ReturnType<typeof getAllLocations>;
  allowAll: boolean;
}) {
  const totalOrders = Object.values(counts).reduce((a, b) => a + b, 0);
  const options: { id: LocationFilter; label: string; sub: string }[] = [
    ...(allowAll
      ? [
          {
            id: "all" as const,
            label: "All locations",
            sub: `${totalOrders} orders`,
          },
        ]
      : []),
    ...locations.map((l) => ({
      id: l.id,
      label: l.shortName,
      sub: `${counts[l.id] ?? 0} orders`,
    })),
  ];

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold">
        <MapPin className="h-3.5 w-3.5" />
        Analytics scope
      </div>

      {/* Mobile / small tablet: dropdown */}
      <label className="relative block lg:hidden">
        <span className="sr-only">Choose location scope</span>
        <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gold">
          <MapPin className="h-4 w-4" />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as LocationFilter)}
          className="w-full appearance-none rounded-sm border border-(--gold)/40 bg-(--bg-elevated) py-3.5 pl-10 pr-10 text-sm text-cream scheme-dark focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-gold [&_option]:bg-(--bg-elevated) [&_option]:text-cream"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label} · {opt.sub}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </label>

      {/* Desktop: tabs */}
      <div className="hidden gap-2 lg:flex lg:flex-wrap">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`border px-4 py-2 text-left transition-colors ${
                active
                  ? "border-(--gold)/55 bg-(--gold)/12 text-cream"
                  : "border-white/10 bg-white/2 text-muted hover:border-white/20 hover:text-cream"
              }`}
            >
              <span className="block text-sm font-medium tracking-wide">
                {opt.label}
              </span>
              <span className="mt-0.5 block text-[11px] opacity-70">
                {opt.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MemberDashboard() {
  const { profile, cancelOrder } = useUserStore();
  const restockOrder = useInventoryStore((s) => s.restockOrder);
  const branchId = useBranchStore((s) => s.branchId);
  const setBranch = useBranchStore((s) => s.setBranch);
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const [selection, setSelection] = useState<ChartSelection | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>(branchId);
  const { sortKey: orderSortKey, sortDir: orderSortDir, toggleSort: toggleOrderSort } =
    useTableSort<"order" | "date" | "branch" | "fulfillment" | "status" | "total">(
      "date",
      "desc",
      ["date"],
    );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabs = useMemo(
    () => DASHBOARD_TABS.filter((tab) => canAccessDashboardTab(profile, tab)),
    [profile],
  );
  const requestedTab = searchParams.get("tab");
  const requestedTabAllowed =
    isDashboardTab(requestedTab) && tabs.some((tab) => tab.id === requestedTab);
  const dashboardTab: DashboardTab = requestedTabAllowed
    ? requestedTab
    : (tabs[0]?.id ?? "overview");
  const stores = useMemo(() => accessibleLocations(profile), [profile]);
  const allowAllStores = hasAllLocationAccess(profile);

  const setDashboardTab = useCallback((tab: DashboardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (canAccessLocation(profile, branchId)) {
      setLocationFilter(branchId);
      setSelection(null);
      setHoverKey(null);
    }
  }, [branchId, profile]);

  useEffect(() => {
    if (locationFilter === "all") {
      if (!allowAllStores && stores[0]) setLocationFilter(stores[0].id);
      return;
    }
    if (!canAccessLocation(profile, locationFilter) && stores[0]) {
      setLocationFilter(stores[0].id);
    }
  }, [allowAllStores, locationFilter, profile, stores]);

  const locationCounts = stores.reduce(
    (acc, loc) => {
      acc[loc.id] = profile.orders.filter((o) => o.locationId === loc.id).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const scopedOrders = filterOrdersByLocation(profile.orders, locationFilter);
  const metrics = buildDashboardMetrics(profile, locationFilter);
  const monthly = monthlySpendSeries(scopedOrders);
  const categories = categorySpendSeries(scopedOrders);
  const fulfillment = fulfillmentSeries(scopedOrders);
  const statuses = statusSeries(scopedOrders);
  const branches = branchSpendSeries(scopedOrders);
  const topProducts = topProductsSeries(scopedOrders).map((row) => ({
    ...row,
    shortName:
      row.name.length > (isMobile ? 14 : 22)
        ? `${row.name.slice(0, isMobile ? 12 : 20)}…`
        : row.name,
  }));
  const activeLocation =
    locationFilter === "all" ? null : getLocationById(locationFilter);
  const showAllLocations = locationFilter === "all";

  const firstName = profile.name.split(" ")[0];
  const hasSelection = selection !== null;
  const chartFocus = hasSelection || hoverKey !== null;
  const details = selection
    ? buildSelectionDetails(scopedOrders, selection)
    : null;
  const visibleOrders = details?.orders ?? metrics.orders;
  const sortedOrders = useMemo(() => {
    return [...visibleOrders].sort((a, b) => {
      if (orderSortKey === "order") return compareValues(a.id, b.id, orderSortDir);
      if (orderSortKey === "date") return compareValues(a.date, b.date, orderSortDir);
      if (orderSortKey === "branch") {
        return compareValues(
          getLocationById(a.locationId)?.shortName ?? a.locationId,
          getLocationById(b.locationId)?.shortName ?? b.locationId,
          orderSortDir,
        );
      }
      if (orderSortKey === "fulfillment") {
        return compareValues(a.fulfillment, b.fulfillment, orderSortDir);
      }
      if (orderSortKey === "status") return compareValues(a.status, b.status, orderSortDir);
      return compareValues(a.total, b.total, orderSortDir);
    });
  }, [visibleOrders, orderSortKey, orderSortDir]);
  const scopeLabel = activeLocation?.shortName ?? "All locations";

  const setLocation = (id: LocationFilter) => {
    setLocationFilter(id);
    if (id !== "all") setBranch(id);
    setSelection(null);
    setHoverKey(null);
  };

  const handleCancelOrder = (orderId: string) => {
    const soldHere = useInventoryStore
      .getState()
      .ledger.some((e) => e.orderId === orderId && e.reason === "sale");
    const order = cancelOrder(orderId);
    if (order && soldHere && !isDbConnected()) {
      restockOrder(order.locationId, order.items, order.id);
    }
  };

  const toggle = (next: ChartSelection) => {
    setSelection((prev) => (sameSelection(prev, next) ? null : next));
  };

  const isHovered = (key: string) => hoverKey === key;
  const isFocused = (selected: boolean, key: string) =>
    selected || isHovered(key);

  const panelFor = (type: ChartSelection["type"]) =>
    selection?.type === type;

  if (requestedTab && !requestedTabAllowed) {
    notFound();
  }

  return (
    <div className="relative overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 ambient-bg opacity-80" />
      <div className="pointer-events-none absolute inset-0 luxury-grid opacity-40" />

      <div className="relative mx-auto w-full max-w-7xl px-3 py-8 sm:px-5 md:px-8 md:py-14 lg:py-16">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
              {ROLE_LABELS[profile.role]} ·{" "}
              {dashboardTab === "inventory"
                ? "Inventory"
                : dashboardTab === "categories"
                  ? "Categories"
                : dashboardTab === "activity"
                  ? "Activity"
                  : dashboardTab === "users"
                    ? "Users"
                    : dashboardTab === "locations"
                      ? "Locations"
                      : dashboardTab === "events"
                        ? "Events"
                        : dashboardTab === "profile"
                          ? "Profile"
                          : "Store analytics"}
            </p>
            <h1 className="mt-2 wrap-break-word font-display text-3xl text-cream sm:text-4xl md:text-5xl">
              {firstName}&apos;s command center
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted md:text-base">
              {dashboardTab === "inventory"
                ? "Manage bottle counts, restock, and add products per store."
                : dashboardTab === "categories"
                  ? "Add, rename, or remove shop collections used on bottles."
                : dashboardTab === "activity"
                  ? "Audit trail of who changed stock, orders, catalog, and account settings."
                  : dashboardTab === "users"
                    ? "Create accounts, assign roles, store access, and permissions for a specific user."
                    : dashboardTab === "locations"
                      ? "Add, edit, or remove stores in the Sam’s network."
                      : dashboardTab === "events"
                        ? "Create and remove tastings, launches, and in-store events."
                        : dashboardTab === "profile"
                          ? "Update your photo, name, email, and password."
                : isMobile
                  ? "Pick a location, then tap charts for store details."
                  : "Sales, order health, and branch performance across Sam's locations."}
            </p>
          </div>
        </div>

        <div
          className="mt-6 -mx-3 h-scroll border-b border-white/10 px-3 sm:-mx-5 sm:px-5 md:-mx-8 md:px-8"
          role="tablist"
          aria-label="Dashboard sections"
        >
          {tabs.map((tab) => {
            const active = dashboardTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setDashboardTab(tab.id);
                  if (
                    tab.id === "inventory" &&
                    (locationFilter === "all" || !getLocationById(locationFilter))
                  ) {
                    setLocation(stores.find((s) => s.id === branchId)?.id ?? stores[0]?.id ?? branchId);
                  }
                }}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm uppercase tracking-[0.14em] transition-colors sm:px-4 ${
                  active
                    ? "border-(--gold) text-cream"
                    : "border-transparent text-muted hover:text-cream"
                }`}
              >
                <Icon size={14} className={active ? "text-gold" : ""} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {dashboardTab === "inventory" ? (
          <InventoryPanel
            locationId={locationFilter}
            onLocationChange={setLocation}
            locations={stores}
          />
        ) : dashboardTab === "categories" ? (
          <CategoriesPanel />
        ) : dashboardTab === "locations" ? (
          <LocationsPanel />
        ) : dashboardTab === "events" ? (
          <EventsPanel />
        ) : dashboardTab === "activity" ? (
          <ActivityLogsPanel />
        ) : dashboardTab === "users" ? (
          <UsersPanel />
        ) : dashboardTab === "profile" ? (
          <ProfilePanel />
        ) : (
          <>
        <LocationFilterBar
          value={locationFilter}
          onChange={setLocation}
          counts={locationCounts}
          locations={stores}
          allowAll={allowAllStores}
        />

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <KpiCard
            label="Total spent"
            value={formatPrice(metrics.totalSpent)}
            hint={scopeLabel}
            icon={TrendingUp}
            trend={metrics.spendTrend}
            delay={0.05}
          />
          <KpiCard
            label="Avg order"
            value={formatPrice(metrics.avgOrder)}
            hint={`${metrics.billed.length} completed`}
            icon={Package}
            delay={0.1}
          />
          <KpiCard
            label="Bottles sold"
            value={String(metrics.bottles)}
            hint={`${metrics.activeCount} active now`}
            icon={Wine}
            delay={0.15}
          />
          <KpiCard
            label="Active orders"
            value={String(metrics.activeCount)}
            hint={`${metrics.orderCount} in scope`}
            icon={Sparkles}
            delay={0.2}
          />
        </div>

        {activeLocation ? (
          <motion.div
            key={activeLocation.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 border border-(--gold)/25 bg-(--gold)/6 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
                  Viewing location
                </p>
                <p className="mt-1 font-display text-xl text-cream sm:text-2xl">
                  {activeLocation.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {activeLocation.address}, {activeLocation.city}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                    Orders
                  </p>
                  <p className="mt-0.5 text-cream">{metrics.orderCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                    Spend
                  </p>
                  <p className="mt-0.5 text-gold">
                    {formatPrice(metrics.totalSpent)}
                  </p>
                </div>
                <Link
                  href={`/locations/${activeLocation.slug}`}
                  className="self-end text-sm text-gold"
                >
                  Store page →
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}

        <AnimatePresence mode="wait">
          {selection ? (
            <div className="mt-6">
              <SelectionDetails
                key={`${locationFilter}-${selection.type}-${selection.key}`}
                selection={selection}
                orders={scopedOrders}
                onClear={() => setSelection(null)}
              />
            </div>
          ) : null}
        </AnimatePresence>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <Panel
            className="lg:col-span-3"
            title="Spending over time"
            subtitle={`${scopeLabel}${isMobile ? "" : " · hover · click for details"}`}
            highlighted={panelFor("month")}
          >
            <div className="h-52 w-full min-w-0 overflow-hidden cursor-pointer sm:h-64 md:h-72">
              {monthly.length === 0 ? (
                <EmptyChart message="No completed orders in this location yet." />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthly}
                  margin={{
                    top: isMobile ? 28 : 36,
                    right: isMobile ? 16 : 28,
                    left: 0,
                    bottom: 0,
                  }}
                  onMouseMove={(state) => {
                    const index =
                      typeof state?.activeIndex === "number"
                        ? state.activeIndex
                        : typeof state?.activeTooltipIndex === "number"
                          ? state.activeTooltipIndex
                          : -1;
                    const payload = monthly[index];
                    if (payload) setHoverKey(`month:${payload.key}`);
                  }}
                  onMouseLeave={() => setHoverKey(null)}
                  onClick={(state) => {
                    const index =
                      typeof state?.activeIndex === "number"
                        ? state.activeIndex
                        : typeof state?.activeTooltipIndex === "number"
                          ? state.activeTooltipIndex
                          : -1;
                    const payload = monthly[index];
                    if (!payload) return;
                    toggle({
                      type: "month",
                      key: payload.key,
                      label: payload.label,
                    });
                  }}
                >
                  <defs>
                    <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={CHART_COLORS.gold}
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="100%"
                        stopColor={CHART_COLORS.gold}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: CHART_COLORS.muted, fontSize: isMobile ? 10 : 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={isMobile ? "preserveStartEnd" : 0}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.muted, fontSize: isMobile ? 10 : 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                    width={isMobile ? 36 : 42}
                  />
                  <SilentTooltip />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    name="Spend"
                    stroke={CHART_COLORS.gold}
                    strokeWidth={2.25}
                    fill="url(#spendFill)"
                    activeDot={(props) => <PointCallout {...props} />}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const active =
                        selection?.type === "month" &&
                        selection.key === payload.key;
                      if (cx == null || cy == null) return null;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={active ? 6 : 3.5}
                          fill={
                            active ? CHART_COLORS.goldBright : CHART_COLORS.gold
                          }
                          stroke={active ? CHART_COLORS.cream : "transparent"}
                          strokeWidth={active ? 2 : 0}
                          style={{ cursor: "pointer" }}
                        />
                      );
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </Panel>

          <Panel
            className="lg:col-span-2"
            title="By category"
            subtitle={scopeLabel}
            highlighted={panelFor("category")}
          >
            <div className="h-52 w-full min-w-0 overflow-hidden sm:h-64 md:h-72">
              {categories.length === 0 ? (
                <EmptyChart message="No category spend for this location." />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart
                  margin={{
                    top: isMobile ? 8 : 12,
                    right: isMobile ? 24 : 36,
                    bottom: isMobile ? 8 : 12,
                    left: isMobile ? 24 : 36,
                  }}
                >
                  <SilentTooltip />
                  <Pie
                    data={categories}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="48%"
                    outerRadius="66%"
                    paddingAngle={3}
                    stroke="transparent"
                    style={{ cursor: "pointer" }}
                    activeShape={ActivePieShape}
                    onMouseEnter={(_, index) => {
                      const entry = categories[index];
                      if (entry) setHoverKey(`category:${entry.name}`);
                    }}
                    onMouseLeave={() => setHoverKey(null)}
                    onClick={(_, index) => {
                      const entry = categories[index];
                      if (!entry) return;
                      toggle({
                        type: "category",
                        key: entry.name,
                        label: entry.name,
                      });
                    }}
                  >
                    {categories.map((entry) => {
                      const selected =
                        selection?.type === "category" &&
                        selection.key === entry.name;
                      const hovered = isHovered(`category:${entry.name}`);
                      return (
                        <Cell
                          key={entry.name}
                          fill={dimFill(
                            entry.fill,
                            selected,
                            chartFocus,
                            hovered,
                          )}
                          stroke={
                            isFocused(selected, `category:${entry.name}`)
                              ? CHART_COLORS.cream
                              : "transparent"
                          }
                          strokeWidth={
                            isFocused(selected, `category:${entry.name}`)
                              ? 2
                              : 0
                          }
                          style={{ cursor: "pointer", outline: "none" }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
            <ul className="mt-1 grid grid-cols-1 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-2">
              {categories.map((c) => {
                const selected =
                  selection?.type === "category" && selection.key === c.name;
                const hovered = isHovered(`category:${c.name}`);
                return (
                  <li key={c.name}>
                    <button
                      type="button"
                      onMouseEnter={() => setHoverKey(`category:${c.name}`)}
                      onMouseLeave={() => setHoverKey(null)}
                      onClick={() =>
                        toggle({
                          type: "category",
                          key: c.name,
                          label: c.name,
                        })
                      }
                      className={`flex w-full items-center gap-2 rounded-sm px-1 py-0.5 text-left transition-all ${
                        chartFocus && !selected && !hovered
                          ? "opacity-35"
                          : "opacity-100"
                      } ${hovered || selected ? "bg-white/5" : ""}`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ background: c.fill }}
                      />
                      <span
                        className={`truncate ${hovered || selected ? "text-gold" : "text-cream"}`}
                      >
                        {c.name}
                      </span>
                      <span className="ml-auto tabular-nums text-muted">
                        {formatPrice(c.value)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel
            title="Top bottles"
            subtitle={scopeLabel}
            highlighted={panelFor("product")}
          >
            <div className="h-52 w-full min-w-0 overflow-hidden cursor-pointer sm:h-56 md:h-64">
              {topProducts.length === 0 ? (
                <EmptyChart message="No bottle purchases for this location." />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{
                    top: 8,
                    right: isMobile ? 52 : 72,
                    left: 0,
                    bottom: 0,
                  }}
                  onMouseLeave={() => setHoverKey(null)}
                >
                  <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={isMobile ? 64 : 88}
                    tick={{ fill: CHART_COLORS.cream, fontSize: isMobile ? 9 : 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <SilentTooltip />
                  <Bar
                    dataKey="spend"
                    name="Spend"
                    radius={[0, 2, 2, 0]}
                    barSize={isMobile ? 12 : 14}
                    cursor="pointer"
                    activeBar={(props) => (
                      <HorizontalBarCallout {...props} compact={isMobile} />
                    )}
                    onMouseEnter={(_, index) => {
                      const payload = topProducts[index];
                      if (payload) setHoverKey(`product:${payload.key}`);
                    }}
                    onClick={(_, index) => {
                      const payload = topProducts[index];
                      if (!payload?.key) return;
                      toggle({
                        type: "product",
                        key: payload.key,
                        label: payload.name,
                      });
                    }}
                  >
                    {topProducts.map((row, i) => {
                      const fill =
                        CHART_COLORS.series[i % CHART_COLORS.series.length];
                      const selected =
                        selection?.type === "product" &&
                        selection.key === row.key;
                      const hovered = isHovered(`product:${row.key}`);
                      return (
                        <Cell
                          key={row.key}
                          fill={dimFill(fill, selected, chartFocus, hovered)}
                          stroke={
                            isFocused(selected, `product:${row.key}`)
                              ? CHART_COLORS.cream
                              : "transparent"
                          }
                          strokeWidth={
                            isFocused(selected, `product:${row.key}`) ? 1.5 : 0
                          }
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </Panel>

          <Panel
            title={showAllLocations ? "Branch mix" : "This location"}
            subtitle={
              showAllLocations
                ? "Spend across all Sam's branches"
                : "Scoped to the selected store"
            }
            highlighted={panelFor("branch")}
          >
            {showAllLocations ? (
            <div className="h-52 w-full min-w-0 overflow-hidden cursor-pointer sm:h-56 md:h-64">
              {branches.length === 0 ? (
                <EmptyChart message="No branch spend yet." />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={branches}
                  margin={{
                    top: isMobile ? 28 : 40,
                    right: isMobile ? 16 : 48,
                    left: 0,
                    bottom: 0,
                  }}
                  onMouseLeave={() => setHoverKey(null)}
                >
                  <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART_COLORS.muted, fontSize: isMobile ? 10 : 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                    width={isMobile ? 36 : 44}
                  />
                  <SilentTooltip />
                  <Bar
                    dataKey="spend"
                    name="Spend"
                    radius={[2, 2, 0, 0]}
                    barSize={isMobile ? 22 : 28}
                    cursor="pointer"
                    activeBar={(props) => (
                      <VerticalBarCallout {...props} compact={isMobile} />
                    )}
                    onMouseEnter={(_, index) => {
                      const payload = branches[index];
                      if (payload) setHoverKey(`branch:${payload.key}`);
                    }}
                    onClick={(_, index) => {
                      const payload = branches[index];
                      if (!payload?.key) return;
                      toggle({
                        type: "branch",
                        key: payload.key,
                        label: payload.name,
                      });
                    }}
                  >
                    {branches.map((b) => {
                      const selected =
                        selection?.type === "branch" && selection.key === b.key;
                      const hovered = isHovered(`branch:${b.key}`);
                      return (
                        <Cell
                          key={b.key}
                          fill={dimFill(b.fill, selected, chartFocus, hovered)}
                          stroke={
                            isFocused(selected, `branch:${b.key}`)
                              ? CHART_COLORS.cream
                              : "transparent"
                          }
                          strokeWidth={
                            isFocused(selected, `branch:${b.key}`) ? 1.5 : 0
                          }
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
            ) : (
              <div className="flex h-52 flex-col justify-center gap-4 sm:h-56 md:h-64">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-white/5 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                      Orders here
                    </p>
                    <p className="mt-1 font-display text-2xl text-cream">
                      {metrics.orderCount}
                    </p>
                  </div>
                  <div className="border border-white/5 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                      Active
                    </p>
                    <p className="mt-1 font-display text-2xl text-cream">
                      {metrics.activeCount}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted">
                  Switch to <button type="button" className="text-gold" onClick={() => setLocation("all")}>All locations</button> to compare Downtown, Waterfront, and Uptown side by side.
                </p>
              </div>
            )}
          </Panel>
        </div>

        <Panel
          className="mt-4"
          title="Order health"
          subtitle={`${scopeLabel} · status & fulfillment`}
          highlighted={panelFor("status") || panelFor("fulfillment")}
        >
          {statuses.length === 0 && fulfillment.every((f) => f.value === 0) ? (
            <EmptyChart message="No order activity for this location." />
          ) : (
          <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-56 w-full min-w-0 overflow-hidden sm:h-64 md:h-72 lg:h-80">
              <p className="mb-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted">
                Order status
              </p>
              <div className="h-[calc(100%-1.25rem)]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart
                  margin={{
                    top: isMobile ? 8 : 12,
                    right: isMobile ? 28 : 40,
                    bottom: isMobile ? 8 : 12,
                    left: isMobile ? 28 : 40,
                  }}
                >
                  <SilentTooltip />
                  <Pie
                    data={statuses}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={isMobile ? "74%" : "80%"}
                    stroke="transparent"
                    style={{ cursor: "pointer" }}
                    activeShape={ActivePieShape}
                    onMouseEnter={(_, index) => {
                      const entry = statuses[index];
                      if (entry) setHoverKey(`status:${entry.key}`);
                    }}
                    onMouseLeave={() => setHoverKey(null)}
                    onClick={(_, index) => {
                      const entry = statuses[index];
                      if (!entry) return;
                      toggle({
                        type: "status",
                        key: entry.key,
                        label: entry.name,
                      });
                    }}
                  >
                    {statuses.map((s) => {
                      const selected =
                        selection?.type === "status" && selection.key === s.key;
                      const hovered = isHovered(`status:${s.key}`);
                      return (
                        <Cell
                          key={s.key}
                          fill={dimFill(s.fill, selected, chartFocus, hovered)}
                          stroke={
                            isFocused(selected, `status:${s.key}`)
                              ? CHART_COLORS.cream
                              : "transparent"
                          }
                          strokeWidth={
                            isFocused(selected, `status:${s.key}`) ? 2 : 0
                          }
                          style={{ cursor: "pointer", outline: "none" }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              </div>
            </div>
            <div className="h-56 w-full min-w-0 overflow-hidden sm:h-64 md:h-72 lg:h-80">
              <p className="mb-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted">
                Fulfillment
              </p>
              <div className="h-[calc(100%-1.25rem)]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart
                  margin={{
                    top: isMobile ? 8 : 12,
                    right: isMobile ? 28 : 40,
                    bottom: isMobile ? 8 : 12,
                    left: isMobile ? 28 : 40,
                  }}
                >
                  <SilentTooltip />
                  <Pie
                    data={fulfillment}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={isMobile ? "42%" : "48%"}
                    outerRadius={isMobile ? "74%" : "80%"}
                    stroke="transparent"
                    paddingAngle={3}
                    style={{ cursor: "pointer" }}
                    activeShape={ActivePieShape}
                    onMouseEnter={(_, index) => {
                      const entry = fulfillment[index];
                      if (entry) setHoverKey(`fulfillment:${entry.key}`);
                    }}
                    onMouseLeave={() => setHoverKey(null)}
                    onClick={(_, index) => {
                      const entry = fulfillment[index];
                      if (!entry) return;
                      toggle({
                        type: "fulfillment",
                        key: entry.key,
                        label: entry.name,
                      });
                    }}
                  >
                    {fulfillment.map((f) => {
                      const selected =
                        selection?.type === "fulfillment" &&
                        selection.key === f.key;
                      const hovered = isHovered(`fulfillment:${f.key}`);
                      return (
                        <Cell
                          key={f.key}
                          fill={dimFill(f.fill, selected, chartFocus, hovered)}
                          stroke={
                            isFocused(selected, `fulfillment:${f.key}`)
                              ? CHART_COLORS.cream
                              : "transparent"
                          }
                          strokeWidth={
                            isFocused(selected, `fulfillment:${f.key}`) ? 2 : 0
                          }
                          style={{ cursor: "pointer", outline: "none" }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-muted">
            {statuses.map((s) => {
              const selected =
                selection?.type === "status" && selection.key === s.key;
              const hovered = isHovered(`status:${s.key}`);
              return (
                <button
                  key={s.key}
                  type="button"
                  onMouseEnter={() => setHoverKey(`status:${s.key}`)}
                  onMouseLeave={() => setHoverKey(null)}
                  onClick={() =>
                    toggle({
                      type: "status",
                      key: s.key,
                      label: s.name,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-sm px-1.5 py-1 transition-all ${
                    chartFocus && !selected && !hovered
                      ? "opacity-35"
                      : "opacity-100"
                  } ${hovered || selected ? "bg-white/5 text-cream" : ""}`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: s.fill }}
                  />
                  {s.name} ({s.value})
                </button>
              );
            })}
            {fulfillment.map((f) => {
              const selected =
                selection?.type === "fulfillment" && selection.key === f.key;
              const hovered = isHovered(`fulfillment:${f.key}`);
              return (
                <button
                  key={f.key}
                  type="button"
                  onMouseEnter={() => setHoverKey(`fulfillment:${f.key}`)}
                  onMouseLeave={() => setHoverKey(null)}
                  onClick={() =>
                    toggle({
                      type: "fulfillment",
                      key: f.key,
                      label: f.name,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-sm px-1.5 py-1 transition-all ${
                    chartFocus && !selected && !hovered
                      ? "opacity-35"
                      : "opacity-100"
                  } ${hovered || selected ? "bg-white/5 text-cream" : ""}`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: f.fill }}
                  />
                  {f.name} ({f.value})
                </button>
              );
            })}
          </div>
          </>
          )}
        </Panel>

        <Panel
          className="mt-4"
          title="Orders & tracking"
          subtitle={
            selection
              ? `${scopeLabel} · filtered to ${selection.label}`
              : `${scopeLabel} · order history`
          }
          highlighted={hasSelection}
          action={
            <span className="text-xs uppercase tracking-[0.18em] text-muted">
              {visibleOrders.length} shown
            </span>
          }
        >
          <MobileSortBar
            className="mb-3 md:hidden"
            columns={[
              { key: "order", label: "Order" },
              { key: "date", label: "Date" },
              ...(showAllLocations
                ? [{ key: "branch" as const, label: "Branch" }]
                : []),
              { key: "fulfillment", label: "Fulfillment" },
              { key: "status", label: "Status" },
              { key: "total", label: "Total" },
            ]}
            sortKey={orderSortKey}
            sortDir={orderSortDir}
            onSort={toggleOrderSort}
          />
          <div className="space-y-2 md:hidden">
            {sortedOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                No orders for this location
                {selection ? " and chart filter" : ""}.
              </p>
            ) : (
              sortedOrders.map((o) => {
                const loc = getLocationById(o.locationId);
                return (
                  <div
                    key={o.id}
                    className="border border-white/5 bg-black/15 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-cream">
                          {o.id}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {o.date}
                          {showAllLocations ? ` · ${loc?.shortName ?? ""}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 tabular-nums text-sm text-gold">
                        {formatPrice(o.total)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs capitalize text-muted">
                        {o.fulfillment}
                      </span>
                      <span
                        className={`inline-flex rounded-sm px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[o.status]}`}
                      >
                        {o.status}
                      </span>
                      {o.tracking ? (
                        <span className="text-[11px] text-muted">
                          {o.tracking}
                        </span>
                      ) : null}
                      {o.status !== "cancelled" && o.status !== "delivered" ? (
                        <button
                          type="button"
                          className="text-[11px] uppercase tracking-wider text-muted hover:text-red-300"
                          onClick={() => handleCancelOrder(o.id)}
                        >
                          Cancel · restock
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={`-mx-1 hidden px-1 md:block ${tableWrapClass}`}>
            <table className="w-full min-w-140 text-left text-sm lg:min-w-160">
              <thead>
                <tr className={tableHeadRowClass}>
                  <SortableTh
                    label="Order"
                    column="order"
                    sortKey={orderSortKey}
                    sortDir={orderSortDir}
                    onSort={toggleOrderSort}
                  />
                  <SortableTh
                    label="Date"
                    column="date"
                    sortKey={orderSortKey}
                    sortDir={orderSortDir}
                    onSort={toggleOrderSort}
                  />
                  {showAllLocations ? (
                    <SortableTh
                      label="Branch"
                      column="branch"
                      sortKey={orderSortKey}
                      sortDir={orderSortDir}
                      onSort={toggleOrderSort}
                    />
                  ) : null}
                  <SortableTh
                    label="Fulfillment"
                    column="fulfillment"
                    sortKey={orderSortKey}
                    sortDir={orderSortDir}
                    onSort={toggleOrderSort}
                  />
                  <SortableTh
                    label="Status"
                    column="status"
                    sortKey={orderSortKey}
                    sortDir={orderSortDir}
                    onSort={toggleOrderSort}
                  />
                  <SortableTh
                    label="Total"
                    column="total"
                    sortKey={orderSortKey}
                    sortDir={orderSortDir}
                    onSort={toggleOrderSort}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody>
                {sortedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showAllLocations ? 6 : 5}
                      className="py-8 text-center text-muted"
                    >
                      No orders for this location
                      {selection ? " and chart filter" : ""}.
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((o) => {
                    const loc = getLocationById(o.locationId);
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3.5">
                          <p className="text-cream">{o.id}</p>
                          {o.tracking ? (
                            <p className="mt-0.5 text-xs text-muted">
                              {o.tracking}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted">
                          {o.date}
                        </td>
                        {showAllLocations ? (
                          <td className="px-4 py-3.5 text-cream">
                            {loc?.shortName ?? o.locationId}
                          </td>
                        ) : null}
                        <td className="px-4 py-3.5 capitalize text-muted">
                          {o.fulfillment}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-sm px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[o.status]}`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-gold">
                          <div className="flex flex-col items-end gap-1">
                            {formatPrice(o.total)}
                            {o.status !== "cancelled" && o.status !== "delivered" ? (
                              <button
                                type="button"
                                className="text-[10px] uppercase tracking-wider text-muted hover:text-red-300"
                                onClick={() => handleCancelOrder(o.id)}
                              >
                                Cancel · restock
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
          </>
        )}
      </div>
    </div>
  );
}
