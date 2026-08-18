import type { Metadata } from "next";
import { UnavailablePage } from "@/components/ui/UnavailablePage";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <UnavailablePage />;
}
