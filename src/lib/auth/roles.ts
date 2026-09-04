import type { UserRole } from "@/types";
import { hasPermission, type AccessInput } from "@/lib/auth/permissions";
import {
  customRoleLabel,
  customRolePermissions,
  isBuiltInRole,
  isKnownRole,
  roleRankFor,
} from "@/lib/auth/role-catalog";

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
  staff: "Ring POS sales, manage orders, count stock, and run deliveries.",
  admin: "Full dashboard ops: POS, orders, catalog, inventory, users, and locations.",
  owner: "Full access, including owner accounts and store reset.",
};

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function roleLabel(role: string) {
  if (isUserRole(role)) return ROLE_LABELS[role];
  return customRoleLabel(role) ?? role;
}

export function roleBlurb(role: string) {
  if (isUserRole(role)) return ROLE_BLURBS[role];
  return customRoleLabel(role) ? "Custom role with a tailored permission set." : "";
}

export function canAssignRole(actor: AccessInput, target: string) {
  if (!hasPermission(actor, "users.assign_roles")) return false;
  if (!isKnownRole(target)) return false;
  const actorRole = typeof actor === "string" ? actor : actor.role;
  if (actorRole === "owner") return true;
  if (target === "owner") return false;
  if (isBuiltInRole(target)) {
    if (actorRole === "admin") return target !== "owner";
    if (!isBuiltInRole(actorRole)) {
      return roleRankFor(actorRole) > roleRankFor(target);
    }
    return ROLE_RANK[actorRole] > ROLE_RANK[target];
  }
  const permissions = customRolePermissions(target) ?? [];
  if (actorRole === "admin") {
    return permissions.every((permission) => hasPermission(actor, permission));
  }
  if (isBuiltInRole(actorRole)) {
    return ROLE_RANK[actorRole] > roleRankFor(target);
  }
  return roleRankFor(actorRole) > roleRankFor(target);
}

export function canEditUser(actor: AccessInput, target: string) {
  if (!hasPermission(actor, "users.edit")) return false;
  if (!isKnownRole(target)) return false;
  const actorRole = typeof actor === "string" ? actor : actor.role;
  if (actorRole === "owner") return true;
  if (target === "owner") return false;
  if (isBuiltInRole(target) && isBuiltInRole(actorRole)) {
    if (actorRole === "admin") return target !== "owner";
    return ROLE_RANK[actorRole] > ROLE_RANK[target];
  }
  if (actorRole === "admin") return target !== "owner";
  return roleRankFor(actorRole) > roleRankFor(target);
}

export function canDeactivateUser(actor: AccessInput, target: string) {
  if (!hasPermission(actor, "users.deactivate")) return false;
  return canEditUser(actor, target);
}

export function canResetPassword(actor: AccessInput, target: string) {
  const actorRole = typeof actor === "string" ? actor : actor.role;
  if (actorRole === "owner") return true;
  if (!hasPermission(actor, "users.reset_password")) return false;
  if (target === "owner") return false;
  if (isBuiltInRole(target) && isBuiltInRole(actorRole)) {
    if (actorRole === "admin") return target !== "owner";
    return ROLE_RANK[actorRole] > ROLE_RANK[target];
  }
  if (actorRole === "admin") return target !== "owner";
  return roleRankFor(actorRole) > roleRankFor(target);
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

export function isStaffRole(subject: AccessInput) {
  return hasPermission(subject, "dashboard.access");
}

export function canManageUsers(subject: AccessInput) {
  return hasPermission(subject, "users.view");
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
