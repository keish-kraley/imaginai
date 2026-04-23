// Lightweight in-memory sliding-window rate limiter. Works per-process, good
// enough for Cloud Run single-instance deployments and for dev. For horizontal
// scale, swap this for @upstash/ratelimit.

interface Bucket {
  windowStart: number;
  count: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

export function checkRateLimit(
  key: string,
  maxPerMinute: number,
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    return { ok: true, remaining: maxPerMinute - 1, retryAfterSeconds: 0 };
  }
  if (bucket.count >= maxPerMinute) {
    const retryAfter = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
    return { ok: false, remaining: 0, retryAfterSeconds: retryAfter };
  }
  bucket.count += 1;
  return { ok: true, remaining: maxPerMinute - bucket.count, retryAfterSeconds: 0 };
}
