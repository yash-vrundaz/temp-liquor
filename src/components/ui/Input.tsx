import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full min-h-11 rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-base text-[var(--cream)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--gold)]/50 focus:bg-white/[0.07] sm:min-h-10 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
});
