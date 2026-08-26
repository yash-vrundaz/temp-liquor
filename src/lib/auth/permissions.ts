import type { UserRole } from "@/types";
import { customRolePermissions } from "@/lib/auth/role-catalog";
import { isBuiltInRole } from "@/lib/auth/role-catalog";

export const PERMISSIONS = [
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type PermissionKind = "read" | "action";

export type AccessSubject = {
  role: string;
  permissionGrants?: readonly string[];
  permissionRevokes?: readonly string[];
};

export type AccessInput = string | AccessSubject;

export const PERMISSION_META: Record<
  Permission,
  { label: string; group: string; description: string; kind: PermissionKind }
> = {
  "dashboard.access": {
    group: "Dashboard",
    kind: "read",
    label: "Open dashboard",
    description: "Sign in to the staff command center",
  },
  "dashboard.overview": {
    group: "Dashboard",
    kind: "action",
    label: "View analytics",
    description: "See sales, orders, and branch performance",
  },
  "inventory.view": {
    group: "Inventory",
    kind: "read",
    label: "View inventory",
    description: "See on-hand counts by store",
  },
  "inventory.adjust": {
    group: "Inventory",
    kind: "action",
    label: "Adjust stock",
    description: "Change bottle counts one SKU at a time",
  },
  "inventory.restock": {
    group: "Inventory",
    kind: "action",
    label: "Restock",
    description: "Bulk restock low and out-of-stock bottles",
  },
  "inventory.reset": {
    group: "Inventory",
    kind: "action",
    label: "Reset store",
    description: "Reset a store back to catalog seed counts",
  },
  "catalog.create": {
    group: "Catalog",
    kind: "action",
    label: "Add bottles",
    description: "Create new products in the shop catalog",
  },
  "catalog.edit": {
    group: "Catalog",
    kind: "action",
    label: "Edit bottles",
    description: "Update photos, price, description, and other catalog fields",
  },
  "catalog.delete": {
    group: "Catalog",
    kind: "action",
    label: "Remove bottles",
    description: "Delete owner-added custom bottles",
  },
  "activity.view": {
    group: "Activity",
    kind: "read",
    label: "View activity",
    description: "Read the audit log of account and stock changes",
  },
  "users.view": {
    group: "Users",
    kind: "read",
    label: "View users",
    description: "See accounts, roles, and status",
  },
  "users.create": {
    group: "Users",
    kind: "action",
    label: "Create users",
    description: "Add staff, admin, and customer accounts",
  },
  "users.edit": {
    group: "Users",
    kind: "action",
    label: "Edit profiles",
    description: "Update name, email, password, and photo",
  },
  "users.assign_roles": {
    group: "Users",
    kind: "action",
    label: "Assign roles",
    description: "Change which permission set an account uses",
  },
  "users.deactivate": {
    group: "Users",
    kind: "action",
    label: "Deactivate users",
    description: "Turn access on or off for an account",
  },
  "users.reset_password": {
    group: "Users",
    kind: "action",
    label: "Reset password",
    description: "Set a new sign-in password for another account",
  },
  "locations.view": {
    group: "Locations",
    kind: "read",
    label: "View locations",
    description: "See store addresses and manage the locations list",
  },
  "locations.create": {
    group: "Locations",
    kind: "action",
    label: "Add locations",
    description: "Create a new store in the network",
  },
  "locations.edit": {
    group: "Locations",
    kind: "action",
    label: "Edit locations",
    description: "Update store details, hours, and contact info",
  },
  "locations.delete": {
    group: "Locations",
    kind: "action",
    label: "Remove locations",
    description: "Delete a store that has no order history",
  },
  "events.view": {
    group: "Events",
    kind: "read",
    label: "View events",
    description: "See tastings, launches, and festivals",
  },
  "events.create": {
    group: "Events",
    kind: "action",
    label: "Add events",
    description: "Create a tasting or in-store event",
  },
  "events.edit": {
    group: "Events",
    kind: "action",
    label: "Edit events",
    description: "Update event details, seats, and schedule",
  },
  "events.delete": {
    group: "Events",
    kind: "action",
    label: "Remove events",
    description: "Cancel and delete an event listing",
  },
  "deliveries.view": {
    group: "Deliveries",
    kind: "read",
    label: "View deliveries",
    description: "See open deliveries, assigned drivers, and status",
  },
  "deliveries.manage": {
    group: "Deliveries",
    kind: "action",
    label: "Manage deliveries",
    description: "Assign drivers, update delivery status, and manage the driver roster",
  },
};

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  customer: [],
  staff: [
    "dashboard.access",
    "dashboard.overview",
    "inventory.view",
    "inventory.adjust",
    "inventory.restock",
    "activity.view",
    "locations.view",
    "events.view",
    "deliveries.view",
    "deliveries.manage",
  ],
  admin: [
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
  ],
  owner: PERMISSIONS,
};

