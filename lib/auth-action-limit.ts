import "server-only"

/*
 * RM20616 A10 unit 10 (R1) — the limits on /auth/action: how many reset emails "Send reset link" asks
 * Google for, and how often one client may open the page (each opening asks Google about the code).
 *
 * What this is, honestly: counters in the memory of one server instance. App Hosting runs up to 4
 * instances (apphosting.yaml maxInstances) and recycles them, so every number below is per instance; the
 * worst case for the whole site is that number times the instances running, and a recycled instance starts
 * from zero. It is not a global limit and nothing here pretends it is. A platform rule on the route (Cloud
 * Armor or App Hosting's equivalent) is the place for a global one. What it does bound, with no dependency,
 * no network call and no shared store to pay for:
 *
 *   per address  3 reset emails an hour and 6 a day to one address (lower-cased, trimmed), whatever client
 *                asks: a victim's inbox gets at most that much from one instance.
 *   per client   5 sends an hour and 20 a day from one client address, whatever addresses it names: the
 *                Makan-paid quota one client can spend, and how far Google's throttling of Makan's own
 *                address can be pushed from one client.
 *   page opens   30 openings of the page in 10 minutes from one client. Past it the link goes on to
 *                Firebase's own page, which handles it as it does today.
 *
 * Past a send limit the form answers exactly as for a sent email (Email sent), so the limit tells nobody
 * anything about an address.
 */

interface Window {
  ms: number
  max: number
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const SEND_PER_ADDRESS: readonly Window[] = [{ ms: HOUR, max: 3 }, { ms: DAY, max: 6 }]
export const SEND_PER_CLIENT: readonly Window[] = [{ ms: HOUR, max: 5 }, { ms: DAY, max: 20 }]
export const OPENS_PER_CLIENT: readonly Window[] = [{ ms: 10 * MINUTE, max: 30 }]

// Bounded: past this many keys the old entries are pruned, and if that is not enough the map starts again
// (which at worst forgives what was counted, rather than growing without end).
const MAX_KEYS = 5000

type Log = Map<string, number[]>
const logs = { address: new Map() as Log, client: new Map() as Log, opens: new Map() as Log }

function recent(log: Log, key: string, windows: readonly Window[], now: number): number[] {
  const longest = Math.max(...windows.map((window) => window.ms))
  return (log.get(key) ?? []).filter((at) => now - at < longest && at <= now)
}

function fits(times: number[], windows: readonly Window[], now: number): boolean {
  return windows.every((window) => times.filter((at) => now - at < window.ms).length < window.max)
}

function record(log: Log, key: string, times: number[], windows: readonly Window[], now: number) {
  if (!log.has(key) && log.size >= MAX_KEYS) {
    const longest = Math.max(...windows.map((window) => window.ms))
    for (const [old, list] of log) if (!list.some((at) => now - at < longest)) log.delete(old)
    if (log.size >= MAX_KEYS) log.clear()
  }
  log.set(key, [...times, now])
}

/** The address a reset email goes to, as the limit counts it. */
export function normalisedEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * True when this send may go to Google, and counts it. Both the address and the client must be under every
 * window; a refused send is not counted.
 */
export function sendAllowed(email: string, client: string, now = Date.now()): boolean {
  const address = normalisedEmail(email)
  const byAddress = recent(logs.address, address, SEND_PER_ADDRESS, now)
  const byClient = recent(logs.client, client, SEND_PER_CLIENT, now)
  if (!fits(byAddress, SEND_PER_ADDRESS, now) || !fits(byClient, SEND_PER_CLIENT, now)) return false
  record(logs.address, address, byAddress, SEND_PER_ADDRESS, now)
  record(logs.client, client, byClient, SEND_PER_CLIENT, now)
  return true
}

/** True when this client may open the page (and so make it ask Google about a code), and counts it. */
export function openAllowed(client: string, now = Date.now()): boolean {
  const opens = recent(logs.opens, client, OPENS_PER_CLIENT, now)
  if (!fits(opens, OPENS_PER_CLIENT, now)) return false
  record(logs.opens, client, opens, OPENS_PER_CLIENT, now)
  return true
}

type Env = Record<string, string | undefined>

/**
 * The client's address, taken only from what the host platform sets, never from the first
 * X-Forwarded-For entry (that one is whatever the client wrote; lib/rate-limit.ts, which reads it, is
 * left as it is for the routes that use it).
 *
 * - On Firebase App Hosting (FIREBASE_CONFIG, which the platform sets at run time, is present): the
 *   `x-fah-client-ip` header that App Hosting's own proxy sets. Off App Hosting the header is ignored, since
 *   nothing there stops a client from sending it.
 * - Otherwise, or if that header is missing: the last X-Forwarded-For entry, the one the nearest proxy
 *   appended (Cloud Run's front end appends the address it saw; `next start` with no proxy fills the header
 *   with the socket's address). Everything before it can be written by the client.
 *
 * On App Hosting the last entry is a Google proxy, not the client; it is only the fallback. Which header
 * the deployed site really receives must be checked on a hosted preview before this is relied on.
 */
export function trustedClientAddress(headers: Headers, env: Env = process.env): string {
  if (env.FIREBASE_CONFIG) {
    const platform = headers.get("x-fah-client-ip")?.trim()
    if (platform) return platform
  }
  const hops = (headers.get("x-forwarded-for") ?? "").split(",").map((hop) => hop.trim()).filter(Boolean)
  return hops.at(-1) ?? "unknown"
}
