import type { Permission } from "@/lib/auth/permissions";
import { parsePermissions } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";

const BUILT_IN_ROLES: UserRole[] = ["customer", "staff", "admin", "owner"];

export function isBuiltInRole(value: string): value is UserRole {
  return BUILT_IN_ROLES.includes(value as UserRole);
}

export type CustomRoleDefinition = {
  id: string;
  slug: string;
  label: string;
  description: string;
  permissions: Permission[];
  rank: number;
  createdAt: string;
  updatedAt: string;
};

const RESERVED_SLUGS = new Set<string>(BUILT_IN_ROLES);

let customRoles = new Map<string, CustomRoleDefinition>();

export function setCustomRoleCatalog(roles: CustomRoleDefinition[]) {
  customRoles = new Map(roles.map((role) => [role.slug, role]));
}

export function getCustomRoleCatalog(): CustomRoleDefinition[] {
  return [...customRoles.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function getCustomRole(slug: string): CustomRoleDefinition | undefined {
  return customRoles.get(slug);
}

export function isCustomRole(slug: string) {
  return customRoles.has(slug);
}

export function isKnownRole(slug: string) {
  return isBuiltInRole(slug) || isCustomRole(slug);
}

export function isReservedRoleSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

export function slugifyRoleLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function customRolePermissions(slug: string): Permission[] | null {
  const role = customRoles.get(slug);
  return role ? [...role.permissions] : null;
}

export function customRoleRank(slug: string): number | null {
  return customRoles.get(slug)?.rank ?? null;
}

export function customRoleLabel(slug: string): string | null {
  return customRoles.get(slug)?.label ?? null;
}

export function roleRankFor(slug: string): number {
  if (isBuiltInRole(slug)) {
    const ranks: Record<UserRole, number> = {
      customer: 0,
      staff: 1,
      admin: 2,
      owner: 3,
    };
    return ranks[slug];
  }
  return customRoles.get(slug)?.rank ?? 0;
}

export function parseCustomRoleRow(row: {
  id: string;
  slug: string;
  label: string;
  description: string;
  permissions: unknown;
  rank: number;
  created_at: Date | string;
  updated_at: Date | string;
}): CustomRoleDefinition {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description,
    permissions: parsePermissions(row.permissions),
    rank: Number(row.rank),
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}
