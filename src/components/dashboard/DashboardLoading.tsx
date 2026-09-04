"use client";

import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  className?: string;
  fullScreen?: boolean;
};

export function DashboardLoading({
  label = "Loading…",
  className,
  fullScreen = true,
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-4",
        fullScreen ? "min-h-[min(70dvh,40rem)]" : "py-16",
        className,
      )}
    >
      <div className="relative h-11 w-11" aria-hidden>
        <span className="absolute inset-0 rounded-full border border-white/10" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-(--gold) border-r-(--gold)/40" />
      </div>
      <p className="text-sm tracking-wide text-gold">{label}</p>
    </div>
  );
}

/** Compact inline loader for panels fetching data. */
export function PanelLoading({ label = "Loading…" }: { label?: string }) {
  return <DashboardLoading label={label} fullScreen={false} className="py-20" />;
}
