"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type { StoreLocation } from "@/types";
import { cn } from "@/lib/utils";

type LocationsMapProps = {
  locations: StoreLocation[];
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  onSelect: (id: string) => void;
  className?: string;
};

const DEFAULT_CENTER: [number, number] = [40.735, -74.0];
const DEFAULT_ZOOM = 12;

function markerHtml(label: string, hot: boolean) {
  const border = hot ? "rgba(232,201,122,0.85)" : "rgba(201,168,76,0.45)";
  const diamond = hot ? "var(--gold-bright, #e8c97a)" : "var(--gold, #c9a84c)";
  const glow = hot ? "0 0 18px rgba(232,201,122,0.7)" : "0 0 10px rgba(201,168,76,0.35)";
  const safe = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
      <span style="
        margin-bottom:4px;padding:2px 8px;white-space:nowrap;
        font-family:Georgia,'Times New Roman',serif;font-size:12px;color:#f5f0e6;
        background:rgba(7,7,7,0.88);box-shadow:inset 0 0 0 1px ${border};
      ">${safe}</span>
      <span style="
        display:block;width:12px;height:12px;transform:rotate(45deg);
        background:${diamond};box-shadow:${glow};
      "></span>
    </div>
  `;
}

function locationSignature(locations: StoreLocation[]) {
  return locations
    .map((loc) => `${loc.id}:${loc.lat}:${loc.lng}:${loc.shortName}`)
    .sort()
    .join("|");
}

export function LocationsMap({
  locations,
  activeId,
  onActiveChange,
  onSelect,
  className,
}: LocationsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const callbacksRef = useRef({ onActiveChange, onSelect });
  const [ready, setReady] = useState(false);
  callbacksRef.current = { onActiveChange, onSelect };

  const mappable = useMemo(
    () =>
      locations.filter(
        (loc) =>
          Number.isFinite(loc.lat) &&
          Number.isFinite(loc.lng) &&
          !(loc.lat === 0 && loc.lng === 0),
      ),
    [locations],
  );
  const signature = locationSignature(mappable);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;
      // Default marker icon paths break under bundlers — we only use DivIcon.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    }

    void init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
      setReady(false);
    };
  }, []);

  // Rebuild markers + fit bounds when stores are added, removed, or moved
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!ready || !map || !L) return;

    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    for (const loc of mappable) {
      const icon = L.divIcon({
        className: "sams-map-pin",
        html: markerHtml(loc.shortName, false),
        iconSize: [120, 44],
        iconAnchor: [60, 44],
      });
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);
      marker.on("click", () => callbacksRef.current.onSelect(loc.id));
      marker.on("mouseover", () => callbacksRef.current.onActiveChange(loc.id));
      marker.on("mouseout", () => callbacksRef.current.onActiveChange(null));
      markersRef.current.set(loc.id, marker);
    }

    if (mappable.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (mappable.length === 1) {
      map.setView([mappable[0].lat, mappable[0].lng], 14, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(mappable.map((loc) => [loc.lat, loc.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.28), { animate: true, maxZoom: 14 });
    requestAnimationFrame(() => map.invalidateSize());
  }, [signature, mappable, ready]);

  // Refresh pin styles + pan when highlight changes
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!ready || !map || !L) return;

    for (const loc of mappable) {
      const marker = markersRef.current.get(loc.id);
      if (!marker) continue;
      marker.setIcon(
        L.divIcon({
          className: "sams-map-pin",
          html: markerHtml(loc.shortName, activeId === loc.id),
          iconSize: [120, 44],
          iconAnchor: [60, 44],
        }),
      );
    }

    if (!activeId) return;
    const loc = mappable.find((item) => item.id === activeId);
    if (loc) map.panTo([loc.lat, loc.lng], { animate: true });
  }, [activeId, mappable, ready]);

  return (
    <div className={cn("locations-map relative overflow-hidden", className)}>
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full bg-[#0c0b09]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, transparent 28%, rgba(5,5,5,0.45) 100%), linear-gradient(to bottom, rgba(5,5,5,0.25) 0%, transparent 16%, transparent 62%, rgba(5,5,5,0.55) 100%)",
        }}
      />
      {mappable.length === 0 ? (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-[#0c0b09]/80 px-4 text-center text-sm text-[var(--muted)]">
          No store coordinates yet. Add latitude and longitude when creating a location.
        </div>
      ) : null}
    </div>
  );
}
