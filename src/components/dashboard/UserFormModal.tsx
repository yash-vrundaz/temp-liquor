"use client";

import { FormEvent, useEffect, useState } from "react";
import { ROLE_BLURBS, ROLE_LABELS, canAssignRole, isDemoAccountEmail } from "@/lib/auth/roles";
import {
  PERMISSIONS,
  effectivePermissions,
  overridesFromEnabled,
  rolePermissions,
  type Permission,
} from "@/lib/auth/permissions";
import { UserPermissionEditor } from "@/components/dashboard/UserPermissionEditor";
import { LocationAccessFields } from "@/components/dashboard/LocationAccessFields";
import type { ManagedUser, UserProfile, UserRole } from "@/types";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Select } from "@/components/ui/Select";

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatarUrl: string;
  permissionGrants: Permission[];
  permissionRevokes: Permission[];
  allowedLocationIds: string[] | null;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  assignableRoles: UserRole[];
  initial?: Partial<ManagedUser>;
  actor: UserProfile;
  actorId?: string;
  canCustomizePermissions?: boolean;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
};

const emptyRole: UserRole = "staff";

export function UserFormModal({
  open,
  mode,
  assignableRoles,
  initial,
  actor,
  actorId,
  canCustomizePermissions = true,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: emptyRole,
    avatarUrl: "",
    enabled: rolePermissions(emptyRole),
    allowedLocationIds: null as string[] | null,
  });
  const demoLocked = Boolean(initial?.email && isDemoAccountEmail(initial.email));
  const canChangeRole =
    mode === "create" || (initial?.role ? canAssignRole(actor, initial.role) : false);
  const editingSelf = Boolean(actorId && initial?.id && actorId === initial.id);
  const lockedPermissions = !canCustomizePermissions || editingSelf || form.role === "owner";

  useEffect(() => {
    if (!open) return;
    const role =
      initial?.role && (assignableRoles.includes(initial.role) || mode === "edit")
        ? initial.role
        : assignableRoles.includes("staff")
          ? "staff"
          : (assignableRoles[0] ?? "staff");
    setForm({
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      password: "",
      role,
      avatarUrl: initial?.avatarUrl ?? "",
      enabled: effectivePermissions({
        role,
        permissionGrants: initial?.permissionGrants,
        permissionRevokes: initial?.permissionRevokes,
      }),
      allowedLocationIds: initial?.allowedLocationIds ?? null,
    });
  }, [open, initial, assignableRoles, mode]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const overrides = overridesFromEnabled(form.role, form.enabled);
    await onSubmit({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      avatarUrl: form.avatarUrl,
      permissionGrants: overrides.permissionGrants,
      permissionRevokes: overrides.permissionRevokes,
      allowedLocationIds: form.allowedLocationIds,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Create user" : "Edit profile"}
      subtitle={
        mode === "create"
          ? "Add an account, then grant or remove permissions for this person only."
          : "Update profile details and this user’s permissions."
      }
      className="sm:max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-6">
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Profile</p>
          <AvatarUpload
            name={form.name}
            value={form.avatarUrl}
            onChange={(avatarUrl) => setForm((f) => ({ ...f, avatarUrl }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted">
              Full name
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                required
              />
            </label>
            <label className="block text-xs text-muted">
              Email
              <Input
                className="mt-1"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@email.com"
                required
                disabled={demoLocked}
              />
            </label>
            <label className="block text-xs text-muted">
              {mode === "create" ? "Password" : "New password"}
              <PasswordInput
                className="mt-1"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={mode === "edit" ? "Leave blank to keep current" : "At least 8 characters"}
                minLength={mode === "create" ? 8 : undefined}
                required={mode === "create"}
              />
            </label>
            <label className="block text-xs text-muted">
              Role
              <div className="mt-1">
                {canChangeRole ? (
                  <Select
                    className="[&_button]:h-[46px] [&_button]:px-4"
                    value={form.role}
                    onChange={(value) =>
                      setForm((f) => {
                        const nextRole = value as UserRole;
                        if (nextRole === "owner") {
                          return {
                            ...f,
                            role: nextRole,
                            enabled: effectivePermissions("owner"),
                          };
                        }
                        const previousDefaults = new Set(rolePermissions(f.role));
                        const extras = f.enabled.filter((permission) => !previousDefaults.has(permission));
                        const nextDefaults = rolePermissions(nextRole);
                        const extraSet = new Set(nextDefaults);
                        for (const permission of extras) extraSet.add(permission);
                        return {
                          ...f,
                          role: nextRole,
                          enabled: PERMISSIONS.filter((permission) => extraSet.has(permission)),
                        };
                      })
                    }
                    options={assignableRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                  />
                ) : (
                  <Input className="mt-0" value={ROLE_LABELS[form.role]} disabled />
                )}
              </div>
            </label>
          </div>
          <p className="text-[12px] text-muted">{ROLE_BLURBS[form.role]}</p>
          {demoLocked ? (
            <p className="text-xs text-muted">Demo account email is locked so the shared logins keep working.</p>
          ) : null}
        </section>

        <LocationAccessFields
          actor={actor}
          role={form.role}
          value={form.allowedLocationIds}
          locked={lockedPermissions}
          onChange={(allowedLocationIds) => setForm((f) => ({ ...f, allowedLocationIds }))}
        />

        <UserPermissionEditor
          role={form.role}
          enabled={form.enabled}
          actor={actor}
          locked={lockedPermissions}
          onChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
        />

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="modal-actions border-t border-white/10 pt-4">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={busy || assignableRoles.length === 0}>
            {busy ? "Saving…" : mode === "create" ? "Add user" : "Save profile"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
