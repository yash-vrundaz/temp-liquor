"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { fileToJpegBlob } from "@/lib/image-file";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

async function uploadImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a JPG, PNG, or WebP image.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Image must be under 8 MB.");
  }
  const blob = await fileToJpegBlob(file);
  const body = new FormData();
  body.append("file", blob, "photo.jpg");
  const res = await fetch("/api/uploads", {
    method: "POST",
    credentials: "same-origin",
    body,
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Could not upload that image.");
  }
  return data.url;
}

type CoverProps = {
  label?: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
  fit?: "cover" | "contain";
};

export function CoverImageUpload({
  label = "Cover image",
  hint = "JPG or PNG. We’ll resize it for the site.",
  value,
  onChange,
  className,
  fit = "cover",
}: CoverProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      setError("");
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that image.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-[11px] text-muted">{hint}</p>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void onPick(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex min-h-36 w-full items-center justify-center overflow-hidden border border-dashed bg-white/[0.03] text-left transition",
          dragOver ? "border-(--gold)/60" : "border-white/15 hover:border-(--gold)/40",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={cn("absolute inset-0 h-full w-full", fit === "contain" ? "object-contain p-3" : "object-cover")} />
        ) : (
          <span className="inline-flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted">
            <ImagePlus size={22} className="text-gold" />
            {busy ? "Uploading…" : "Click to upload a cover photo"}
          </span>
        )}
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void onPick(e.target.files?.[0])}
        />
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </Button>
        {value ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted hover:text-red-300"
            onClick={() => onChange("")}
          >
            <X size={12} />
            Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

type GalleryProps = {
  label?: string;
  hint?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  className?: string;
};

export function GalleryImageUpload({
  label = "Gallery",
  hint = "Add extra interior photos. First image can match the cover.",
  value,
  onChange,
  max = 6,
  className,
}: GalleryProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = Math.max(0, max - value.length);
    const batch = Array.from(files).slice(0, remaining);
    if (!batch.length) {
      setError(`You can add up to ${max} photos.`);
      return;
    }
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of batch) {
        uploaded.push(await uploadImage(file));
      }
      setError("");
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload those images.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-[11px] text-muted">{hint}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url, index) => (
          <div key={`${url.slice(0, 48)}-${index}`} className="relative aspect-4/3 overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-cream hover:text-red-300"
              aria-label="Remove photo"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {value.length < max ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-4/3 items-center justify-center border border-dashed border-white/15 text-muted transition hover:border-(--gold)/40 hover:text-gold"
          >
            <span className="inline-flex flex-col items-center gap-1 text-[11px] uppercase tracking-wider">
              <ImagePlus size={16} />
              {busy ? "…" : "Add"}
            </span>
          </button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => void onPick(e.target.files)}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
