import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

// In-memory fixed-window limiter. This is process-local, which is appropriate
// for the single persistent Node server this app is deployed to. On a
// multi-instance / serverless target, replace the store with a shared backend
// (e.g. Redis / Upstash) — the call sites would stay the same.
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = { ok: boolean; retryAfter: number };

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client IP from proxy headers (Hostinger/CDN set x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Standard 429 response with a Retry-After header. */
export function tooManyRequests(retryAfter: number, message = "Too many requests. Please slow down.") {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
