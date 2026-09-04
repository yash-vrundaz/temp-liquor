import type { Permission } from "@/lib/auth/permissions";

export type DashboardSection =
  | "overview"
  | "pos"
  | "orders"
  | "inventory"
  | "locations"
  | "events"
  | "activity"
  | "users"
  | "deliveries"
  | "profile";

export const DASHBOARD_SECTION_PATHS: Record<DashboardSection, string> = {
  overview: "/dashboard",
  pos: "/dashboard/pos",
  orders: "/dashboard/orders",
  inventory: "/dashboard/inventory",
  locations: "/dashboard/locations",
  events: "/dashboard/events",
  activity: "/dashboard/activity",
  users: "/dashboard/users",
  deliveries: "/dashboard/deliveries",
  profile: "/dashboard/profile",
};

const SECTION_BY_SEGMENT: Record<string, DashboardSection> = {
  pos: "pos",
  orders: "orders",
  inventory: "inventory",
  locations: "locations",
  events: "events",
  activity: "activity",
  users: "users",
  deliveries: "deliveries",
  profile: "profile",
};

export const DASHBOARD_SECTION_META: {
  id: DashboardSection;
  label: string;
  permission: Permission;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    permission: "dashboard.overview",
    description: "Sales, order health, and branch performance across Sam's locations.",
  },
  {
    id: "pos",
    label: "Point of sale",
    permission: "pos.access",
    description: "Ring up walk-in sales and check stock across stores.",
  },
  {
    id: "orders",
    label: "Orders",
    permission: "orders.view",
    description: "Browse and manage online, pickup, and POS orders by store.",
  },
  {
    id: "inventory",
    label: "Inventory",
    permission: "inventory.view",
    description: "Manage bottle counts, categories, restock, and products per store.",
  },
  {
    id: "deliveries",
    label: "Deliveries",
    permission: "deliveries.view",
    description: "Assign drivers and track each delivery to the door.",
  },
  {
    id: "locations",
    label: "Locations",
    permission: "locations.view",
    description: "Add, edit, or remove stores in the Sam's network.",
  },
  {
    id: "events",
    label: "Events",
    permission: "events.view",
    description: "Create and manage tastings, launches, and in-store events.",
  },
  {
    id: "users",
    label: "Users",
    permission: "users.view",
    description: "Create accounts, assign roles, store access, and permissions.",
  },
  {
    id: "activity",
    label: "Activity",
    permission: "activity.view",
    description: "Audit trail of stock, orders, catalog, and account changes.",
  },
  {
    id: "profile",
    label: "Profile",
    permission: "dashboard.access",
    description: "Update your photo, name, email, and password.",
  },
];

export function isDashboardSection(value: string | null | undefined): value is DashboardSection {
  return Boolean(value && value in DASHBOARD_SECTION_PATHS);
}

export function dashboardPath(
  section: DashboardSection,
  opts?: { orderId?: string; drivers?: boolean; categories?: boolean },
): string {
  if (section === "orders" && opts?.orderId) {
    return `/dashboard/orders/${encodeURIComponent(opts.orderId)}`;
  }
  if (section === "deliveries" && opts?.drivers) {
    return "/dashboard/deliveries/drivers";
  }
  if (section === "inventory" && opts?.categories) {
    return "/dashboard/inventory/categories";
  }
  return DASHBOARD_SECTION_PATHS[section];
}

export type ParsedDashboardRoute = {
  section: DashboardSection;
  orderId: string | null;
  deliveriesSection: "deliveries" | "drivers";
  inventoryView: "stock" | "categories";
};

export function parseDashboardPath(pathname: string): ParsedDashboardRoute {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  // ["dashboard"] | ["dashboard", "pos"] | ["dashboard", "orders", "id"]
  const segment = parts[1];
  const rest = parts.slice(2);

  if (!segment) {
    return {
      section: "overview",
      orderId: null,
      deliveriesSection: "deliveries",
      inventoryView: "stock",
    };
  }

  if (segment === "orders") {
    return {
      section: "orders",
      orderId: rest[0] ? decodeURIComponent(rest[0]) : null,
      deliveriesSection: "deliveries",
      inventoryView: "stock",
    };
  }

  if (segment === "deliveries") {
    return {
      section: "deliveries",
      orderId: null,
      deliveriesSection: rest[0] === "drivers" ? "drivers" : "deliveries",
      inventoryView: "stock",
    };
  }

  if (segment === "inventory") {
    return {
      section: "inventory",
      orderId: null,
      deliveriesSection: "deliveries",
      inventoryView: rest[0] === "categories" ? "categories" : "stock",
    };
  }

  const section = SECTION_BY_SEGMENT[segment];
  if (section) {
    return {
      section,
      orderId: null,
      deliveriesSection: "deliveries",
      inventoryView: "stock",
    };
  }

  return {
    section: "overview",
    orderId: null,
    deliveriesSection: "deliveries",
    inventoryView: "stock",
  };
}

/** Map legacy `?tab=` values to dedicated paths. */
export function legacyTabToPath(
  tab: string | null,
  searchParams?: URLSearchParams,
): string | null {
  if (!tab) return null;
  if (tab === "drivers") return dashboardPath("deliveries", { drivers: true });
  if (tab === "categories") return dashboardPath("inventory", { categories: true });
  if (!isDashboardSection(tab)) return "/dashboard";

  if (tab === "orders") {
    const orderId = searchParams?.get("order");
    return dashboardPath("orders", orderId ? { orderId } : undefined);
  }
  if (tab === "deliveries" && searchParams?.get("section") === "drivers") {
    return dashboardPath("deliveries", { drivers: true });
  }
  return dashboardPath(tab);
}
