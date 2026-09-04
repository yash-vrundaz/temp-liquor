import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { DashboardGate } from "@/components/dashboard/DashboardGate";
import { DashboardLegacyRedirect } from "@/components/dashboard/DashboardLegacyRedirect";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { MemberDashboard } from "@/components/dashboard/MemberDashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardGate>
      <Suspense fallback={<DashboardLoading label="Loading dashboard…" />}>
        <DashboardLegacyRedirect />
        <MemberDashboard />
        {/* Route pages register URLs; shell reads pathname and stays mounted. */}
        <div className="hidden" aria-hidden>
          {children}
        </div>
      </Suspense>
    </DashboardGate>
  );
}