export const PERMISSION_GROUPS = [
  "Dashboard",
  "Inventory",
  "Catalog",
  "Locations",
  "Events",
  "Deliveries",
  "Activity",
  "Users",
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export function permissionsInGroup(group: string): Permission[] {
  return PERMISSIONS.filter((permission) => PERMISSION_META[permission].group === group);
}

export function permissionGroupTree(group: string) {
  const items = permissionsInGroup(group);
  const read = items.find((permission) => PERMISSION_META[permission].kind === "read");
  const actions = items.filter((permission) => permission !== read);
  return { items, read, actions };
}

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function parsePermissions(value: unknown): Permission[] {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Permission => typeof item === "string" && isPermission(item));
}

export function asAccess(subject: AccessInput): AccessSubject {
  return typeof subject === "string" ? { role: subject } : subject;
}

export function rolePermissions(role: string): Permission[] {
  if (role === "owner") return [...PERMISSIONS];
  if (isBuiltInRole(role)) return [...ROLE_PERMISSIONS[role]];
  const custom = customRolePermissions(role);
  return custom ? [...custom] : [];
}

export function normalizeOverrides(
  role: string,
  grants: readonly string[] = [],
  revokes: readonly string[] = [],
) {
  if (role === "owner") {
    return { permissionGrants: [] as Permission[], permissionRevokes: [] as Permission[] };
  }
  const base = new Set(rolePermissions(role));
  const permissionGrants = parsePermissions(grants).filter((permission) => !base.has(permission));
  const permissionRevokes = parsePermissions(revokes).filter((permission) => base.has(permission));
  return { permissionGrants, permissionRevokes };
}

export function effectivePermissions(subject: AccessInput): Permission[] {
  const access = asAccess(subject);
  if (access.role === "owner") return [...PERMISSIONS];
  const enabled = new Set(rolePermissions(access.role));
  for (const permission of parsePermissions(access.permissionRevokes)) {
    enabled.delete(permission);
  }
  for (const permission of parsePermissions(access.permissionGrants)) {
    enabled.add(permission);
  }
  return PERMISSIONS.filter((permission) => enabled.has(permission));
}

export function hasPermission(subject: AccessInput, permission: Permission) {
  return effectivePermissions(subject).includes(permission);
}

export function hasAnyPermission(subject: AccessInput, permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(subject, permission));
}

export function permissionsFor(subject: AccessInput): Permission[] {
  return effectivePermissions(subject);
}

export function hasCustomPermissions(subject: AccessInput) {
  const access = asAccess(subject);
  const { permissionGrants, permissionRevokes } = normalizeOverrides(
    access.role,
    access.permissionGrants,
    access.permissionRevokes,
  );
  return permissionGrants.length > 0 || permissionRevokes.length > 0;
}

export function overridesFromEnabled(role: string, enabled: readonly Permission[]) {
  if (role === "owner") {
    return { permissionGrants: [] as Permission[], permissionRevokes: [] as Permission[] };
  }
  const base = new Set(rolePermissions(role));
  const on = new Set(enabled);
  return {
    permissionGrants: PERMISSIONS.filter((permission) => on.has(permission) && !base.has(permission)),
    permissionRevokes: PERMISSIONS.filter((permission) => base.has(permission) && !on.has(permission)),
  };
}

export function permissionSource(
  subject: AccessInput,
  permission: Permission,
): "role" | "added" | "removed" | "none" {
  const access = asAccess(subject);
  const inRole = rolePermissions(access.role).includes(permission) || access.role === "owner";
  const granted = parsePermissions(access.permissionGrants).includes(permission);
  const revoked = parsePermissions(access.permissionRevokes).includes(permission);
  if (inRole && revoked) return "removed";
  if (!inRole && granted) return "added";
  if (inRole) return "role";
  return "none";
}
