import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--gold)]",
        className,
      )}
      {...props}
    />
  );
}
