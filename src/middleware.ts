import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "sams_access";
const REFRESH_COOKIE = "sams_refresh";
const LEGACY_COOKIE = "sams_session";

const PROTECTED = ["/dashboard", "/account"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!needsAuth) return NextResponse.next();

  const hasJwt =
    Boolean(request.cookies.get(ACCESS_COOKIE)?.value) ||
    Boolean(request.cookies.get(REFRESH_COOKIE)?.value) ||
    Boolean(request.cookies.get(LEGACY_COOKIE)?.value);

  if (hasJwt) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard", "/account/:path*", "/account"],
};
