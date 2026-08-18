"use client";

import { useInventoryStore } from "@/store/inventory";

export function EventSeatCount({
  eventId,
  seatsTotal,
}: {
  eventId: string;
  seatsTotal: number;
}) {
  const seats = useInventoryStore((s) => s.getSeats(eventId));
  return (
    <>
      {seats}/{seatsTotal} seats
    </>
  );
}
