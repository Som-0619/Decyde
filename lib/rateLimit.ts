/**
 * In-memory, per-IP sliding-window rate limiter for API routes.
 *
 * This is intentionally simple (no external service): it stops a script
 * hammering /api/rooms or /api/votes from one machine, which is the actual
 * threat model for a friend-group app. It resets on every deploy/cold start
 * and isn't shared across multiple serverless instances, so it is NOT a
 * substitute for a distributed limiter (e.g. Upstash) if this app ever needs
 * to withstand a coordinated abuse campaign — just a meaningful floor with
 * zero new infrastructure.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Periodically forget IPs that haven't hit any limiter recently, so this
// map can't grow unbounded over a long-running server process.
const MAX_TRACKED_IPS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param key Usually `${ip}:${routeName}` so different routes have independent budgets.
 * @param limit Max requests allowed within the window.
 * @param windowSeconds Window length in seconds.
 */
export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= MAX_TRACKED_IPS) {
      // Cheap eviction under memory pressure: drop the oldest-inserted entry.
      const oldestKey = buckets.keys().next().value;
      if (oldestKey) buckets.delete(oldestKey);
    }
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }

  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldestHit = bucket.hits[0];
    const retryAfterSeconds = Math.ceil((windowMs - (now - oldestHit)) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.hits.push(now);
  return { allowed: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

/** Best-effort client IP extraction behind Vercel's proxy (falls back for local dev). */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
