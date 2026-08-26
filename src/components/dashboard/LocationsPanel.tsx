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
import { accessibleLocations, hasAllLocationAccess } from "@/lib/auth/location-access";
import {
  isDbConnected,
  removeRuntimeLocation,
  upsertRuntimeLocation,
} from "@/lib/runtime-data";
import { useUserStore } from "@/store/user";
import type { StoreLocation } from "@/types";
import { Button } from "@/components/ui/Button";
import { CoverImageUpload, GalleryImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConnectionNotice } from "@/components/dashboard/ConnectionNotice";
import { compareValues, MobileSortBar, SortableTh, tableCellClass, tableHeadRowClass, tableRowClass, tableWrapClass, useTableSort } from "@/components/ui/SortableTh";
import { formatDeliveryPricingSummary } from "@/lib/fulfillment-pricing";

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
  parking: string;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  deliveryRadiusKm: string;
  deliveryFee: string;
  deliveryFreeMinimum: string;
  taxRatePercent: string;
  lat: string;
  lng: string;
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
  parking: "",
  pickupAvailable: true,
  deliveryAvailable: true,
  deliveryRadiusKm: "8",
  deliveryFee: "12.5",
  deliveryFreeMinimum: "150",
  taxRatePercent: "8.875",
  lat: "",
  lng: "",
  heroImage: "",
  gallery: [],
});

function validateLocationForm(form: LocationForm) {
  if (form.name.trim().length < 2) return "Enter the full store name.";
  if (form.shortName.trim().length < 2) return "Enter a short name.";
  if (form.address.trim().length < 3) return "Enter a street address.";
  if (form.city.trim().length < 2) return "Enter a city.";
  if (form.state.trim().length < 2) return "Enter a state.";
  if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) return "Enter a valid ZIP code.";
  if (form.phone.trim().length < 7) return "Enter a phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email.";
  const radius = Number(form.deliveryRadiusKm);
  if (form.deliveryRadiusKm.trim() && (!Number.isFinite(radius) || radius < 0 || radius > 200)) {
    return "Delivery radius must be between 0 and 200 km.";
  }
  const deliveryFee = Number(form.deliveryFee);
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || deliveryFee > 500) {
    return "Delivery fee must be between $0 and $500.";
  }
  const deliveryFreeMinimum = Number(form.deliveryFreeMinimum);
  if (!Number.isFinite(deliveryFreeMinimum) || deliveryFreeMinimum < 0 || deliveryFreeMinimum > 10000) {
    return "Free delivery minimum must be between $0 and $10,000.";
  }
  const taxRatePercent = Number(form.taxRatePercent);
  if (!Number.isFinite(taxRatePercent) || taxRatePercent < 0 || taxRatePercent > 25) {
    return "Tax rate must be between 0% and 25%.";
  }
  if (form.lat.trim()) {
    const lat = Number(form.lat);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return "Latitude must be between -90 and 90.";
  }
  if (form.lng.trim()) {
    const lng = Number(form.lng);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return "Longitude must be between -180 and 180.";
    }
  }
  return null;
}

