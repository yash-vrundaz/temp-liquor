"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  PERMISSION_GROUPS,
  PERMISSION_META,
  PERMISSIONS,
  hasPermission,
  permissionGroupTree,
  rolePermissions,
  type AccessInput,
  type Permission,
} from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  role: UserRole;
  enabled: Permission[];
  actor: AccessInput;
  onChange: (enabled: Permission[]) => void;
  locked?: boolean;
};

export function UserPermissionEditor({ role, enabled, actor, onChange, locked }: Props) {
  const base = new Set(rolePermissions(role));
  const on = new Set(enabled);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERMISSION_GROUPS.map((group, index) => [group, index === 0])),
  );

  const toggle = (permission: Permission) => {
    if (locked || role === "owner") return;
    if (!hasPermission(actor, permission)) return;
    const next = new Set(on);
    const { items, read, actions } = permissionGroupTree(PERMISSION_META[permission].group);
    if (next.has(permission)) {
      next.delete(permission);
      if (permission === read) {
        for (const action of actions) next.delete(action);
      }
    } else {
      next.add(permission);
      if (read && items.includes(permission) && permission !== read) next.add(read);
    }
    onChange(PERMISSIONS.filter((item) => next.has(item)));
  };

  const toggleGroup = (group: string) => {
    if (locked || role === "owner") return;
    const { items } = permissionGroupTree(group);
    const togglable = items.filter((permission) => hasPermission(actor, permission));
    if (togglable.length === 0) return;
    const allOn = togglable.every((permission) => on.has(permission));
    const next = new Set(on);
    for (const permission of togglable) {
      if (allOn) next.delete(permission);
      else next.add(permission);
    }
    onChange(PERMISSIONS.filter((item) => next.has(item)));
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Permissions for this user</p>
        <p className="mt-1 text-[12px] text-muted">
          {ROLE_LABELS[role]} defaults are marked Role. Expand a section, then check extras like Reset
          store or Reset password for this person only.
        </p>
      </div>
      <div className="border border-white/10">
        {PERMISSION_GROUPS.map((group) => {
          const { items, read, actions } = permissionGroupTree(group);
          const expanded = Boolean(open[group]);
          const checkedCount = items.filter((permission) => on.has(permission)).length;
          const allOn = items.length > 0 && checkedCount === items.length;
          const someOn = checkedCount > 0 && !allOn;
          const canToggleGroup =
            !locked &&
            role !== "owner" &&
            items.some((permission) => hasPermission(actor, permission));
          return (
            <div key={group} className="border-b border-white/10 last:border-b-0">
              <div className="flex items-center gap-2 bg-white/[0.04] px-3 py-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => setOpen((state) => ({ ...state, [group]: !expanded }))}
                  aria-expanded={expanded}
                >
                  <ChevronRight
                    size={14}
                    className={cn("shrink-0 text-gold transition-transform", expanded && "rotate-90")}
                  />
                  <span className="text-[10px] uppercase tracking-[0.16em] text-gold">{group}</span>
                  <span className="text-[10px] text-muted">
                    {checkedCount}/{items.length}
                  </span>
                </button>
                <GroupCheckbox
                  checked={allOn}
                  indeterminate={someOn}
                  disabled={!canToggleGroup}
                  onChange={() => toggleGroup(group)}
                  label={`Toggle all ${group} permissions`}
                />
              </div>
              {expanded ? (
                <ul>
                  {read ? (
                    <PermissionRow
                      permission={read}
                      checked={on.has(read)}
                      inRole={base.has(read) || role === "owner"}
                      canToggle={!locked && role !== "owner" && hasPermission(actor, read)}
                      hint="grants read access"
                      onToggle={() => toggle(read)}
                    />
                  ) : null}
                  {actions.map((permission) => (
                    <PermissionRow
                      key={permission}
                      permission={permission}
                      checked={on.has(permission)}
                      inRole={base.has(permission) || role === "owner"}
                      canToggle={!locked && role !== "owner" && hasPermission(actor, permission)}
                      indent={Boolean(read)}
                      onToggle={() => toggle(permission)}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
      {role === "owner" ? (
        <p className="text-xs text-muted">Owner accounts always keep full access.</p>
      ) : locked ? (
        <p className="text-xs text-muted">You can view these permissions, but not change them on this account.</p>
      ) : null}
    </div>
  );
}

function PermissionRow({
  permission,
  checked,
  inRole,
  canToggle,
  indent,
  hint,
  onToggle,
}: {
  permission: Permission;
  checked: boolean;
  inRole: boolean;
  canToggle: boolean;
  indent?: boolean;
  hint?: string;
  onToggle: () => void;
}) {
  const meta = PERMISSION_META[permission];
  const tag = checked && !inRole ? "Added" : !checked && inRole ? "Removed" : inRole ? "Role" : null;
  return (
    <li
      className={cn(
        "flex items-start gap-3 border-t border-white/5 py-2.5 pr-3",
        indent ? "pl-10" : "pl-3",
      )}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-(--gold)"
        checked={checked}
        disabled={!canToggle}
        onChange={onToggle}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-sm", checked ? "text-cream" : "text-muted")}>{meta.label}</p>
          {hint ? <span className="text-[11px] text-muted">({hint})</span> : null}
          {tag ? (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
                tag === "Added"
                  ? "border-emerald-400/30 text-emerald-200"
                  : tag === "Removed"
                    ? "border-(--danger)/30 text-(--danger)"
                    : "border-white/15 text-muted",
              )}
            >
              {tag}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-muted">{meta.description}</p>
      </div>
    </li>
  );
}

function GroupCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: () => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 accent-(--gold)"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={label}
    />
  );
}
