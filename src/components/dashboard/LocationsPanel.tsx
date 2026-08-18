"use client";

import { FormEvent, useMemo, useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { getAllLocations } from "@/data/locations";
import {
  apiCreateLocation,
  apiDeleteLocation,
  apiPatchLocation,
} from "@/lib/api-mutations";
import { hasPermission } from "@/lib/auth/permissions";
import { accessibleLocations } from "@/lib/auth/location-access";
import {
  removeRuntimeLocation,
  upsertRuntimeLocation,
} from "@/lib/runtime-data";
import { useUserStore } from "@/store/user";
import type { StoreLocation } from "@/types";
import { Button } from "@/components/ui/Button";
import { CoverImageUpload, GalleryImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { compareValues, MobileSortBar, SortableTh, tableCellClass, tableHeadRowClass, tableRowClass, tableWrapClass, useTableSort } from "@/components/ui/SortableTh";

type LocationForm = {
  name: string;
  shortName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  description: string;
  heroImage: string;
  gallery: string[];
};

const emptyForm = (): LocationForm => ({
  name: "",
  shortName: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  email: "",
  description: "",
  heroImage: "",
  gallery: [],
});

export function LocationsPanel() {
  const actor = useUserStore((s) => s.profile);
  const [tick, setTick] = useState(0);
  const locations = useMemo(
    () => accessibleLocations(actor, getAllLocations()),
    [actor, tick],
  );
  const { sortKey, sortDir, toggleSort } = useTableSort<"store" | "address" | "contact">("store");
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      if (sortKey === "address") {
        return compareValues(
          `${a.city} ${a.address}`,
          `${b.city} ${b.address}`,
          sortDir,
        );
      }
      if (sortKey === "contact") return compareValues(a.email, b.email, sortDir);
      return compareValues(a.shortName, b.shortName, sortDir);
    });
  }, [locations, sortDir, sortKey]);
  const [editing, setEditing] = useState<StoreLocation | "new" | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCreate = hasPermission(actor, "locations.create");
  const canEdit = hasPermission(actor, "locations.edit");
  const canDelete = hasPermission(actor, "locations.delete");

  const openCreate = () => {
    setForm(emptyForm());
    setError("");
    setEditing("new");
  };

  const openEdit = (location: StoreLocation) => {
    setForm({
      name: location.name,
      shortName: location.shortName,
      address: location.address,
      city: location.city,
      state: location.state,
      zip: location.zip,
      phone: location.phone,
      email: location.email,
      description: location.description,
      heroImage: location.heroImage,
      gallery: location.gallery.filter((url) => url !== location.heroImage),
    });
    setError("");
    setEditing(location);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing === "new") {
        const { location } = await apiCreateLocation(form);
        upsertRuntimeLocation(location);
      } else if (editing) {
        const { location } = await apiPatchLocation(editing.id, form);
        upsertRuntimeLocation(location);
      }
      setEditing(null);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save store.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (location: StoreLocation) => {
    if (!window.confirm(`Remove ${location.shortName}? Events at this store will also be deleted.`)) {
      return;
    }
    setError("");
    try {
      await apiDeleteLocation(location.id);
      removeRuntimeLocation(location.id);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove store.");
    }
  };

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-cream sm:text-3xl">Locations</h2>
          <p className="mt-1 text-sm text-muted">Add or remove stores. Staff can be limited to specific locations from Users.</p>
        </div>
        {canCreate ? (
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} />
            Add store
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <MobileSortBar
        className="mt-5 md:hidden"
        columns={[
          { key: "store", label: "Store" },
          { key: "address", label: "Address" },
          { key: "contact", label: "Contact" },
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
      />
      <ul className="mt-3 divide-y divide-white/10 border border-white/10 md:hidden">
        {sortedLocations.map((location) => (
          <li key={location.id} className="p-4">
            <div className="flex items-start gap-3">
              {location.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={location.heroImage} alt="" className="h-14 w-20 shrink-0 object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-cream">{location.shortName}</p>
                <p className="text-xs text-muted">{location.name}</p>
                <p className="mt-2 text-xs text-muted">
                  {location.address}, {location.city} {location.state} {location.zip}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {location.phone} · {location.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button size="sm" variant="ghost" className="h-9 px-2.5" onClick={() => openEdit(location)}>
                      <Pencil size={13} />
                      Edit
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button size="sm" variant="secondary" className="h-9 px-2.5" onClick={() => void remove(location)}>
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
      {locations.length === 0 ? (
        <div className="mt-3 border border-white/10 px-4 py-14 text-center text-sm text-muted md:hidden">
          <MapPin className="mx-auto mb-3 text-gold/70" size={28} />
          No stores assigned to this account.
        </div>
      ) : null}

      <div className={`mt-5 hidden md:block ${tableWrapClass}`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <SortableTh label="Store" column="store" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Address" column="address" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Contact" column="contact" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLocations.map((location) => (
              <tr key={location.id} className={tableRowClass}>
                <td className={tableCellClass}>
                  <div className="flex items-center gap-3">
                    {location.heroImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={location.heroImage} alt="" className="h-10 w-14 shrink-0 object-cover" />
                    ) : null}
                    <div>
                      <p className="font-medium text-cream">{location.shortName}</p>
                      <p className="text-xs text-muted">{location.name}</p>
                    </div>
                  </div>
                </td>
                <td className={`${tableCellClass} text-xs text-muted`}>
                  <p>{location.address}</p>
                  <p>
                    {location.city}, {location.state} {location.zip}
                  </p>
                </td>
                <td className={`${tableCellClass} text-xs text-muted`}>
                  <p>{location.phone}</p>
                  <p>{location.email}</p>
                </td>
                <td className={tableCellClass}>
                  <div className="flex flex-nowrap justify-end gap-2">
                    {canEdit ? (
                      <Button size="sm" variant="ghost" className="h-8 px-2.5" onClick={() => openEdit(location)}>
                        <Pencil size={13} />
                        Edit
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button size="sm" variant="secondary" className="h-8 px-2.5" onClick={() => void remove(location)}>
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
        {locations.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-muted">
            <MapPin className="mx-auto mb-3 text-gold/70" size={28} />
            No stores assigned to this account.
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add store" : "Edit store"}
        subtitle="This location appears in pickup, inventory, and events."
        className="sm:max-w-xl"
      >
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <CoverImageUpload
            className="sm:col-span-2"
            label="Cover image"
            hint="Hero photo on the store page. JPG or PNG."
            value={form.heroImage}
            onChange={(heroImage) => setForm((f) => ({ ...f, heroImage }))}
          />
          <GalleryImageUpload
            className="sm:col-span-2"
            label="Interior gallery"
            hint="Extra photos for the location page. Up to 6."
            value={form.gallery}
            onChange={(gallery) => setForm((f) => ({ ...f, gallery }))}
            max={6}
          />
          <label className="block text-xs text-muted sm:col-span-2">
            Full name
            <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            Short name
            <Input className="mt-1" value={form.shortName} onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            Phone
            <Input className="mt-1" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted sm:col-span-2">
            Address
            <Input className="mt-1" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            City
            <Input className="mt-1" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            State
            <Input className="mt-1" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            ZIP
            <Input className="mt-1" value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted">
            Email
            <Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </label>
          <label className="block text-xs text-muted sm:col-span-2">
            Description
            <textarea
              className="mt-1 min-h-[88px] w-full rounded-sm border border-white/10 bg-(--bg-elevated) px-3 py-2 text-sm text-cream outline-none"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
          <div className="modal-actions border-t border-white/10 pt-4 sm:col-span-2">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
              {busy ? "Saving…" : "Save store"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
