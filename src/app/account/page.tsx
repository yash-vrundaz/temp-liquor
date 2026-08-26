"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { roleLabel, isDemoAccountEmail, isStaffRole } from "@/lib/auth/roles";
import { RolePermissionList } from "@/components/dashboard/RolePermissionsMatrix";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { formatPrice } from "@/lib/utils";
import { useDeliveryStore } from "@/store/delivery";

export default function AccountPage() {
  const router = useRouter();
  const { isLoggedIn, profile, logout, updateProfile, authReady } = useUserStore();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const demoLocked = isDemoAccountEmail(profile.email);
  const enrich = useDeliveryStore((s) => s.enrich);

  useEffect(() => {
    if (authReady && !isLoggedIn) router.replace("/login?next=/account");
  }, [authReady, isLoggedIn, router]);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile.name, profile.email, profile.avatarUrl]);

  if (!authReady || !isLoggedIn) {
    return (
      <div className="px-4 py-24 text-center text-sm text-muted">Loading account…</div>
    );
  }

  const saveProfile = async (event: FormEvent) => {
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
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ambient-bg" />
      <div className="relative mx-auto max-w-3xl px-3 py-10 sm:px-4 sm:py-16">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
          {roleLabel(profile.role)}
        </p>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Your account</h1>
        <p className="mt-2 text-sm text-muted">{profile.email}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="glass border border-white/10 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted">Loyalty</p>
            <p className="mt-1 text-lg text-cream">{profile.loyaltyPoints} pts</p>
            <p className="text-xs text-gold">{profile.loyaltyTier}</p>
          </div>
          <div className="glass border border-white/10 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted">Orders</p>
            <p className="mt-1 text-lg text-cream">{profile.orders.length}</p>
          </div>
          <div className="glass border border-white/10 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted">Role</p>
            <p className="mt-1 text-lg text-cream">{roleLabel(profile.role)}</p>
          </div>
        </div>

        <div className="glass mt-4 border border-white/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-gold">This account can</p>
          <div className="mt-2">
            <RolePermissionList subject={profile} />
          </div>
        </div>

        <form className="glass mt-8 space-y-5 border border-white/10 p-4 sm:p-5" onSubmit={saveProfile}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Profile</p>
            <h2 className="mt-1 font-display text-xl text-cream">Name, email, password, photo</h2>
          </div>
          <AvatarUpload name={name} value={avatarUrl} onChange={setAvatarUrl} />
          <div className="grid gap-3 sm:grid-cols-2">
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
            <label className="block text-xs text-muted">
              Current password
              <PasswordInput
                className="mt-1"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={password ? "Required to set a new password" : "Only needed to change password"}
              />
            </label>
            <label className="block text-xs text-muted">
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
          </div>
          {demoLocked ? (
            <p className="text-xs text-muted">
              Demo account email is locked so the shared storefront logins keep working.
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </form>

        {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <div className="mt-10">
          <h2 className="font-display text-xl text-cream">Recent orders</h2>
          {profile.orders.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {profile.orders.slice(0, 8).map((raw) => {
                const order = enrich(raw);
                return (
                  <li
                    key={order.id}
                    className="border border-white/10 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-cream">{order.id}</span>
                      <span className="text-gold">{formatPrice(order.total)}</span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted">
                      {order.fulfillment === "delivery"
                        ? order.deliveryStatus?.replace("_", " ") ?? order.status
                        : order.status}
                    </p>
                    {order.fulfillment === "delivery" ? (
                      <p className="mt-1 text-xs text-muted">
                        {order.driver
                          ? `Driver ${order.driver.name} · ${order.driver.phone} · ${order.driver.vehicle}`
                          : "A Sam’s driver will be assigned from your store"}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {isStaffRole(profile) && (
            <Link href="/dashboard">
              <Button size="sm">Open dashboard</Button>
            </Link>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await logout();
              window.location.assign("/login");
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
