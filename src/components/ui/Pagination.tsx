"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

function pageWindow(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current]);
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  return [...pages].sort((a, b) => a - b);
}

export function Pagination({ page, totalPages, onChange, className }: Props) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "mt-12 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex h-10 items-center gap-1 border border-white/10 px-2.5 text-xs uppercase tracking-[0.14em] text-muted transition hover:border-(--gold)/40 hover:text-gold disabled:pointer-events-none disabled:opacity-35 sm:px-3"
      >
        <ChevronLeft size={14} />
        <span className="hidden sm:inline">Prev</span>
      </button>

      <div className="flex flex-wrap items-center gap-1.5">
        {pages.map((n, i) => {
          const prev = pages[i - 1];
          const showEllipsis = prev != null && n - prev > 1;
          return (
            <span key={n} className="flex items-center gap-1.5">
              {showEllipsis && (
                <span className="px-1 text-xs text-muted" aria-hidden>
                  …
                </span>
              )}
              <button
                type="button"
                aria-label={`Page ${n}`}
                aria-current={page === n ? "page" : undefined}
                onClick={() => onChange(n)}
                className={cn(
                  "inline-flex h-10 min-w-10 items-center justify-center border px-2.5 text-sm tabular-nums transition",
                  page === n
                    ? "border-(--gold)/50 bg-(--gold)/12 text-cream"
                    : "border-white/10 text-muted hover:border-(--gold)/35 hover:text-gold",
                )}
              >
                {n}
              </button>
            </span>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="inline-flex h-10 items-center gap-1 border border-white/10 px-2.5 text-xs uppercase tracking-[0.14em] text-muted transition hover:border-(--gold)/40 hover:text-gold disabled:pointer-events-none disabled:opacity-35 sm:px-3"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}
