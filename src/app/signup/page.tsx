"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useUserStore } from "@/store/user";

export default function SignupPage() {
  const signup = useUserStore((s) => s.signup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(name, email, password);
      window.location.assign("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      kicker="New member"
      title="Create account"
      subtitle="Customer accounts can shop, checkout, and track orders. Staff roles are assigned by an admin."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-xs text-muted">
          Full name
          <Input
            className="mt-1"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <span className="mt-1 block text-[11px]">At least 8 characters, with a letter and a number.</span>
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating…" : "Sign up"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
