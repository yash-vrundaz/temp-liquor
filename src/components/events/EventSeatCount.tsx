"use client";

import { useLiveSeats } from "@/hooks/useHydratedInventory";

export function EventSeatCount({
  eventId,
  seatsTotal,
}: {
  eventId: string;
  seatsTotal: number;
}) {
  const seats = useLiveSeats(eventId);
  return (
    <>
      {seats}/{seatsTotal} seats
    </>
  );
}
