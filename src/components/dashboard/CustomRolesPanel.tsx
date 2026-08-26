"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  apiCreateRole,
  apiDeleteRole,
  apiFetchRoles,
  apiPatchRole,
} from "@/lib/api-mutations";
import type { CustomRoleDefinition } from "@/lib/auth/role-catalog";
import { setCustomRoleCatalog } from "@/lib/auth/role-catalog";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { roleLabel, USER_ROLES } from "@/lib/auth/roles";
import { isConnectionError } from "@/lib/connection-messages";
import { ConnectionNotice } from "@/components/dashboard/ConnectionNotice";
import {
  RolePermissionsIntro,
  RolePermissionsMatrix,
} from "@/components/dashboard/RolePermissionsMatrix";
import { UserPermissionEditor } from "@/components/dashboard/UserPermissionEditor";
import { useUserStore } from "@/store/user";
import { isDbConnected } from "@/lib/runtime-data";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

type RoleForm = {
  label: string;
  slug: string;
  description: string;
  permissions: Permission[];
};

function emptyForm(): RoleForm {
  return { label: "", slug: "", description: "", permissions: [] };
}

function validateForm(form: RoleForm) {
  if (form.label.trim().length < 2) return "Enter a role name.";
  if (form.permissions.length === 0) return "Choose at least one permission.";
  if (form.slug.trim() && !/^[a-z][a-z0-9-]*$/.test(form.slug.trim())) {
    return "Slug must be lowercase letters, numbers, and hyphens.";
  }
  return null;
}

type Props = {
  highlight?: string;
};

export function CustomRolesPanel({ highlight }: Props) {
  const actor = useUserStore((s) => s.profile);
  const canManage = hasPermission(actor, "users.assign_roles");
  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<CustomRoleDefinition | "new" | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!isDbConnected()) {
      setCustomRoles([]);
      setCustomRoleCatalog([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetchRoles();
      setCustomRoles(data.roles);
      setCustomRoleCatalog(data.roles);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load roles.";
      setError(isConnectionError(message) ? "" : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const matrixRoles = useMemo(
    () => [...USER_ROLES, ...customRoles.map((role) => role.slug)],
    [customRoles],
  );

  const openCreate = () => {
    setForm(emptyForm());
    setEditing("new");
    setError("");
  };

  const openEdit = (role: CustomRoleDefinition) => {
    setForm({
      label: role.label,
      slug: role.slug,
      description: role.description,
      permissions: [...role.permissions],
    });
    setEditing(role);
    setError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateForm(form);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        label: form.label.trim(),
        description: form.description.trim(),
        permissions: form.permissions,
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      };
      if (editing === "new") {
        await apiCreateRole(payload);
      } else if (editing) {
        await apiPatchRole({ roleId: editing.id, patch: payload });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save role.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (role: CustomRoleDefinition) => {
    if (!window.confirm(`Delete the ${role.label} role? Users must be reassigned first.`)) return;
    setBusy(true);
    setError("");
    try {
      await apiDeleteRole(role.id);
      if (editing && editing !== "new" && editing.id === role.id) setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete role.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <RolePermissionsIntro />
        {canManage ? (
          <Button size="sm" className="shrink-0 self-start" onClick={openCreate}>
            <Plus size={14} />
            Add role
          </Button>
        ) : null}
      </div>

      {!isDbConnected() ? (
        <ConnectionNotice className="mt-2" feature="save custom roles" preview />
      ) : null}
      {error && !editing ? <p className="text-sm text-red-300">{error}</p> : null}

      {customRoles.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {customRoles.map((role) => (
            <article
              key={role.id}
              className="flex min-h-[120px] flex-col border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-cream">{role.label}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
                    {role.slug}
                  </p>
                </div>
                {canManage ? (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-muted transition hover:border-(--gold)/40 hover:text-cream"
                      aria-label={`Edit ${role.label}`}
                      onClick={() => openEdit(role)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-muted transition hover:border-red-400/40 hover:text-red-200"
                      aria-label={`Delete ${role.label}`}
                      onClick={() => void remove(role)}
                      disabled={busy}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="mt-2 flex-1 text-[12px] leading-5 text-muted line-clamp-3">
                {role.description || "Custom role with a tailored permission set."}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-gold">
                {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
              </p>
            </article>
          ))}
        </div>
      ) : loading ? (
        <p className="text-sm text-muted">Loading custom roles…</p>
      ) : isDbConnected() ? (
        <p className="rounded-sm border border-dashed border-white/10 px-4 py-5 text-sm text-muted">
          No custom roles yet. Built-in roles are always available — add one when you need a
          tailored permission set for your team.
        </p>
      ) : null}

      <RolePermissionsMatrix highlight={highlight} roles={matrixRoles} />

      <Modal
        open={Boolean(editing)}
        title={editing === "new" ? "Add role" : "Edit role"}
        onClose={() => {
          if (!busy) setEditing(null);
        }}
      >
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <label className="block text-xs text-muted">
            Role name
            <Input
              className="mt-1"
              value={form.label}
              onChange={(event) => setForm((state) => ({ ...state, label: event.target.value }))}
              placeholder="Inventory lead"
              autoFocus
            />
          </label>
          <label className="block text-xs text-muted">
            Slug
            <Input
              className="mt-1"
              value={form.slug}
              onChange={(event) => setForm((state) => ({ ...state, slug: event.target.value }))}
              placeholder="inventory-lead"
            />
            <span className="mt-1 block text-[11px] text-muted/80">
              Optional. Used when assigning this role to users.
            </span>
          </label>
          <label className="block text-xs text-muted">
            Description
            <Input
              className="mt-1"
              value={form.description}
              onChange={(event) =>
                setForm((state) => ({ ...state, description: event.target.value }))
              }
              placeholder="Restock and adjust inventory without catalog access."
            />
          </label>

          <div>
            <p className="text-xs text-muted">Default permissions</p>
            <div className="mt-2 rounded-sm border border-white/10 p-3">
              <UserPermissionEditor
                role="__custom__"
                enabled={form.permissions}
                actor={actor}
                onChange={(permissions) =>
                  setForm((state) => ({ ...state, permissions }))
                }
              />
            </div>
          </div>

          {error && editing ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editing === "new" ? "Create role" : "Save role"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function roleTone(role: string) {
  if (role === "owner") return "border-(--gold)/40 bg-(--gold)/10 text-gold";
  if (role === "admin") return "border-violet-400/30 bg-violet-400/10 text-violet-200";
  if (role === "staff") return "border-sky-400/30 bg-sky-400/10 text-sky-200";
  if (role === "customer") return "border-white/15 bg-white/5 text-muted";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
        roleTone(role),
        className,
      )}
    >
      {roleLabel(role)}
    </span>
  );
}
