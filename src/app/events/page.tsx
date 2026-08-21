import type { Metadata } from "next";
import { EventsListing } from "@/components/events/EventsListing";

export const metadata: Metadata = {
  title: "Events",
  description: "Wine tastings, whiskey evenings, launches, and festivals at Sam's Discount Liquor.",
};

export default function EventsPage() {
  return <EventsListing />;
}
