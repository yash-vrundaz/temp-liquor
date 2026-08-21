import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireStaff } from "@/lib/auth/require";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please upload a JPG, PNG, or WebP image." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 4 MB after resize." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buffer);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (error) {
    console.error("[POST /api/uploads]", error);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
