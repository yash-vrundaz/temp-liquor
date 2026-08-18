"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/store/user";
import { isStaffRole } from "@/lib/auth/roles";

export function UnavailablePage() {
  const isStaff = useUserStore((s) => s.isLoggedIn && isStaffRole(s.profile));
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ambient-bg" />
      <div className="relative mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">404</p>
        <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl md:text-6xl">
          This page could not be found
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted sm:text-base">
          The page is unavailable, or your account does not have permission to view it.
        </p>
        <div className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <Link href="/" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              Return home
            </Button>
          </Link>
          <Link href="/shop" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Shop collections
            </Button>
          </Link>
          {isStaff ? (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Open dashboard
              </Button>
            </Link>
          ) : (
            <Link href={isLoggedIn ? "/account" : "/login"} className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                {isLoggedIn ? "Your account" : "Sign in"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
