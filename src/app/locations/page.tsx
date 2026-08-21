import type { Metadata } from "next";
import { LocationsShowcase } from "@/components/locations/LocationsShowcase";

export const metadata: Metadata = {
  title: "Locations",
  description: "Find Sam's Discount Liquor stores on the map — inventory, pickup, and delivery by branch.",
};

export default function LocationsPage() {
  return <LocationsShowcase />;
}
