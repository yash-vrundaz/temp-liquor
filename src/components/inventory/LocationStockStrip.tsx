"use client";

import { useBranchStore } from "@/store/branch";
import { useInventoryStore } from "@/store/inventory";
import { stockByLocation } from "@/lib/cart-availability";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  needed?: number;
  compact?: boolean;
  className?: string;
};

/** Always shows this bottle's count at every Sam's branch as tight chips. */
export function LocationStockStrip({
  productId,
  needed = 0,
  compact = false,
  className,
}: Props) {
  const branchId = useBranchStore((s) => s.branchId);
  const revision = useInventoryStore((s) => s.revision);
  const setBranch = useBranchStore((s) => s.setBranch);
  void revision;

  const rows = stockByLocation(productId);

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {rows.map(({ location, stock }) => {
        const current = location.id === branchId;
        const covers = needed > 0 && stock >= needed;
        const short = needed > 0 && stock > 0 && stock < needed;
        return (
          <button
            key={location.id}
            type="button"
            onClick={() => setBranch(location.id)}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap border transition touch-manipulation",
              compact
                ? "px-2 py-1.5 text-[10px] sm:min-h-8"
                : "min-h-10 px-2.5 py-2 text-xs",
              current
                ? "border-(--gold)/50 bg-(--gold)/12 text-cream"
                : "border-white/10 text-muted hover:border-white/25 hover:text-cream",
            )}
          >
            <span className="uppercase tracking-[0.12em]">{location.shortName}</span>
            <span
              className={cn(
                "tabular-nums",
                stock <= 0
                  ? "text-red-300"
                  : covers
                    ? "text-(--success)"
                    : short
                      ? "text-amber-200"
                      : "text-cream",
              )}
            >
              {stock}
            </span>
          </button>
        );
      })}
    </div>
  );
}
