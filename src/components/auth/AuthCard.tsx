"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ambient-bg" />
      <div className="relative mx-auto max-w-md px-3 py-12 sm:px-4 sm:py-20">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">{kicker}</p>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">{subtitle}</p>
        <div className="glass mt-8 border border-white/10 p-4 sm:p-6">{children}</div>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="text-gold hover:underline">
            Back to shop
          </Link>
        </p>
      </div>
    </div>
  );
}
