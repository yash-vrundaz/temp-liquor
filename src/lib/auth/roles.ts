import type { UserRole } from "@/types";
import { hasPermission, type AccessInput } from "@/lib/auth/permissions";

export const USER_ROLES: UserRole[] = ["customer", "staff", "admin", "owner"];

export const ROLE_RANK: Record<UserRole, number> = {
  customer: 0,
  staff: 1,
  admin: 2,
  owner: 3,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  staff: "Staff",
  admin: "Admin",
  owner: "Owner",
};

export const ROLE_BLURBS: Record<UserRole, string> = {
  customer: "Shop, checkout, and manage a personal account.",
  staff: "Count stock, restock shelves, and view store activity.",
  admin: "Run catalog, inventory, users, and store operations.",
  owner: "Full access, including owner accounts and store reset.",
};

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function isStaffRole(subject: AccessInput) {
  return hasPermission(subject, "dashboard.access");
}

export function canManageUsers(subject: AccessInput) {
  return hasPermission(subject, "users.view");
}

export function canAssignRole(actor: AccessInput, target: UserRole) {
  if (!hasPermission(actor, "users.assign_roles")) return false;
  const actorRole = typeof actor === "string" ? actor : actor.role;
  if (actorRole === "owner") return true;
  if (actorRole === "admin") return target !== "owner";
  return ROLE_RANK[actorRole] > ROLE_RANK[target];
}

export function canEditUser(actor: AccessInput, target: UserRole) {
  if (!hasPermission(actor, "users.edit")) return false;
  const actorRole = typeof actor === "string" ? actor : actor.role;
  if (actorRole === "owner") return true;
  if (actorRole === "admin") return target !== "owner";
  return ROLE_RANK[actorRole] > ROLE_RANK[target];
}

export function canDeactivateUser(actor: AccessInput, target: UserRole) {
  if (!hasPermission(actor, "users.deactivate")) return false;
  return canEditUser(actor, target);
}

export function canResetPassword(actor: AccessInput, target: UserRole) {
  const actorRole = typeof actor === "string" ? actor : actor.role;
  if (actorRole === "owner") return true;
  if (!hasPermission(actor, "users.reset_password")) return false;
  if (actorRole === "admin") return target !== "owner";
  return ROLE_RANK[actorRole] > ROLE_RANK[target];
}

export const DEMO_PASSWORD = "Liquor123!";

export const DEMO_ACCOUNT_EMAILS = [
  "owner@samsdiscountliquor.com",
  "admin@samsdiscountliquor.com",
  "staff@samsdiscountliquor.com",
  "alex.reed@email.com",
] as const;

export function isDemoAccountEmail(email: string) {
  return (DEMO_ACCOUNT_EMAILS as readonly string[]).includes(email.trim().toLowerCase());
}

export {
  hasPermission,
  permissionsFor,
  PERMISSIONS,
  PERMISSION_META,
  ROLE_PERMISSIONS,
  effectivePermissions,
  hasCustomPermissions,
  overridesFromEnabled,
  rolePermissions,
} from "@/lib/auth/permissions";
