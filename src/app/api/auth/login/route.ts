import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/db/users";
import { recordActivity } from "@/lib/db/activity";
import { loginSchema } from "@/lib/db/validators";
import { writeSessionCookie } from "@/lib/auth/session";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    // Throttle password guessing: per IP and per targeted email.
    const email = parsed.data.email.trim().toLowerCase();
    for (const key of [`login:ip:${clientIp(request)}`, `login:email:${email}`]) {
      const limit = rateLimit(key, { limit: 10, windowMs: 5 * 60_000 });
      if (!limit.ok) {
        return tooManyRequests(limit.retryAfter, "Too many sign-in attempts. Try again shortly.");
      }
    }
    const result = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const user = result.user;
    await recordActivity({
      actorUserId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      summary: `${user.name} signed in as ${user.role}`,
    });
    const res = NextResponse.json({ user });
    return writeSessionCookie(res, { sub: user.id, email: user.email, role: user.role });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
