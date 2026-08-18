"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  id?: string;
};

export function Select({ label, value, onChange, options, className, id }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const listId = id ?? autoId;
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label && (
        <span className="text-xs text-muted" id={`${listId}-label`}>
          {label}
        </span>
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${listId}-label` : undefined}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full min-h-11 items-center justify-between gap-2 rounded-sm border bg-(--bg-elevated) px-3 py-2.5 text-left text-base text-cream outline-none transition sm:min-h-10 sm:text-sm",
          label && "mt-1",
          open
            ? "border-(--gold)/50"
            : "border-white/10 hover:border-white/20 focus:border-(--gold)/40",
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-muted transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-[90] mt-1 max-h-72 w-full overflow-y-auto rounded-sm border border-white/10 bg-(--bg-elevated) py-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition",
                    active
                      ? "bg-(--gold)/15 text-gold"
                      : "text-cream hover:bg-white/10",
                  )}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
