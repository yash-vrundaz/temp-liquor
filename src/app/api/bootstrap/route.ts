import { NextResponse } from "next/server";
import { fetchBootstrapPayload } from "@/lib/db/queries";
import { isDbConfigured } from "@/lib/db/prisma";

export async function GET() {
  try {
    const payload = await fetchBootstrapPayload();
    return NextResponse.json({
      ok: true,
      dbConnected: isDbConfigured(),
      ...payload,
    });
  } catch (error) {
    console.error("[GET /api/bootstrap]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load store data from database." },
      { status: 500 },
    );
  }
}
