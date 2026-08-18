import type { Metadata } from "next";
import { SmartImage } from "@/components/ui/SmartImage";
import Link from "next/link";
import { getAllEvents } from "@/data/events";
import { getAllLocations } from "@/data/locations";
import { formatPrice } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EventSeatCount } from "@/components/events/EventSeatCount";

export const metadata: Metadata = {
  title: "Events",
  description: "Wine tastings, whiskey evenings, launches, and festivals at Sam's Discount Liquor.",
};

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4 sm:py-14 md:px-8 md:py-16">
      <SectionHeading
        eyebrow="Calendar"
        title="Upcoming experiences"
        description="Book seats for tastings, launches, and festivals across our stores."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {getAllEvents().map((ev) => {
          const loc = getAllLocations().find((l) => l.id === ev.locationId);
          return (
            <Link
              key={ev.id}
              href={`/events/${ev.slug}`}
              className="group overflow-hidden border border-white/5"
            >
              <div className="relative h-44 sm:h-52">
                <SmartImage
                  src={ev.image}
                  alt={ev.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width:768px) 100vw, 50vw"
                />
              </div>
              <div className="p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  {ev.type.replace("-", " ")} · {ev.date}
                </p>
                <h2 className="mt-2 font-display text-2xl text-cream">{ev.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{ev.description}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-muted">{loc?.shortName}</span>
                  <span className="text-gold">
                    {formatPrice(ev.price)} ·{" "}
                    <EventSeatCount eventId={ev.id} seatsTotal={ev.seatsTotal} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
