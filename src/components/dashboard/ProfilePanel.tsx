"use client";

import { FormEvent, useEffect, useState } from "react";
import { LogOut, MapPin, Shield } from "lucide-react";
import { useUserStore } from "@/store/user";
import { roleLabel, isDemoAccountEmail } from "@/lib/auth/roles";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { getAllLocations } from "@/data/locations";
import { accessibleLocations } from "@/lib/auth/location-access";
import { cn } from "@/lib/utils";

const ROLE_TONE: Record<string, string> = {
  owner: "border-(--gold)/40 bg-(--gold)/10 text-gold",
  admin: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  staff: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  customer: "border-white/15 bg-white/5 text-muted",
};

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
      <h3 className="mt-1 font-display text-base text-cream sm:text-lg">{title}</h3>
    </div>
  );
}

export function ProfilePanel() {
  const { profile, updateProfile, logout } = useUserStore();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const demoLocked = isDemoAccountEmail(profile.email);
  const stores = accessibleLocations(profile, getAllLocations());
  const homeStore =
    stores.find((store) => store.id === profile.preferredBranchId)?.shortName ??
    stores[0]?.shortName ??
    "—";

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile.name, profile.email, profile.avatarUrl]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password && !currentPassword) {
      setError("Enter your current password to set a new one.");
      return;
    }
    setBusy(true);
    try {
      await updateProfile({
        name,
        email,
        avatarUrl,
        ...(password ? { password, currentPassword } : {}),
      });
      setPassword("");
      setCurrentPassword("");
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-0 min-w-0">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-5">
        <div className="min-w-0">
          <p className="hidden text-[10px] uppercase tracking-[0.22em] text-gold lg:flex lg:items-center lg:gap-2">
            <Shield size={12} className="text-gold" />
            Profile
          </p>
          <h2 className="hidden font-display text-3xl text-cream lg:mt-2 lg:block xl:text-4xl">
            Profile
          </h2>
          <p className="max-w-2xl text-sm text-muted lg:mt-2">
            Update your photo, name, email, and password.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full shrink-0 sm:w-auto"
            onClick={async () => {
              await logout();
              window.location.assign("/login");
            }}
          >
            <LogOut size={14} />
            Sign out
          </Button>
        </div>
      </div>

      <div className="glass mt-4 overflow-hidden border border-white/10 sm:mt-6">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,17.5rem)_1fr]">
          <aside className="min-w-0 border-b border-white/10 bg-white/[0.02] p-4 sm:p-5 lg:border-b-0 lg:border-r lg:p-6">
            <AvatarUpload layout="responsive" name={name} value={avatarUrl} onChange={setAvatarUrl} />
            <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-left lg:text-center">
              <p className="truncate font-display text-lg text-cream sm:text-xl">{name || "Your name"}</p>
              <div className="flex flex-wrap items-center gap-2 lg:justify-center">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]",
                    ROLE_TONE[profile.role] ?? ROLE_TONE.customer,
                  )}
                >
                  <Shield size={12} />
                  {roleLabel(profile.role)}
                </span>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted">
                  <MapPin size={12} className="shrink-0 text-gold" />
                  <span className="truncate">{homeStore}</span>
                </span>
              </div>
            </div>
          </aside>

          <form onSubmit={save} className="min-w-0 p-4 sm:p-5 lg:p-8">
            <SectionHeading eyebrow="Account" title="Personal details" />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block min-w-0 text-xs text-muted">
                Full name
                <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="block min-w-0 text-xs text-muted">
                Email
                <Input
                  className="mt-1.5"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={demoLocked}
                />
              </label>
            </div>
            {demoLocked ? (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Demo account email is locked so the shared storefront logins keep working.
              </p>
            ) : null}

            <div className="mt-6 border-t border-white/10 pt-6 sm:mt-8 sm:pt-8">
              <SectionHeading eyebrow="Security" title="Change password" />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block min-w-0 text-xs text-muted">
                  Current password
                  <PasswordInput
                    className="mt-1.5"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={password ? "Required for new password" : "Enter current password"}
                  />
                </label>
                <label className="block min-w-0 text-xs text-muted">
                  New password
                  <PasswordInput
                    className="mt-1.5"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    minLength={8}
                  />
                </label>
              </div>
            </div>

            {message ? <p className="mt-4 text-sm text-emerald-300 sm:mt-5">{message}</p> : null}
            {error ? <p className="mt-4 text-sm text-red-300 sm:mt-5">{error}</p> : null}

            <div className="mt-5 flex border-t border-white/10 pt-4 sm:mt-6 sm:justify-end sm:pt-5">
              <Button type="submit" size="sm" className="w-full sm:w-auto" disabled={busy}>
                {busy ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
