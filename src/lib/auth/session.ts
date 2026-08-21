import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types";

export const SESSION_COOKIE = "sams_session";
const SESSION_DAYS = 7;

export type SessionPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

function secretKey() {
  const secret =
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? "" : "liquor-shop-dev-auth-secret-2026");
  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }
  return new TextEncoder().encode(secret);
}

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export async function writeSessionCookie(res: NextResponse, payload: SessionPayload) {
  const token = await signSession(payload);
  res.cookies.set(SESSION_COOKIE, token, {
    ...cookieBase(),
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}

export function expireSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    ...cookieBase(),
    maxAge: 0,
    expires: new Date(0),
  });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
