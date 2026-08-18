"use client";

import { FormEvent, useEffect, useState } from "react";
import { useUserStore } from "@/store/user";
import { ROLE_LABELS, isDemoAccountEmail } from "@/lib/auth/roles";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { getAllLocations } from "@/data/locations";
import { accessibleLocations } from "@/lib/auth/location-access";

export function ProfilePanel() {
  const { profile, updateProfile, logout } = useUserStore();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const demoLocked = isDemoAccountEmail(profile.email);
  const stores = accessibleLocations(profile, getAllLocations());

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile.name, profile.email, profile.avatarUrl]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await updateProfile({
        name,
        email,
        avatarUrl,
        ...(password ? { password } : {}),
      });
      setPassword("");
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-cream sm:text-3xl">Profile</h2>
          <p className="mt-1 text-sm text-muted">Your photo, name, email, and password for this account.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Role</p>
          <p className="mt-1 text-lg text-cream">{ROLE_LABELS[profile.role]}</p>
        </div>
        <div className="border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Home store</p>
          <p className="mt-1 text-lg text-cream">
            {stores.find((store) => store.id === profile.preferredBranchId)?.shortName ??
              stores[0]?.shortName ??
              "—"}
          </p>
        </div>
        <div className="border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Email</p>
          <p className="mt-1 truncate text-lg text-cream">{profile.email}</p>
        </div>
      </div>

      <form onSubmit={save} className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AvatarUpload name={name} value={avatarUrl} onChange={setAvatarUrl} />
        </div>
        <label className="block text-xs text-muted">
          Full name
          <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block text-xs text-muted">
          Email
          <Input
            className="mt-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={demoLocked}
          />
        </label>
        <label className="block text-xs text-muted sm:col-span-2">
          New password
          <PasswordInput
            className="mt-1"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep your current password"
            minLength={8}
          />
        </label>
        {demoLocked ? (
          <p className="text-xs text-muted sm:col-span-2">
            Demo account email is locked so the shared storefront logins keep working.
          </p>
        ) : null}
        {message ? <p className="text-sm text-emerald-300 sm:col-span-2">{message}</p> : null}
        {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={async () => {
              await logout();
              window.location.assign("/login");
            }}
          >
            Sign out
          </Button>
        </div>
      </form>
    </section>
  );
}
