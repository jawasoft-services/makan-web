import 'server-only'

/**
 * A small per-address token bucket in the memory of one function instance.
 *
 * Vercel runs many instances and recycles them, so this is not a global
 * limit and never pretends to be: Vercel Firewall rate-limit rules are the
 * production control for sustained abuse. What this bounds is the cost one
 * instance will spend on one address between those rules and the handler
 * (a burst of unique thumbnail URLs, a form submitted in a loop), with no
 * dependency, no network call and no shared store to pay for.
 */
interface Limit {
  /** Requests allowed at once from one address. */
  burst: number
  /** Steady rate the bucket refills at. */
  perMinute: number
}

interface Bucket {
  tokens: number
  at: number
}

// Buckets per route, then per address. Bounded: when a route map fills, it
// is dropped whole, which at worst forgives one burst rather than growing.
const MAX_ADDRESSES = 5000
const routes = new Map<string, Map<string, Bucket>>()

/** The caller's address as Vercel's proxy reports it; 'unknown' off-platform. */
export function clientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip') || 'unknown'
}

/** True when this request exceeds the route's limit for its address. */
export function rateLimited(request: Request, route: string, limit: Limit, now = Date.now()): boolean {
  let buckets = routes.get(route)
  if (!buckets) routes.set(route, (buckets = new Map()))
  if (buckets.size >= MAX_ADDRESSES) buckets.clear()
  const address = clientAddress(request)
  const bucket = buckets.get(address) ?? { tokens: limit.burst, at: now }
  bucket.tokens = Math.min(limit.burst, bucket.tokens + ((now - bucket.at) * limit.perMinute) / 60_000)
  bucket.at = now
  buckets.set(address, bucket)
  if (bucket.tokens < 1) return true
  bucket.tokens -= 1
  return false
}
