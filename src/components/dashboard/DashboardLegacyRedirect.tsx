"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { legacyTabToPath } from "@/lib/dashboard/routes";

/** Redirects legacy `/dashboard?tab=…` URLs to dedicated paths. */
export function DashboardLegacyRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/dashboard" && !pathname.startsWith("/dashboard")) return;
    const tab = searchParams.get("tab");
    if (!tab) return;
    const next = legacyTabToPath(tab, searchParams);
    if (next) router.replace(next);
  }, [pathname, router, searchParams]);

  return null;
}
