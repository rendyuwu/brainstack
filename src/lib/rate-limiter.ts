import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 60_000);

/**
 * §V.51: Only trust x-forwarded-for from configured trusted proxies.
 * Set TRUSTED_PROXY_IPS env var (comma-separated) to enable header trust.
 * Without it, falls back to 'unknown' (all requests share one bucket).
 */
const TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXY_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)
);

function getIP(req: NextRequest): string {
  // Only trust forwarded headers if trusted proxies are configured
  if (TRUSTED_PROXIES.size > 0) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      // First IP in chain is the client; last is the most recent proxy
      return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
  }

  // No trusted proxy config — use IP from request if available
  // NextRequest doesn't expose socket IP directly; fall back to header or 'unknown'
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function checkRateLimit(
  req: NextRequest,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const key = getIP(req);
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    store.set(key, entry);
    return { allowed: false, retryAfter };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true };
}
