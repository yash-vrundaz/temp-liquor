"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
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
import { ProfilePanel } from "@/components/dashboard/ProfilePanel";
import { DeliveriesPanel } from "@/components/dashboard/DeliveriesPanel";
import { PosPanel } from "@/components/dashboard/PosPanel";
import { OrdersPanel } from "@/components/dashboard/OrdersPanel";
import {
  LocationScopeBar,
  type LocationFilter,
} from "@/components/dashboard/LocationScopeBar";
import { ChartFilterList } from "@/components/dashboard/ChartFilterList";
import { hasAnyPermission, hasPermission, type Permission } from "@/lib/auth/permissions";
import {
  dashboardPath,
  parseDashboardPath,
  type DashboardSection,
} from "@/lib/dashboard/routes";
import { accessibleLocations, canAccessLocation, hasAllLocationAccess } from "@/lib/auth/location-access";
import { roleLabel } from "@/lib/auth/roles";
import { cn, formatPrice } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
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

type DashboardTab = DashboardSection;

type TabGroup = "operations" | "manage" | "account";

const DASHBOARD_TABS: {
  id: DashboardTab;
  label: string;
  icon: typeof TrendingUp;
  permission: Permission;
  group: TabGroup;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: TrendingUp,
    permission: "dashboard.overview",
    group: "operations",
    description: "Sales, order health, and branch performance across Sam's locations.",
  },
  {
    id: "pos",
    label: "Point of sale",
    icon: Store,
    permission: "pos.access",
    group: "operations",
    description: "Ring up walk-in sales and check stock across stores.",
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingBag,
    permission: "orders.view",
    group: "operations",
    description: "Browse and manage online, pickup, and POS orders by store.",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
    permission: "inventory.view",
    group: "operations",
    description: "Manage bottle counts, categories, restock, and products per store.",
  },
  {
    id: "deliveries",
    label: "Deliveries",
    icon: Truck,
    permission: "deliveries.view",
    group: "operations",
    description: "Assign drivers and track each delivery to the door.",
  },
  {
    id: "locations",
    label: "Locations",
    icon: MapPin,
    permission: "locations.view",
    group: "manage",
    description: "Add, edit, or remove stores in the Sam's network.",
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    permission: "events.view",
    group: "manage",
    description: "Create and manage tastings, launches, and in-store events.",
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    permission: "users.view",
    group: "manage",
    description: "Create accounts, assign roles, store access, and permissions.",
  },
  {
    id: "activity",
    label: "Activity",
    icon: ClipboardList,
    permission: "activity.view",
    group: "manage",
    description: "Audit trail of stock, orders, catalog, and account changes.",
  },
  {
    id: "profile",
    label: "Profile",
    icon: UserRound,
    permission: "dashboard.access",
    group: "account",
    description: "Update your photo, name, email, and password.",
  },
];

const TAB_GROUPS: { id: TabGroup; label: string }[] = [
  { id: "operations", label: "Operations" },
  { id: "manage", label: "Manage" },
  { id: "account", label: "Account" },
];

const HEADER_TOP =
  "top-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:top-[calc(4.5rem+env(safe-area-inset-top,0px))]";
const SIDEBAR_HEIGHT =
  "h-[calc(100dvh-3.75rem-env(safe-area-inset-top,0px))] sm:h-[calc(100dvh-4.5rem-env(safe-area-inset-top,0px))]";
const SIDEBAR_EXPANDED = "w-[15.5rem] xl:w-[16.5rem]";
const SIDEBAR_COLLAPSED = "w-[4.5rem]";
const CONTENT_PAD_EXPANDED = "lg:pl-[15.5rem] xl:pl-[16.5rem]";
const CONTENT_PAD_COLLAPSED = "lg:pl-[4.5rem]";
const SIDEBAR_STORAGE_KEY = "sams-dashboard-sidebar-collapsed";

