import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireStaff } from "@/lib/auth/require";

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Detect the real image type from magic bytes rather than trusting the
 * client-supplied MIME type. Returns the canonical extension, or null if the
 * bytes are not a supported raster image.
 */
function detectImageExtension(buffer: Buffer): "jpg" | "png" | "webp" | "gif" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") {
    return "gif";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 4 MB after resize." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    // Validate the actual bytes; the client-provided MIME type is not trusted.
    const ext = detectImageExtension(buffer);
    if (!ext) {
      return NextResponse.json(
        { error: "Please upload a JPG, PNG, WebP, or GIF image." },
        { status: 400 },
      );
    }
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buffer);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (error) {
    console.error("[POST /api/uploads]", error);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
