"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/Button";

const MAX_SOURCE_BYTES = 6 * 1024 * 1024;
const MAX_EDGE = 512;

type Props = {
  name: string;
  value?: string;
  onChange: (value: string) => void;
};

async function fileToAvatarDataUrl(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = objectUrl;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that image.");
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AvatarUpload({ name, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("Image must be under 6 MB.");
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setError("");
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--gold)"
        aria-label="Upload profile photo"
      >
        <UserAvatar name={name || "New user"} src={value} size={88} />
        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-(--bg-elevated) text-gold">
          <Camera size={14} />
        </span>
      </button>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.14em] text-gold">Profile photo</p>
        <p className="mt-1 text-sm text-muted">Square crop works best. JPG or PNG, resized automatically.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void onPick(e.target.files?.[0])}
          />
          <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
            Upload image
          </Button>
          {value ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2 text-[11px] uppercase tracking-wider text-muted hover:text-red-300"
              onClick={() => {
                onChange("");
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              <X size={12} />
              Remove
            </button>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      </div>
    </div>
  );
}
