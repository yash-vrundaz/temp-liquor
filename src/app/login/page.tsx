"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useUserStore } from "@/store/user";
import { isStaffRole } from "@/lib/auth/roles";
import { safeInternalPath } from "@/lib/utils";
import type { UserProfile } from "@/types";

function destinationForUser(next: string | null, profile: UserProfile) {
  return safeInternalPath(next) || (isStaffRole(profile) ? "/dashboard" : "/account");
}

function LoginForm() {
  const search = useSearchParams();
  const login = useUserStore((s) => s.login);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const authReady = useUserStore((s) => s.authReady);
  const profile = useUserStore((s) => s.profile);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authReady && isLoggedIn) {
      window.location.replace(destinationForUser(search.get("next"), profile));
    }
  }, [authReady, isLoggedIn, profile, search]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      const profile = useUserStore.getState().profile;
      window.location.assign(destinationForUser(search.get("next"), profile));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setBusy(false);
    }
  };

  return (
    <AuthCard
      kicker="Members"
      title="Sign in"
      subtitle="Use your email and password. Staff, admin, and owner accounts open the dashboard."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-xs text-muted">
          Email
          <Input
            className="mt-1"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-xs text-muted">
          Password
          <PasswordInput
            className="mt-1"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        New here?{" "}
        <Link
          href={
            search.get("next")
              ? `/signup?next=${encodeURIComponent(search.get("next")!)}`
              : "/signup"
          }
          className="text-gold hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
