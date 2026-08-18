"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { View, Maximize2, RotateCcw, Box } from "lucide-react";
import Link from "next/link";

const BottleViewer3D = dynamic(
  () => import("@/components/store/BottleViewer3D").then((m) => m.BottleViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0a0908] text-sm uppercase tracking-[0.2em] text-gold">
        Loading 3D bottle…
      </div>
    ),
  },
);

/**
 * AR page: interactive 3D bottle + native phone AR via model-viewer.
 * Uses R3F BottleMesh for on-screen preview (stable), model-viewer for AR placement.
 */
export function ARViewer({ product }: { product: Product }) {
  const [mode, setMode] = useState<"3d" | "ar">("3d");
  const [mvReady, setMvReady] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const glbUrl = product.glbUrl ?? `/models/bottles/${product.slug}.glb`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await import("@google/model-viewer");
        if (!cancelled) setMvReady(true);
      } catch (e) {
        console.error("model-viewer failed to load", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mvReady || !ref.current) return;
    const el = ref.current as HTMLElement & { canActivateAR?: boolean };
    const check = () => setArSupported(Boolean(el.canActivateAR));
    check();
    el.addEventListener("load", check);
    return () => el.removeEventListener("load", check);
  }, [mvReady, glbUrl, mode]);

  const activateAR = () => {
    setMode("ar");
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = ref.current as HTMLElement & { activateAR?: () => void };
        el?.activateAR?.();
      }, 350);
    });
  };

  return (
    <div className="relative overflow-hidden rounded-sm border border-(--border) bg-[#0a0908]">
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 bg-[#0a0908]/95 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-wrap gap-2">
          <span className="glass-gold px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-gold sm:px-3 sm:tracking-[0.2em]">
            <span className="sm:hidden">3D bottle</span>
            <span className="hidden sm:inline">Interactive 3D bottle</span>
          </span>
          {arSupported && (
            <span className="border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-300 sm:px-3">
              <span className="sm:hidden">AR ready</span>
              <span className="hidden sm:inline">Device AR available</span>
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setMode("3d")}
            className={`px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
              mode === "3d"
                ? "bg-gold text-black"
                : "border border-white/10 text-muted"
            }`}
          >
            3D
          </button>
          <button
            type="button"
            onClick={() => setMode("ar")}
            className={`px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
              mode === "ar"
                ? "bg-gold text-black"
                : "border border-white/10 text-muted"
            }`}
          >
            AR
          </button>
        </div>
      </div>

      <div className="relative h-[min(55vh,360px)] w-full bg-[#0a0908] sm:h-105 md:h-140">
        {mode === "3d" ? (
          <BottleViewer3D key={viewerKey} product={product} className="h-full w-full" />
        ) : mvReady ? (
          <model-viewer
            ref={ref as React.RefObject<HTMLElement>}
            src={glbUrl}
            alt={`3D model of ${product.name}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            camera-controls
            touch-action="pan-y"
            auto-rotate
            shadow-intensity="1"
            exposure="1.15"
            environment-image="neutral"
            style={{
              width: "100%",
              height: "100%",
              background: "#0a0908",
              display: "block",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Preparing AR model…
          </div>
        )}

        {/* Keep a hidden model-viewer mounted for AR button when in 3D mode */}
        {mode === "3d" && mvReady && (
          <model-viewer
            ref={ref as React.RefObject<HTMLElement>}
            src={glbUrl}
            alt=""
            ar
            ar-modes="webxr scene-viewer quick-look"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <p className="font-display text-lg text-cream wrap-break-word sm:text-xl">
            {product.name}
          </p>
          <p className="text-xs text-muted">
            {product.brand} · Drag to rotate · Phone AR via View in Your Space
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button className="w-full sm:w-auto" onClick={activateAR} disabled={!mvReady}>
            <View size={16} /> View in Your Space
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant="secondary"
            onClick={() => {
              if (mode === "3d") setViewerKey((k) => k + 1);
              else {
                const el = ref.current as HTMLElement & { cameraOrbit?: string };
                if (el) el.cameraOrbit = "0deg 75deg 105%";
              }
            }}
          >
            <RotateCcw size={16} /> Reset
          </Button>
          <Link href={`/products/${product.slug}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto" variant="ghost">
              <Maximize2 size={16} /> Details
            </Button>
          </Link>
        </div>
      </div>
      <p className="flex items-center gap-2 px-4 pb-4 text-[11px] text-muted">
        <Box size={12} className="text-gold" />
        3D tab = studio bottle. AR model tab = GLB for phone placement.
      </p>
    </div>
  );
}
