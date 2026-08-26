"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { clearAgeVerified, readAgeVerified, setAgeVerified } from "@/lib/age-gate";
import { SITE } from "@/lib/utils";

export function AgeGate() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setVerified(readAgeVerified());
    setReady(true);
  }, []);

  if (!ready) return null;
  if (pathname === "/prototype" || pathname.startsWith("/prototype/")) return null;
  if (verified) return null;

  const enter = () => {
    setAgeVerified();
    setVerified(true);
    setBlocked(false);
  };

  const exit = () => {
    clearAgeVerified();
    setBlocked(true);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/90 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="w-full max-w-lg border border-white/10 bg-(--bg-elevated) px-5 py-8 sm:px-8 sm:py-10">
        {blocked ? (
          <>
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Restricted</p>
            <h2 id="age-gate-title" className="mt-3 font-display text-3xl text-cream sm:text-4xl">
              You must be 21 or older
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {SITE.name} sells alcoholic beverages. Access is limited to adults of legal drinking age
              in the United States.
            </p>
            <Button className="mt-8 w-full" variant="secondary" onClick={() => setBlocked(false)}>
              I made a mistake
            </Button>
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Age verification</p>
            <h2 id="age-gate-title" className="mt-3 font-display text-3xl text-cream sm:text-4xl">
              Are you 21 or older?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              You must be of legal drinking age to enter this store, browse bottles, or place an order.
              Please drink responsibly.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="w-full sm:flex-1" onClick={enter}>
                I am 21+
              </Button>
              <Button className="w-full sm:flex-1" variant="secondary" onClick={exit}>
                I am under 21
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