function canAccessDashboardTab(
  profile: Parameters<typeof hasPermission>[0],
  tab: (typeof DASHBOARD_TABS)[number],
) {
  if (tab.id === "inventory") {
    return (
      hasPermission(profile, "inventory.view") ||
      hasAnyPermission(profile, ["catalog.create", "catalog.edit", "catalog.delete"])
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
  panelRef,
}: {
  selection: ChartSelection;
  orders: Order[];
  onClear: () => void;
  panelRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const details = buildSelectionDetails(orders, selection);

  return (
    <motion.div
      ref={panelRef}
      layout
      tabIndex={-1}
      role="region"
      aria-label={`${details.typeLabel} detail: ${details.title}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="border border-(--gold)/35 bg-linear-to-br from-[rgba(201,169,98,0.12)] to-(--bg-elevated) p-4 outline-none focus-visible:ring-2 focus-visible:ring-(--gold)/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] sm:p-5 md:p-6"
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
          className="inline-flex min-h-10 items-center gap-1.5 border border-white/10 px-3 py-2 text-xs text-muted transition-colors hover:border-(--gold)/40 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold)/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
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

export function MemberDashboard() {
  const { profile, cancelOrder } = useUserStore();
  const restockOrder = useInventoryStore((s) => s.restockOrder);
  const branchId = useBranchStore((s) => s.branchId);
  const setBranch = useBranchStore((s) => s.setBranch);
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const [selection, setSelection] = useState<ChartSelection | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const selectionDetailsRef = useRef<HTMLDivElement | null>(null);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>(branchId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarReady, setSidebarReady] = useState(false);
  const [overviewOrderPage, setOverviewOrderPage] = useState(1);
  const [overviewOrderPageSize, setOverviewOrderPageSize] = useState(10);
  const { sortKey: orderSortKey, sortDir: orderSortDir, toggleSort: toggleOrderSort } =
    useTableSort<"order" | "date" | "branch" | "fulfillment" | "status" | "total">(
      "date",
      "desc",
      ["date"],
    );
  const router = useRouter();
  const pathname = usePathname();
  const tabs = useMemo(
    () => DASHBOARD_TABS.filter((tab) => canAccessDashboardTab(profile, tab)),
    [profile],
  );
  const route = useMemo(() => parseDashboardPath(pathname), [pathname]);
  const requestedAllowed = tabs.some((tab) => tab.id === route.section);
  const dashboardTab: DashboardTab = requestedAllowed
    ? route.section
    : (tabs[0]?.id ?? "overview");
  const openCategoriesInInventory = route.inventoryView === "categories";
  const stores = useMemo(() => accessibleLocations(profile), [profile]);
  const allowAllStores = hasAllLocationAccess(profile);

  const setDashboardTab = useCallback(
    (tab: DashboardTab, opts?: { drivers?: boolean; categories?: boolean }) => {
      const href = dashboardPath(tab, opts);
      router.push(href, { scroll: false });
      setSidebarOpen(false);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [router],
  );

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => drawerCloseRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      menuButtonRef.current?.focus();
    };
  }, [sidebarOpen]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "1") setSidebarCollapsed(true);
    } catch {
      /* ignore */
    }
    setSidebarReady(true);
  }, []);

  useEffect(() => {
    if (!sidebarReady) return;
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed, sidebarReady]);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    if (canAccessLocation(profile, branchId)) {
      setLocationFilter(branchId);
      setSelection(null);
      setHoverKey(null);
    }
  }, [branchId, profile]);

  useEffect(() => {
    if (!requestedAllowed && pathname.startsWith("/dashboard")) {
      const fallback = tabs[0]?.id ?? "overview";
      if (route.section !== fallback) {
        router.replace(dashboardPath(fallback));
      }
    }
  }, [pathname, requestedAllowed, route.section, router, tabs]);

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
  const posRegisterStoreId =
    locationFilter !== "all" && getLocationById(locationFilter)
      ? locationFilter
      : stores[0]?.id ?? "";

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

  useEffect(() => {
    setOverviewOrderPage(1);
  }, [locationFilter, selection, overviewOrderPageSize, orderSortKey, orderSortDir]);

  const overviewTotalPages = Math.max(
    1,
    Math.ceil(sortedOrders.length / overviewOrderPageSize),
  );
  const overviewSafePage = Math.min(overviewOrderPage, overviewTotalPages);
  const overviewOrderFrom =
    sortedOrders.length === 0
      ? 0
      : (overviewSafePage - 1) * overviewOrderPageSize + 1;
  const overviewOrderTo = Math.min(
    overviewSafePage * overviewOrderPageSize,
    sortedOrders.length,
  );
  const pagedOverviewOrders = sortedOrders.slice(
    (overviewSafePage - 1) * overviewOrderPageSize,
    overviewSafePage * overviewOrderPageSize,
  );
  const scopeLabel = activeLocation?.shortName ?? "All locations";

  const setLocation = (id: LocationFilter) => {
    setLocationFilter(id);
    if (id !== "all") setBranch(id);
    setSelection(null);
    setHoverKey(null);
  };

  const canManageOrders = hasPermission(profile, "orders.manage");

  const handleCancelOrder = (orderId: string) => {
    if (!canManageOrders) return;
    if (!window.confirm(`Cancel order ${orderId} and restock bottles?`)) return;
    const soldHere = useInventoryStore
      .getState()
      .ledger.some((e) => e.orderId === orderId && e.reason === "sale");
    const order = cancelOrder(orderId);
    if (order && soldHere && !isDbConnected()) {
      restockOrder(order.locationId, order.items, order.id);
    }
  };

  const toggle = (
    next: ChartSelection,
    meta?: { moveFocus?: boolean },
  ) => {
    setSelection((prev) => {
      const clearing = sameSelection(prev, next);
      if (!clearing && meta?.moveFocus) {
        requestAnimationFrame(() => {
          selectionDetailsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
          selectionDetailsRef.current?.focus({ preventScroll: true });
        });
      }
      return clearing ? null : next;
    });
  };

  const clearChartSelection = () => {
    setSelection(null);
    setHoverKey(null);
  };

  const isHovered = (key: string) => hoverKey === key;
  const isFocused = (selected: boolean, key: string) =>
    selected || isHovered(key);

  const panelFor = (type: ChartSelection["type"]) =>
    selection?.type === type;

  const chartHint = isMobile
    ? "tap chart or options to filter"
    : "Tab options · arrows · Enter to filter";

  const activeTabMeta = tabs.find((tab) => tab.id === dashboardTab) ?? tabs[0];
  const ActiveIcon = activeTabMeta?.icon ?? TrendingUp;

  const selectTab = (tab: DashboardTab) => {
    if (
      (tab === "inventory" || tab === "pos") &&
      (locationFilter === "all" || !getLocationById(locationFilter))
    ) {
      const fallback =
        (canAccessLocation(profile, branchId) ? branchId : null) ?? stores[0]?.id;
      if (fallback) setLocation(fallback);
    }
  };

  const renderNav = (opts?: { onNavigate?: () => void; collapsed?: boolean }) => {
    const collapsed = Boolean(opts?.collapsed);
    return (
      <nav className="flex min-h-0 flex-1 flex-col" aria-label="Dashboard sections">
        <div
          className={cn(
            "min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain py-4",
            collapsed ? "space-y-3 px-2" : "px-3",
          )}
        >
          {TAB_GROUPS.map((group) => {
            const items = tabs.filter(
              (tab) => tab.group === group.id && tab.id !== "profile",
            );
            if (!items.length) return null;
            return (
              <div key={group.id}>
                {collapsed ? (
                  <div
                    className="mx-auto mb-2 h-px w-6 bg-white/10"
                    aria-hidden
                  />
                ) : (
                  <p className="mb-1.5 px-2.5 text-[10px] uppercase tracking-[0.2em] text-gold/80">
                    {group.label}
                  </p>
                )}
                <ul className={cn("space-y-0.5", collapsed && "space-y-1")}>
                  {items.map((tab) => {
                    const active = dashboardTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <li key={tab.id}>
                        <Link
                          href={dashboardPath(tab.id)}
                          title={collapsed ? tab.label : undefined}
                          aria-label={tab.label}
                          onClick={() => {
                            selectTab(tab.id);
                            opts?.onNavigate?.();
                          }}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group relative flex min-h-11 cursor-pointer items-center rounded-sm text-left touch-manipulation transition",
                            collapsed
                              ? "w-full justify-center px-0 py-2"
                              : "w-full gap-3 px-2.5 py-2",
                            active
                              ? collapsed
                                ? "bg-(--gold)/12 text-cream"
                                : "bg-(--gold)/12 text-cream shadow-[inset_3px_0_0_0_var(--gold)]"
                              : "text-muted hover:bg-white/[0.04] hover:text-cream",
                          )}
                        >
                          {collapsed && active ? (
                            <span
                              className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-(--gold)"
                              aria-hidden
                            />
                          ) : null}
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border transition",
                              active
                                ? "border-(--gold)/40 bg-(--gold)/15 text-gold"
                                : "border-white/10 bg-white/[0.03] text-muted group-hover:border-white/20 group-hover:text-cream",
                            )}
                          >
                            <Icon size={15} />
                          </span>
                          {!collapsed ? (
                            <span className="min-w-0">
                              <span className="block truncate text-sm tracking-wide">
                                {tab.label}
                              </span>
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className={cn("shrink-0 border-t border-white/10", collapsed ? "p-2" : "p-3")}>
          <Link
            href={dashboardPath("profile")}
            title={collapsed ? "Profile" : undefined}
            aria-label="Profile"
            aria-current={dashboardTab === "profile" ? "page" : undefined}
            onClick={() => {
              opts?.onNavigate?.();
            }}
            className={cn(
              "flex cursor-pointer items-center rounded-sm border touch-manipulation transition",
              collapsed
                ? "mx-auto min-h-11 w-11 justify-center p-0"
                : "w-full min-h-12 gap-3 px-2.5 py-2 text-left",
              dashboardTab === "profile"
                ? "border-(--gold)/40 bg-(--gold)/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20",
            )}
          >
            <UserAvatar name={profile.name} src={profile.avatarUrl} size={collapsed ? 32 : 36} />
            {!collapsed ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-cream">{profile.name}</span>
                <span className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.14em] text-muted">
                  {roleLabel(profile.role)}
                </span>
              </span>
            ) : null}
          </Link>
        </div>
      </nav>
    );
  };

  const pageTitle =
    dashboardTab === "overview"
      ? `${firstName}'s command center`
      : activeTabMeta?.label ?? "Dashboard";
  const pageDescription =
    dashboardTab === "overview" && isMobile
      ? "Pick a location, then tap charts for store details."
      : activeTabMeta?.description ?? "";

  return (
    <div className="relative min-h-[calc(100dvh-3.75rem-env(safe-area-inset-top,0px))] sm:min-h-[calc(100dvh-4.5rem-env(safe-area-inset-top,0px))]">
      <div className="pointer-events-none absolute inset-0 ambient-bg opacity-70" />
      <div className="pointer-events-none absolute inset-0 luxury-grid opacity-35" />

      {/* Desktop / large tablet sidebar */}
      <aside
        className={cn(
          "fixed bottom-0 z-30 hidden border-r border-white/10 bg-[#090909]/95 backdrop-blur-xl lg:flex lg:flex-col",
          HEADER_TOP,
          SIDEBAR_HEIGHT,
          sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
          sidebarReady && "transition-[width] duration-150 ease-out",
        )}
      >
        <div
          className={cn(
            "shrink-0 border-b border-white/10",
            sidebarCollapsed ? "px-2 py-3" : "px-4 py-4 xl:px-5",
          )}
        >
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-sm border border-white/10 text-muted transition hover:border-(--gold)/40 hover:text-gold"
              >
                <PanelLeftOpen size={16} />
              </button>
              <Store size={16} className="text-gold/80" aria-hidden />
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
                  {roleLabel(profile.role)}
                </p>
                <p className="mt-1 font-display text-xl leading-tight text-cream xl:text-2xl">
                  Command center
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="mt-0.5 flex min-h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/10 text-muted transition hover:border-(--gold)/40 hover:text-gold"
              >
                <PanelLeftClose size={15} />
              </button>
            </div>
          )}
        </div>
        {renderNav({ collapsed: sidebarCollapsed })}
      </aside>

      {/* Mobile / tablet top bar */}
      <div
        className={cn(
          "sticky z-30 border-b border-white/10 bg-[#090909]/92 backdrop-blur-xl lg:hidden",
          HEADER_TOP,
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 sm:px-5">
          <button
            type="button"
            ref={menuButtonRef}
            aria-label="Open dashboard menu"
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-mobile-menu"
            onClick={() => setSidebarOpen(true)}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-sm border border-white/10 text-cream touch-manipulation hover:border-white/20"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-gold">
              {roleLabel(profile.role)} · {activeTabMeta?.label}
            </p>
            <p className="truncate font-display text-lg leading-tight text-cream sm:text-xl">
              {pageTitle}
            </p>
          </div>
          <UserAvatar name={profile.name} src={profile.avatarUrl} size={36} />
        </div>
      </div>

      {/* Mobile drawer — always expanded labels */}
      <AnimatePresence>
        {sidebarOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              ref={drawerRef}
              id="dashboard-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className={cn(
                "fixed bottom-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-white/10 bg-[#0a0a0a] shadow-[20px_0_60px_rgba(0,0,0,0.55)] lg:hidden",
                HEADER_TOP,
                SIDEBAR_HEIGHT,
              )}
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                    {roleLabel(profile.role)}
                  </p>
                  <p className="mt-1 font-display text-xl text-cream">Menu</p>
                </div>
                <button
                  type="button"
                  ref={drawerCloseRef}
                  aria-label="Close dashboard menu"
                  onClick={() => setSidebarOpen(false)}
                  className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-sm border border-white/10 text-muted touch-manipulation hover:text-cream"
                >
                  <X size={18} />
                </button>
              </div>
              {renderNav({ onNavigate: () => setSidebarOpen(false), collapsed: false })}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* Main content */}
      <div
        className={cn(
          "relative pl-0",
          sidebarCollapsed ? CONTENT_PAD_COLLAPSED : CONTENT_PAD_EXPANDED,
          sidebarReady && "transition-[padding] duration-150 ease-out",
        )}
      >
        <div
          className={cn(
            "w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12",
            dashboardTab === "pos" ? "py-4 md:py-5 lg:py-6" : "py-5 sm:py-6 md:py-8",
          )}
        >
          {/* Desktop page header — panels with action headers skip this */}
          {!["users", "inventory", "locations", "events", "activity", "profile", "orders"].includes(
            dashboardTab,
          ) ? (
            <header
              className={cn(
                "mb-5 hidden border-b border-white/10 pb-5 lg:block",
                dashboardTab === "pos" && "mb-4 pb-4",
              )}
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold">
                    <ActiveIcon size={12} className="text-gold" />
                    {roleLabel(profile.role)} · {activeTabMeta?.label}
                  </p>
                  <h1 className="mt-2 wrap-break-word font-display text-3xl text-cream xl:text-4xl">
                    {pageTitle}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm text-muted">{pageDescription}</p>
                </div>

                {dashboardTab === "pos" && stores.length > 0 ? (
                  <div className="flex shrink-0 flex-col items-stretch gap-1.5 border-l border-white/10 pl-5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
                      Selling from
                    </p>
                    <label className="relative block w-[11.5rem]">
                      <span className="sr-only">Change store</span>
                      <select
                        id="pos-header-store"
                        value={posRegisterStoreId}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full appearance-none rounded-sm border border-white/15 bg-(--bg-elevated) py-2 pl-3 pr-9 text-sm text-cream scheme-dark outline-none focus:border-(--gold)/45 [&_option]:bg-(--bg-elevated)"
                      >
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.shortName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    </label>
                  </div>
                ) : null}
              </div>
            </header>
          ) : null}

          {/* Mobile description (title lives in sticky bar) */}
          {dashboardTab !== "pos" &&
          !["users", "inventory", "locations", "events", "activity", "profile", "orders"].includes(
            dashboardTab,
          ) &&
          pageDescription ? (
            <p className="mb-4 text-sm text-muted lg:hidden">{pageDescription}</p>
          ) : null}

          {dashboardTab === "pos" ? (
          <PosPanel
            locationId={
              locationFilter !== "all" && getLocationById(locationFilter)
                ? locationFilter
                : stores[0]?.id ?? branchId
            }
            onLocationChange={setLocation}
          />
        ) : dashboardTab === "orders" ? (
          <OrdersPanel
            locationId={locationFilter}
            onLocationChange={setLocation}
            locations={stores}
          />
        ) : dashboardTab === "inventory" ? (
          <InventoryPanel
            locationId={locationFilter}
            onLocationChange={setLocation}
            locations={stores}
            initialView={openCategoriesInInventory ? "categories" : "stock"}
          />
        ) : dashboardTab === "locations" ? (
          <LocationsPanel />
        ) : dashboardTab === "events" ? (
          <EventsPanel />
        ) : dashboardTab === "deliveries" ? (
          <DeliveriesPanel />
        ) : dashboardTab === "activity" ? (
          <ActivityLogsPanel />
        ) : dashboardTab === "users" ? (
          <UsersPanel />
        ) : dashboardTab === "profile" ? (
          <ProfilePanel />
        ) : (
          <>
        <div className="mt-6">
          <LocationScopeBar
            value={locationFilter}
            onChange={setLocation}
            counts={locationCounts}
            locations={stores}
            allowAll={allowAllStores}
            label="Analytics scope"
            countNoun="orders"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
                onClear={clearChartSelection}
                panelRef={selectionDetailsRef}
              />
            </div>
          ) : null}
        </AnimatePresence>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {selection
            ? `Chart filter active: ${selection.label}. Orders table updated.`
            : "Chart filter cleared."}
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-5 xl:gap-5">
          <Panel
            className="lg:col-span-3"
            title="Spending over time"
            subtitle={`${scopeLabel} · ${chartHint}`}
            highlighted={panelFor("month")}
          >
            <div
              className="h-52 w-full min-w-0 overflow-hidden cursor-pointer sm:h-64 md:h-72 xl:h-80"
              aria-hidden="true"
            >
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
                      const hovered = isHovered(`month:${payload.key}`);
                      const active =
                        (selection?.type === "month" &&
                          selection.key === payload.key) ||
                        hovered;
                      if (cx == null || cy == null) return null;
                      if (active) {
                        return <PointCallout {...props} />;
                      }
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={3.5}
                          fill={CHART_COLORS.gold}
                          stroke="transparent"
                          strokeWidth={0}
                          style={{ cursor: "pointer" }}
                        />
                      );
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
            <ChartFilterList
              label="Spending by month"
              layout="wrap"
              chartFocus={chartFocus}
              hoverKey={hoverKey}
              onHover={setHoverKey}
              onToggle={toggle}
              onClearSelection={clearChartSelection}
              isSelected={(opt) =>
                selection?.type === "month" && selection.key === opt.selection.key
              }
              options={monthly.map((m) => ({
                id: `month:${m.key}`,
                label: m.label,
                valueLabel: formatPrice(m.spend),
                color: CHART_COLORS.gold,
                selection: {
                  type: "month",
                  key: m.key,
                  label: m.label,
                },
              }))}
            />
          </Panel>

          <Panel
            className="lg:col-span-2"
            title="By category"
            subtitle={`${scopeLabel} · ${chartHint}`}
            highlighted={panelFor("category")}
          >
            <div
              className="h-52 w-full min-w-0 overflow-hidden sm:h-64 md:h-72 xl:h-80"
              aria-hidden="true"
            >
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
            <ChartFilterList
              label="Spend by category"
              layout="grid"
              chartFocus={chartFocus}
              hoverKey={hoverKey}
              onHover={setHoverKey}
              onToggle={toggle}
              onClearSelection={clearChartSelection}
              isSelected={(opt) =>
                selection?.type === "category" &&
                selection.key === opt.selection.key
              }
              options={categories.map((c) => ({
                id: `category:${c.name}`,
                label: c.name,
                valueLabel: formatPrice(c.value),
                color: c.fill,
                selection: {
                  type: "category",
                  key: c.name,
                  label: c.name,
                },
              }))}
            />
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:gap-5 2xl:grid-cols-2">
          <Panel
            title="Top bottles"
            subtitle={`${scopeLabel} · ${chartHint}`}
            highlighted={panelFor("product")}
          >
            <div
              className="h-52 w-full min-w-0 overflow-hidden cursor-pointer sm:h-56 md:h-64 xl:h-72"
              aria-hidden="true"
            >
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
            <ChartFilterList
              label="Top bottles by spend"
              layout="stack"
              chartFocus={chartFocus}
              hoverKey={hoverKey}
              onHover={setHoverKey}
              onToggle={toggle}
              onClearSelection={clearChartSelection}
              isSelected={(opt) =>
                selection?.type === "product" &&
                selection.key === opt.selection.key
              }
              options={topProducts.map((row, i) => ({
                id: `product:${row.key}`,
                label: row.name,
                valueLabel: formatPrice(row.spend),
                color: CHART_COLORS.series[i % CHART_COLORS.series.length],
                selection: {
                  type: "product",
                  key: row.key,
                  label: row.name,
                },
              }))}
            />
          </Panel>

          <Panel
            title={showAllLocations ? "Branch mix" : "This location"}
            subtitle={
              showAllLocations
                ? `Spend across all Sam's branches · ${chartHint}`
                : "Scoped to the selected store"
            }
            highlighted={panelFor("branch")}
          >
            {showAllLocations ? (
            <>
            <div
              className="h-52 w-full min-w-0 overflow-hidden cursor-pointer sm:h-56 md:h-64 xl:h-72"
              aria-hidden="true"
            >
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
            <ChartFilterList
              label="Spend by branch"
              layout="wrap"
              chartFocus={chartFocus}
              hoverKey={hoverKey}
              onHover={setHoverKey}
              onToggle={toggle}
              onClearSelection={clearChartSelection}
              isSelected={(opt) =>
                selection?.type === "branch" &&
                selection.key === opt.selection.key
              }
              options={branches.map((b) => ({
                id: `branch:${b.key}`,
                label: b.name,
                valueLabel: formatPrice(b.spend),
                color: b.fill,
                selection: {
                  type: "branch",
                  key: b.key,
                  label: b.name,
                },
              }))}
            />
            </>
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
                  Switch to <button type="button" className="text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold)/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]" onClick={() => setLocation("all")}>All locations</button> to compare Downtown, Waterfront, and Uptown side by side.
                </p>
              </div>
            )}
          </Panel>
        </div>

        <Panel
          className="mt-4"
          title="Order health"
          subtitle={`${scopeLabel} · status & fulfillment · ${chartHint}`}
          highlighted={panelFor("status") || panelFor("fulfillment")}
        >
          {statuses.length === 0 && fulfillment.every((f) => f.value === 0) ? (
            <EmptyChart message="No order activity for this location." />
          ) : (
          <>
          <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
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
          <ChartFilterList
            label="Filter by order status"
            layout="wrap"
            chartFocus={chartFocus}
            hoverKey={hoverKey}
            onHover={setHoverKey}
            onToggle={toggle}
            onClearSelection={clearChartSelection}
            isSelected={(opt) =>
              selection?.type === "status" && selection.key === opt.selection.key
            }
            options={statuses.map((s) => ({
              id: `status:${s.key}`,
              label: `${s.name} (${s.value})`,
              color: s.fill,
              selection: {
                type: "status",
                key: s.key,
                label: s.name,
              },
            }))}
          />
          <ChartFilterList
            label="Filter by fulfillment"
            layout="wrap"
            chartFocus={chartFocus}
            hoverKey={hoverKey}
            onHover={setHoverKey}
            onToggle={toggle}
            onClearSelection={clearChartSelection}
            isSelected={(opt) =>
              selection?.type === "fulfillment" &&
              selection.key === opt.selection.key
            }
            options={fulfillment.map((f) => ({
              id: `fulfillment:${f.key}`,
              label: `${f.name} (${f.value})`,
              color: f.fill,
              selection: {
                type: "fulfillment",
                key: f.key,
                label: f.name,
              },
            }))}
          />
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
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">
                {visibleOrders.length === 0
                  ? "0 shown"
                  : `${overviewOrderFrom}–${overviewOrderTo} of ${visibleOrders.length}`}
              </span>
              {visibleOrders.length > 0 ? (
                <PageSizeSelect
                  value={overviewOrderPageSize}
                  onChange={setOverviewOrderPageSize}
                  options={[5, 10, 20]}
                />
              ) : null}
            </div>
          }
        >
          <MobileSortBar
            className="mb-3 lg:hidden"
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
          <div className="space-y-2 lg:hidden">
            {pagedOverviewOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                No orders for this location
                {selection ? " and chart filter" : ""}.
              </p>
            ) : (
              pagedOverviewOrders.map((o) => {
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
                      {canManageOrders &&
                      o.status !== "cancelled" &&
                      o.status !== "delivered" ? (
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center text-[11px] uppercase tracking-wider text-muted hover:text-red-300"
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

          <div className={`-mx-1 hidden px-1 lg:block ${tableWrapClass}`}>
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
                {pagedOverviewOrders.length === 0 ? (
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
                  pagedOverviewOrders.map((o) => {
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
                            {canManageOrders &&
                            o.status !== "cancelled" &&
                            o.status !== "delivered" ? (
                              <button
                                type="button"
                                className="inline-flex min-h-9 items-center text-[10px] uppercase tracking-wider text-muted hover:text-red-300"
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
          <Pagination
            page={overviewSafePage}
            totalPages={overviewTotalPages}
            onChange={setOverviewOrderPage}
            className="mt-6"
          />
        </Panel>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
