"use client";

import dynamic from "next/dynamic";

const VirtualStoreExperience = dynamic(
  () =>
    import("@/components/store/VirtualStoreExperience").then(
      (m) => m.VirtualStoreExperience,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100dvh-5rem)] flex-col items-center justify-center gap-3 bg-[#1a1510]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--gold)/30 border-t-gold" />
        <p className="text-sm uppercase tracking-[0.2em] text-gold">
          Opening showroom
        </p>
      </div>
    ),
  },
);

export function VirtualStoreClient() {
  return <VirtualStoreExperience />;
}
