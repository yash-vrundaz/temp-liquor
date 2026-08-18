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
import { ROLE_BLURBS, ROLE_LABELS, USER_ROLES } from "@/lib/auth/roles";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { tableHeadRowClass } from "@/components/ui/SortableTh";

type Props = {
  highlight?: UserRole;
};

export function RolePermissionsMatrix({ highlight }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERMISSION_GROUPS.map((group) => [group, true])),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {USER_ROLES.map((role) => {
          const count = rolePermissions(role).length;
          const active = highlight === role;
          return (
            <article
              key={role}
              className={cn(
                "flex min-h-[132px] flex-col border px-4 py-3",
                active
                  ? "border-(--gold)/45 bg-(--gold)/8"
                  : "border-white/10 bg-white/[0.02]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-cream">{ROLE_LABELS[role]}</p>
                {active ? (
                  <span className="text-[10px] uppercase tracking-[0.14em] text-gold">You</span>
                ) : null}
              </div>
              <p className="mt-2 flex-1 text-[12px] leading-5 text-muted line-clamp-3">{ROLE_BLURBS[role]}</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-gold">
                {count} permission{count === 1 ? "" : "s"}
              </p>
            </article>
          );
        })}
      </div>

      <div className="overflow-x-auto border border-white/10">
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
              {USER_ROLES.map((role) => (
                <th
                  key={role}
                  className={cn(
                    "px-2 py-3 text-center font-medium",
                    highlight === role && "text-gold",
                  )}
                >
                  {ROLE_LABELS[role]}
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
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
}: {
  group: string;
  expanded: boolean;
  highlight?: UserRole;
  read?: ReturnType<typeof permissionGroupTree>["read"];
  actions: ReturnType<typeof permissionGroupTree>["actions"];
  total: number;
  onToggle: () => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={1 + USER_ROLES.length} className="bg-white/[0.04] p-0">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
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
        <PermissionMatrixRow permission={read} highlight={highlight} hint="grants read access" />
      ) : null}
      {expanded
        ? actions.map((permission) => (
            <PermissionMatrixRow
              key={permission}
              permission={permission}
              highlight={highlight}
              indent={Boolean(read)}
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
}: {
  permission: Permission;
  highlight?: UserRole;
  indent?: boolean;
  hint?: string;
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
      {USER_ROLES.map((role) => (
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
        Role defaults are grouped below. Expand a section to compare Customer, Staff, Admin, and Owner.
        You can still add or remove permissions for one account in Create user / Edit profile.
      </p>
    </div>
  );
}
