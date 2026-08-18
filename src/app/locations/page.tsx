import type { Metadata } from "next";
import { LocationsShowcase } from "@/components/locations/LocationsShowcase";

export const metadata: Metadata = {
  title: "Locations",
  description: "Visit Sam's Discount Liquor Downtown, Waterfront, and Uptown locations.",
};

export default function LocationsPage() {
  return <LocationsShowcase />;
}
