import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  readAccessTokenFromRequest,
  revokeAccessToken,
  verifyAccessToken,
} from "@/lib/auth/session";
import { decodeJwt } from "jose";

export async function POST() {
  const raw = await readAccessTokenFromRequest();
  if (raw) {
    const claims = await verifyAccessToken(raw);
    if (claims?.jti && claims.jti !== "legacy") {
      try {
        const decoded = decodeJwt(raw);
        const expMs =
          typeof decoded.exp === "number" ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000;
        revokeAccessToken(claims.jti, expMs);
      } catch {
        revokeAccessToken(claims.jti, Date.now() + 15 * 60 * 1000);
      }
    }
  }
  return clearAuthCookies(NextResponse.json({ ok: true }));
}
