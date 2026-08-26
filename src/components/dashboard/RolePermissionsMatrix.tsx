"use client";

import { useState } from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import {
  PERMISSION_GROUPS,
  PERMISSION_META,
  effectivePermissions,
  permissionGroupTree,
  permissionSource,
  rolePermissions,
  type AccessInput,
  type Permission,
} from "@/lib/auth/permissions";
import { ROLE_BLURBS, roleBlurb, roleLabel, USER_ROLES } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { tableHeadRowClass } from "@/components/ui/SortableTh";

type Props = {
  highlight?: string;
  roles?: string[];
};

export function RolePermissionsMatrix({ highlight, roles = USER_ROLES }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERMISSION_GROUPS.map((group) => [group, true])),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => {
          const count = rolePermissions(role).length;
          const active = highlight === role;
          return (
            <article
              key={role}
              className={cn(
                "flex min-h-[120px] flex-col border px-4 py-3 sm:min-h-[132px]",
                active
                  ? "border-(--gold)/45 bg-(--gold)/8"
                  : "border-white/10 bg-white/[0.02]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-cream">{roleLabel(role)}</p>
                {active ? (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-gold">You</span>
                ) : null}
              </div>
              <p className="mt-2 flex-1 text-[12px] leading-5 text-muted line-clamp-3">
                {roleBlurb(role) || ROLE_BLURBS.staff}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-gold">
                {count} permission{count === 1 ? "" : "s"}
              </p>
            </article>
          );
        })}
      </div>

      {/* Mobile: stacked permission groups */}
      <div className="space-y-3 lg:hidden">
        {PERMISSION_GROUPS.map((group) => {
          const { items, read, actions } = permissionGroupTree(group);
          const expanded = Boolean(open[group]);
          return (
            <div key={group} className="border border-white/10">
              <button
                type="button"
                onClick={() => setOpen((state) => ({ ...state, [group]: !expanded }))}
                aria-expanded={expanded}
                className="flex min-h-11 w-full items-center gap-2 bg-white/[0.04] px-4 py-3 text-left"
              >
                <ChevronRight
                  size={14}
                  className={cn("shrink-0 text-gold transition-transform", expanded && "rotate-90")}
                />
                <span className="text-[10px] uppercase tracking-[0.16em] text-gold">{group}</span>
                <span className="text-[10px] text-muted">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </span>
              </button>
              {expanded ? (
                <ul className="divide-y divide-white/5">
                  {read ? (
                    <MobilePermissionRow permission={read} highlight={highlight} hint="read access" roles={roles} />
                  ) : null}
                  {actions.map((permission) => (
                    <MobilePermissionRow
                      key={permission}
                      permission={permission}
                      highlight={highlight}
                      roles={roles}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto border border-white/10 lg:block">
        <table className="w-full min-w-[680px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
          <tr className={`${tableHeadRowClass} border-b border-(--gold)/30`}>
              <th className="px-4 py-3 font-medium">Permission</th>
              {roles.map((role) => (
                <th
                  key={role}
                  className={cn(
                    "px-2 py-3 text-center font-medium",
                    highlight === role && "text-gold",
                  )}
                >
                  {roleLabel(role)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => {
              const { items, read, actions } = permissionGroupTree(group);
              const expanded = Boolean(open[group]);
              return (
                <GroupAccordion
                  key={group}
                  group={group}
                  expanded={expanded}
                  highlight={highlight}
                  read={read}
                  actions={actions}
                  total={items.length}
                  onToggle={() => setOpen((state) => ({ ...state, [group]: !expanded }))}
                  roles={roles}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobilePermissionRow({
  permission,
  highlight,
  hint,
  roles,
}: {
  permission: Permission;
  highlight?: string;
  hint?: string;
  roles: string[];
}) {
  const meta = PERMISSION_META[permission];
  return (
    <li className="px-4 py-3">
      <p className="text-sm text-cream">
        {meta.label}
        {hint ? <span className="ml-1.5 text-[11px] text-muted">({hint})</span> : null}
      </p>
      <p className="mt-0.5 text-[11px] text-muted">{meta.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {roles.map((role) => {
          const on = rolePermissions(role).includes(permission);
          const active = highlight === role;
          return (
            <div
              key={role}
              className={cn(
                "flex min-h-10 items-center justify-between gap-2 border px-2.5 py-2 text-[11px]",
                active ? "border-(--gold)/40 bg-(--gold)/8" : "border-white/10",
              )}
            >
              <span className={active ? "text-gold" : "text-muted"}>{roleLabel(role)}</span>
              <Check on={on} />
            </div>
          );
        })}
      </div>
    </li>
  );
}

function GroupAccordion({
  group,
  expanded,
  highlight,
  read,
  actions,
  total,
  onToggle,
  roles,
}: {
  group: string;
  expanded: boolean;
  highlight?: string;
  read?: ReturnType<typeof permissionGroupTree>["read"];
  actions: ReturnType<typeof permissionGroupTree>["actions"];
  total: number;
  onToggle: () => void;
  roles: string[];
}) {
  return (
    <>
      <tr>
        <td colSpan={1 + roles.length} className="bg-white/[0.04] p-0">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="flex min-h-10 w-full items-center gap-2 px-4 py-2.5 text-left"
          >
            <ChevronRight
              size={14}
              className={cn("shrink-0 text-gold transition-transform", expanded && "rotate-90")}
            />
            <span className="text-[10px] uppercase tracking-[0.16em] text-gold">{group}</span>
            <span className="text-[10px] text-muted">
              {total} item{total === 1 ? "" : "s"}
            </span>
          </button>
        </td>
      </tr>
      {expanded && read ? (
        <PermissionMatrixRow permission={read} highlight={highlight} hint="grants read access" roles={roles} />
      ) : null}
      {expanded
        ? actions.map((permission) => (
            <PermissionMatrixRow
              key={permission}
              permission={permission}
              highlight={highlight}
              indent={Boolean(read)}
              roles={roles}
            />
          ))
        : null}
    </>
  );
}

function PermissionMatrixRow({
  permission,
  highlight,
  indent,
  hint,
  roles,
}: {
  permission: Permission;
  highlight?: string;
  indent?: boolean;
  hint?: string;
  roles: string[];
}) {
  const meta = PERMISSION_META[permission];
  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className={cn("py-2.5 align-middle", indent ? "px-4 pl-10" : "px-4")}>
        <p className="text-cream">
          {meta.label}
          {hint ? <span className="ml-1.5 text-[11px] font-normal text-muted">({hint})</span> : null}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted">{meta.description}</p>
      </td>
      {roles.map((role) => (
        <td
          key={role}
          className={cn(
            "px-2 py-2.5 text-center align-middle",
            highlight === role && "bg-(--gold)/5",
          )}
        >
          <Check on={rolePermissions(role).includes(permission)} />
        </td>
      ))}
    </tr>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
        on ? "bg-(--gold)/15 text-gold" : "bg-white/5 text-white/25",
      )}
    >
      {on ? "✓" : "–"}
    </span>
  );
}

export function RolePermissionList({ subject }: { subject: AccessInput }) {
  const items = effectivePermissions(subject);
  if (items.length === 0) {
    return <p className="text-xs text-muted">No dashboard permissions. Shop and account only.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((permission) => {
        const added = permissionSource(subject, permission) === "added";
        return (
          <li
            key={permission}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
              added
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-(--gold)/25 bg-(--gold)/10 text-gold",
            )}
          >
            {PERMISSION_META[permission].label}
            {added ? " · extra" : ""}
          </li>
        );
      })}
    </ul>
  );
}

export function RolePermissionsIntro() {
  return (
    <div className="flex items-start gap-2">
      <ShieldCheck size={16} className="mt-0.5 shrink-0 text-gold" />
      <p className="text-sm text-muted">
        Role defaults are grouped below. Built-in roles are always available, and you can add
        custom roles with a tailored permission set. You can still add or remove permissions for
        one user in Create user / Edit profile.
      </p>
    </div>
  );
}
