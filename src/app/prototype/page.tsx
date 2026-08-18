import type { Metadata } from "next";
import { PrototypePresentation } from "@/components/prototype/PrototypePresentation";
import { SITE } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Prototype R&D & Phases",
  description: `Research findings, prototype scope, and Phase 1–3 plan for ${SITE.name} immersive commerce.`,
  robots: { index: false, follow: false },
};

export default function PrototypePage() {
  return <PrototypePresentation />;
}
