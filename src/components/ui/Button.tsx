import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[#8a7340] via-[#c9a962] to-[#e4c878] text-[#0a0a0a] font-medium hover:brightness-110 shadow-[0_0_30px_rgba(201,169,98,0.25)]",
  secondary:
    "bg-white/5 text-[var(--cream)] border border-white/10 hover:bg-white/10 hover:border-[var(--gold)]/40",
  ghost: "bg-transparent text-[var(--cream)] hover:bg-white/5",
  outline:
    "border border-[var(--gold)]/50 text-[var(--gold)] hover:bg-[var(--gold)]/10",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 py-1.5 text-xs tracking-wide",
  md: "min-h-11 px-5 py-2.5 text-sm tracking-wide sm:min-h-10",
  lg: "min-h-12 px-5 py-3.5 text-sm tracking-[0.12em] uppercase sm:px-8",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex max-w-full items-center justify-center gap-2 rounded-sm touch-manipulation transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
