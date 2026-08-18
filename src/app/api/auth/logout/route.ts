import { NextResponse } from "next/server";
import { expireSessionCookie } from "@/lib/auth/session";

export async function POST() {
  return expireSessionCookie(NextResponse.json({ ok: true }));
}