function toLocationPayload(form: LocationForm) {
  const radius = Number(form.deliveryRadiusKm);
  const lat = form.lat.trim() ? Number(form.lat) : undefined;
  const lng = form.lng.trim() ? Number(form.lng) : undefined;
  const taxRatePercent = Number(form.taxRatePercent);
  return {
    name: form.name.trim(),
    shortName: form.shortName.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    zip: form.zip.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    description: form.description.trim(),
    parking: form.parking.trim(),
    pickupAvailable: form.pickupAvailable,
    deliveryAvailable: form.deliveryAvailable,
    deliveryRadiusKm: Number.isFinite(radius) ? radius : 8,
    deliveryFee: Number(form.deliveryFee),
    deliveryFreeMinimum: Number(form.deliveryFreeMinimum),
    taxRate: Number.isFinite(taxRatePercent) ? taxRatePercent / 100 : 0.08875,
    heroImage: form.heroImage.trim(),
    gallery: form.gallery,
    ...(lat != null && Number.isFinite(lat) ? { lat } : {}),
    ...(lng != null && Number.isFinite(lng) ? { lng } : {}),
  };
}

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
  const dbReady = isDbConnected();
  const canCreate = hasPermission(actor, "locations.create") && dbReady;
  const canEdit = hasPermission(actor, "locations.edit") && dbReady;
  const canDelete = hasPermission(actor, "locations.delete") && dbReady;

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
      parking: location.parking ?? "",
      pickupAvailable: location.pickupAvailable,
      deliveryAvailable: location.deliveryAvailable,
      deliveryRadiusKm: String(location.deliveryRadiusKm ?? 8),
      deliveryFee: String(location.deliveryFee ?? 12.5),
      deliveryFreeMinimum: String(location.deliveryFreeMinimum ?? 150),
      taxRatePercent: String(Number(((location.taxRate ?? 0.08875) * 100).toFixed(3))),
      lat: location.lat != null ? String(location.lat) : "",
      lng: location.lng != null ? String(location.lng) : "",
      heroImage: location.heroImage,
      gallery: location.gallery.filter((url) => url !== location.heroImage),
    });
    setError("");
    setEditing(location);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateLocationForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = toLocationPayload(form);
      if (editing === "new") {
        const { location } = await apiCreateLocation(payload);
        upsertRuntimeLocation(location);
        // Keep scoped accounts able to see the store they just created.
        if (!hasAllLocationAccess(actor) && actor.allowedLocationIds?.length) {
          const next = [...new Set([...actor.allowedLocationIds, location.id])];
          useUserStore.setState((state) => ({
            profile: { ...state.profile, allowedLocationIds: next },
          }));
        }
      } else if (editing) {
        const { location } = await apiPatchLocation(editing.id, payload);
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
    setBusy(true);
    setError("");
    try {
      await apiDeleteLocation(location.id);
      removeRuntimeLocation(location.id);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove store.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-cream sm:text-3xl">Locations</h2>
          <p className="mt-1 text-sm text-muted">Add or remove stores. Set delivery fees, free-delivery thresholds, and tax per location.</p>
        </div>
        {canCreate ? (
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} />
            Add store
          </Button>
        ) : null}
      </div>
      {!dbReady ? (
        <ConnectionNotice className="mt-4" feature="add or edit stores" preview />
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <MobileSortBar
        className="mt-5 lg:hidden"
        columns={[
          { key: "store", label: "Store" },
          { key: "address", label: "Address" },
          { key: "contact", label: "Contact" },
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
      />
      <ul className="mt-3 divide-y divide-white/10 border border-white/10 lg:hidden">
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
                <p className="mt-2 text-[11px] text-gold">{formatDeliveryPricingSummary(location)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button size="sm" variant="ghost" className="h-9 px-2.5" onClick={() => openEdit(location)}>
                      <Pencil size={13} />
                      Edit
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 px-2.5"
                      onClick={() => void remove(location)}
                      disabled={busy}
                    >
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
        <div className="mt-3 border border-white/10 px-4 py-14 text-center text-sm text-muted lg:hidden">
          <MapPin className="mx-auto mb-3 text-gold/70" size={28} />
          No stores assigned to this account.
        </div>
      ) : null}

      <div className={`mt-5 hidden lg:block ${tableWrapClass}`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <SortableTh label="Store" column="store" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh label="Address" column="address" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 font-medium">Delivery & tax</th>
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
                <td className={`${tableCellClass} text-xs`}>
                  <p className="text-gold">{formatDeliveryPricingSummary(location)}</p>
                  <p className="mt-1 text-muted">
                    {location.deliveryAvailable
                      ? `${location.deliveryRadiusKm} km radius`
                      : "Delivery disabled"}
                  </p>
                  <p className="mt-1 text-muted">
                    Tax {(location.taxRate * 100).toFixed(3).replace(/\.?0+$/, "")}%
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
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-2.5"
                        onClick={() => void remove(location)}
                        disabled={busy}
                      >
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
        className="sm:max-w-2xl"
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
            hint="Extra photos for the location page. Up to 8."
            value={form.gallery}
            onChange={(gallery) => setForm((f) => ({ ...f, gallery }))}
            max={8}
          />
          <label className="block text-xs text-muted sm:col-span-2">
            Full name
            <Input
              className="mt-1"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              minLength={2}
            />
          </label>
          <label className="block text-xs text-muted">
            Short name
            <Input
              className="mt-1"
              value={form.shortName}
              onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
              required
              minLength={2}
            />
          </label>
          <label className="block text-xs text-muted">
            Phone
            <Input
              className="mt-1"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
              minLength={7}
            />
          </label>
          <label className="block text-xs text-muted sm:col-span-2">
            Address
            <Input
              className="mt-1"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              required
              minLength={3}
            />
          </label>
          <label className="block text-xs text-muted">
            City
            <Input
              className="mt-1"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              required
              minLength={2}
            />
          </label>
          <label className="block text-xs text-muted">
            State
            <Input
              className="mt-1"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              required
              minLength={2}
            />
          </label>
          <label className="block text-xs text-muted">
            ZIP
            <Input
              className="mt-1"
              value={form.zip}
              onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
              required
              pattern="\d{5}(-\d{4})?"
            />
          </label>
          <label className="block text-xs text-muted">
            Email
            <Input
              className="mt-1"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </label>
          <label className="block text-xs text-muted sm:col-span-2">
            Parking notes
            <Input
              className="mt-1"
              value={form.parking}
              onChange={(e) => setForm((f) => ({ ...f, parking: e.target.value }))}
              placeholder="Street parking nearby"
            />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-cream sm:col-span-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-(--gold)"
              checked={form.pickupAvailable}
              onChange={(e) => setForm((f) => ({ ...f, pickupAvailable: e.target.checked }))}
            />
            Pickup available at this store
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-cream sm:col-span-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-(--gold)"
              checked={form.deliveryAvailable}
              onChange={(e) => setForm((f) => ({ ...f, deliveryAvailable: e.target.checked }))}
            />
            Delivery available from this store
          </label>

          <div className="sm:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Delivery & pricing</p>
            <p className="mt-1 text-xs text-muted">
              Cart, checkout, and orders use these rates for this store only.
            </p>
          </div>
          <label className="block text-xs text-muted">
            Delivery fee ($)
            <Input
              className="mt-1"
              type="number"
              min={0}
              max={500}
              step={0.01}
              value={form.deliveryFee}
              disabled={!form.deliveryAvailable}
              onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))}
            />
          </label>
          <label className="block text-xs text-muted">
            Free delivery over ($)
            <Input
              className="mt-1"
              type="number"
              min={0}
              max={10000}
              step={1}
              value={form.deliveryFreeMinimum}
              disabled={!form.deliveryAvailable}
              onChange={(e) => setForm((f) => ({ ...f, deliveryFreeMinimum: e.target.value }))}
            />
            <span className="mt-1 block text-[10px] text-muted/80">Use 0 if delivery is never free.</span>
          </label>
          <label className="block text-xs text-muted">
            Tax rate (%)
            <Input
              className="mt-1"
              type="number"
              min={0}
              max={25}
              step={0.001}
              value={form.taxRatePercent}
              onChange={(e) => setForm((f) => ({ ...f, taxRatePercent: e.target.value }))}
            />
          </label>
          <label className="block text-xs text-muted">
            Delivery radius (km)
            <Input
              className="mt-1"
              type="number"
              min={0}
              max={200}
              step={0.5}
              value={form.deliveryRadiusKm}
              disabled={!form.deliveryAvailable}
              onChange={(e) => setForm((f) => ({ ...f, deliveryRadiusKm: e.target.value }))}
            />
          </label>
          <label className="block text-xs text-muted">
            Latitude
            <Input
              className="mt-1"
              type="number"
              step="any"
              min={-90}
              max={90}
              value={form.lat}
              onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
              placeholder="40.7209"
            />
            <span className="mt-1 block text-[10px] text-muted/80">Used for the public map pin. Defaults to NYC if blank.</span>
          </label>
          <label className="block text-xs text-muted">
            Longitude
            <Input
              className="mt-1"
              type="number"
              step="any"
              min={-180}
              max={180}
              value={form.lng}
              onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
              placeholder="-74.0007"
            />
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
