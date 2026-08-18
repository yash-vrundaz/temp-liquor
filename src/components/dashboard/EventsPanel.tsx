"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { getAllEvents } from "@/data/events";
import { getAllLocations, getLocationById } from "@/data/locations";
import {
  apiCreateEvent,
  apiDeleteEvent,
  apiPatchEvent,
} from "@/lib/api-mutations";
import { hasPermission } from "@/lib/auth/permissions";
import { accessibleLocations, canAccessLocation } from "@/lib/auth/location-access";
import { removeRuntimeEvent, upsertRuntimeEvent } from "@/lib/runtime-data";
import { useUserStore } from "@/store/user";
import type { EventItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { CoverImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { compareValues, MobileSortBar, SortableTh, tableCellClass, tableHeadRowClass, tableRowClass, tableWrapClass, useTableSort } from "@/components/ui/SortableTh";
import { formatPrice } from "@/lib/utils";

const EVENT_TYPES: { value: EventItem["type"]; label: string }[] = [
  { value: "wine-tasting", label: "Wine tasting" },
  { value: "whiskey-tasting", label: "Whiskey tasting" },
  { value: "launch", label: "Launch" },
  { value: "festival", label: "Festival" },
];

type EventForm = {
  title: string;
  type: EventItem["type"];
  description: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: string;
  seatsTotal: string;
  hosts: string;
  image: string;
};

export function EventsPanel() {
  const actor = useUserStore((s) => s.profile);
  const stores = accessibleLocations(actor, getAllLocations());
  const [tick, setTick] = useState(0);
  const events = useMemo(
    () => getAllEvents().filter((event) => canAccessLocation(actor, event.locationId)),
    [actor, tick],
  );
  const { sortKey, sortDir, toggleSort } = useTableSort<"event" | "store" | "when" | "seats">(
    "when",
    "asc",
  );
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (sortKey === "store") {
        return compareValues(
          getLocationById(a.locationId)?.shortName ?? a.locationId,
          getLocationById(b.locationId)?.shortName ?? b.locationId,
          sortDir,
        );
      }
      if (sortKey === "when") {
        return compareValues(`${a.date} ${a.startTime}`, `${b.date} ${b.startTime}`, sortDir);
      }
      if (sortKey === "seats") return compareValues(a.seatsAvailable, b.seatsAvailable, sortDir);
      return compareValues(a.title, b.title, sortDir);
    });
  }, [events, sortDir, sortKey]);
  const [editing, setEditing] = useState<EventItem | "new" | null>(null);
  const [form, setForm] = useState<EventForm>(() => emptyEventForm(stores[0]?.id ?? ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(actor, "events.create");
  const canEdit = hasPermission(actor, "events.edit");
  const canDelete = hasPermission(actor, "events.delete");

  const openCreate = () => {
    setForm(emptyEventForm(stores[0]?.id ?? ""));
    setError("");
    setEditing("new");
  };

  const openEdit = (event: EventItem) => {
    setForm({
      title: event.title,
      type: event.type,
      description: event.description,
      locationId: event.locationId,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      price: String(event.price),
      seatsTotal: String(event.seatsTotal),
      hosts: event.hosts.join(", "),
      image: event.image,
    });
    setError("");
    setEditing(event);
  };

  const payload = () => ({
    title: form.title,
    type: form.type,
    description: form.description,
    locationId: form.locationId,
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    price: Number(form.price) || 0,
    seatsTotal: Number(form.seatsTotal) || 1,
    hosts: form.hosts
      .split(",")
      .map((host) => host.trim())
      .filter(Boolean),
    image: form.image.trim() || undefined,
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing === "new") {
        const { event: created } = await apiCreateEvent(payload());
        upsertRuntimeEvent(created);
      } else if (editing) {
        const { event: updated } = await apiPatchEvent(editing.id, payload());
        upsertRuntimeEvent(updated);
      }
      setEditing(null);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save event.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (event: EventItem) => {
    if (!window.confirm(`Remove “${event.title}”?`)) return;
    setError("");
    try {
      await apiDeleteEvent(event.id);
      removeRuntimeEvent(event.id);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove event.");
    }
  };

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-cream sm:text-3xl">Events</h2>
          <p className="mt-1 text-sm text-muted">Tastings, launches, and festivals at stores you can access.</p>
        </div>
        {canCreate && stores.length > 0 ? (
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} />
            Add event
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <MobileSortBar
        className="mt-5 md:hidden"
        columns={[
          { key: "event", label: "Event" },
          { key: "store", label: "Store" },
          { key: "when", label: "When" },
          { key: "seats", label: "Seats" },
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
      />
      <ul className="mt-3 divide-y divide-white/10 border border-white/10 md:hidden">
        {sortedEvents.map((event) => (
          <li key={event.id} className="p-4">
            <div className="flex items-start gap-3">
              {event.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.image} alt="" className="h-14 w-20 shrink-0 object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-cream">{event.title}</p>
                <p className="text-xs text-muted">
                  {EVENT_TYPES.find((item) => item.value === event.type)?.label} · {formatPrice(event.price)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {getLocationById(event.locationId)?.shortName ?? event.locationId}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {event.date} · {event.startTime}–{event.endTime} · {event.seatsAvailable}/{event.seatsTotal} seats
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button size="sm" variant="ghost" className="h-9 px-2.5" onClick={() => openEdit(event)}>
                      <Pencil size={13} />
                      Edit
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button size="sm" variant="secondary" className="h-9 px-2.5" onClick={() => void remove(event)}>
                      <Trash2 size={13} />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {events.length === 0 ? (
        <div className="mt-3 border border-white/10 px-4 py-14 text-center text-sm text-muted md:hidden">
          <CalendarDays className="mx-auto mb-3 text-gold/70" size={28} />
          No events for the stores you can access.
        </div>
      ) : null}

      <div className={`mt-5 hidden md:block ${tableWrapClass}`}>
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <SortableTh label="Event" column="event" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Store" column="store" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="When" column="when" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Seats" column="seats" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((event) => (
              <tr key={event.id} className={tableRowClass}>
                <td className={tableCellClass}>
                  <div className="flex items-center gap-3">
                    {event.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.image} alt="" className="h-10 w-14 shrink-0 object-cover" />
                    ) : null}
                    <div>
                      <p className="font-medium text-cream">{event.title}</p>
                      <p className="text-xs text-muted">
                        {EVENT_TYPES.find((item) => item.value === event.type)?.label} · {formatPrice(event.price)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={`${tableCellClass} text-xs text-muted`}>
                  {getLocationById(event.locationId)?.shortName ?? event.locationId}
                </td>
                <td className={`${tableCellClass} text-xs text-muted whitespace-nowrap`}>
                  {event.date} · {event.startTime}–{event.endTime}
                </td>
                <td className={`${tableCellClass} text-xs text-muted`}>
                  {event.seatsAvailable}/{event.seatsTotal}
                </td>
                <td className={tableCellClass}>
                  <div className="flex flex-nowrap justify-end gap-2">
                    {canEdit ? (
                      <Button size="sm" variant="ghost" className="h-8 px-2.5" onClick={() => openEdit(event)}>
                        <Pencil size={13} />
                        Edit
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button size="sm" variant="secondary" className="h-8 px-2.5" onClick={() => void remove(event)}>
                        <Trash2 size={13} />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-muted">
            <CalendarDays className="mx-auto mb-3 text-gold/70" size={28} />
            No events for the stores you can access.
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add event" : "Edit event"}
        subtitle="Published events appear on the public events pages."
        className="sm:max-w-xl"
      >
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <CoverImageUpload
            className="sm:col-span-2"
            label="Event image"
            hint="Shown on the events list and event page. JPG or PNG."
            value={form.image}
            onChange={(image) => setForm((f) => ({ ...f, image }))}
          />
          <label className="block text-xs text-muted sm:col-span-2">
            Title
            <Input className="mt-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            Type
            <div className="mt-1">
              <Select
                value={form.type}
                onChange={(value) => setForm((f) => ({ ...f, type: value as EventItem["type"] }))}
                options={EVENT_TYPES}
              />
            </div>
          </label>
          <label className="block text-xs text-muted">
            Store
            <div className="mt-1">
              <Select
                value={form.locationId}
                onChange={(value) => setForm((f) => ({ ...f, locationId: value }))}
                options={stores.map((store) => ({ value: store.id, label: store.shortName }))}
              />
            </div>
          </label>
          <label className="block text-xs text-muted">
            Date
            <Input className="mt-1" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            Price
            <Input className="mt-1" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            Start
            <Input className="mt-1" type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            End
            <Input className="mt-1" type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            Seats
            <Input className="mt-1" type="number" min={1} value={form.seatsTotal} onChange={(e) => setForm((f) => ({ ...f, seatsTotal: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            Hosts
            <Input className="mt-1" value={form.hosts} onChange={(e) => setForm((f) => ({ ...f, hosts: e.target.value }))} placeholder="Comma separated" />
          </label>
          <label className="block text-xs text-muted sm:col-span-2">
            Description
            <textarea
              className="mt-1 min-h-[88px] w-full rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-2 text-sm text-cream outline-none"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </label>
          {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
          <div className="modal-actions border-t border-white/10 pt-4 sm:col-span-2">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={busy || stores.length === 0}>
              {busy ? "Saving…" : "Save event"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

function emptyEventForm(locationId: string): EventForm {
  return {
    title: "",
    type: "wine-tasting",
    description: "",
    locationId,
    date: new Date().toISOString().slice(0, 10),
    startTime: "18:00",
    endTime: "20:00",
    price: "45",
    seatsTotal: "20",
    hosts: "",
    image: "",
  };
}
