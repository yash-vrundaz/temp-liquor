"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Error</p>
      <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">Something went wrong</h1>
      <p className="mt-4 text-sm text-muted sm:text-base">
        The page failed to load. Try again, or return to the shop.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.assign("/")}>
          Return home
        </Button>
      </div>
    </div>
  );
}
