"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChartSelection } from "@/lib/dashboardAnalytics";

export type ChartFilterOption = {
  /** Hover / focus key, e.g. `month:2024-01` */
  id: string;
  label: string;
  valueLabel?: string;
  color?: string;
  selection: ChartSelection;
};

type Layout = "grid" | "wrap" | "stack";

type ChartFilterListProps = {
  label: string;
  options: ChartFilterOption[];
  chartFocus: boolean;
  hoverKey: string | null;
  isSelected: (option: ChartFilterOption) => boolean;
  onHover: (key: string | null) => void;
  onToggle: (selection: ChartSelection, meta?: { moveFocus?: boolean }) => void;
  onClearSelection?: () => void;
  layout?: Layout;
  className?: string;
};

function moveIndex(current: number, delta: number, length: number) {
  if (length <= 0) return 0;
  return (current + delta + length) % length;
}

export function ChartFilterList({
  label,
  options,
  chartFocus,
  hoverKey,
  isSelected,
  onHover,
  onToggle,
  onClearSelection,
  layout = "wrap",
  className,
}: ChartFilterListProps) {
  const listId = useId();
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const optionIds = options.map((o) => o.id).join("|");
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    const selectedIdx = options.findIndex((opt) => isSelected(opt));
    setFocusIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [optionIds]); // eslint-disable-line react-hooks/exhaustive-deps -- re-anchor when options change

  const focusItem = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, options.length - 1));
      setFocusIndex(next);
      itemRefs.current[next]?.focus();
      const option = options[next];
      if (option) onHover(option.id);
    },
    [onHover, options],
  );

  if (options.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label={label}
      aria-orientation={layout === "stack" ? "vertical" : "horizontal"}
      className={cn(
        layout === "grid" &&
          "mt-1 grid grid-cols-1 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-2",
        layout === "wrap" &&
          "mt-3 flex flex-wrap justify-center gap-x-2 gap-y-2 text-[11px]",
        layout === "stack" &&
          "mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto overscroll-contain text-xs",
        className,
      )}
      onKeyDown={(e) => {
        if (options.length === 0) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          focusItem(moveIndex(focusIndex, 1, options.length));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          focusItem(moveIndex(focusIndex, -1, options.length));
        } else if (e.key === "Home") {
          e.preventDefault();
          focusItem(0);
        } else if (e.key === "End") {
          e.preventDefault();
          focusItem(options.length - 1);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onHover(null);
          onClearSelection?.();
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          onHover(null);
        }
      }}
    >
      {options.map((option, index) => {
        const selected = isSelected(option);
        const hovered = hoverKey === option.id;
        const optionId = `${listId}-${option.id}`;
        return (
          <button
            key={option.id}
            id={optionId}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            role="option"
            aria-selected={selected}
            tabIndex={index === focusIndex ? 0 : -1}
            onFocus={() => {
              setFocusIndex(index);
              onHover(option.id);
            }}
            onMouseEnter={() => onHover(option.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) =>
              onToggle(option.selection, { moveFocus: e.detail === 0 })
            }
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-sm px-2.5 py-2 text-left transition-all",
              "outline-none focus-visible:ring-2 focus-visible:ring-(--gold)/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
              layout === "wrap" && "inline-flex",
              layout === "stack" && "w-full",
              layout === "grid" && "w-full",
              chartFocus && !selected && !hovered ? "opacity-35" : "opacity-100",
              hovered || selected ? "bg-white/5 text-cream" : "text-muted",
            )}
          >
            {option.color ? (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: option.color }}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "truncate",
                hovered || selected
                  ? "text-gold"
                  : layout === "wrap"
                    ? ""
                    : "text-cream",
              )}
            >
              {option.label}
            </span>
            {option.valueLabel ? (
              <span className="ml-auto shrink-0 tabular-nums text-muted">
                {option.valueLabel}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
