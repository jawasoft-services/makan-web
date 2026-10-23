/** Sizes the resize route accepts; anything else falls back to the original. */
export const THUMB_WIDTHS = [240, 480, 720, 960] as const
export type ThumbWidth = (typeof THUMB_WIDTHS)[number]

const FIREBASE_ORIGIN = 'https://firebasestorage.googleapis.com/'
const BUCKET_PATH = '/v0/b/munchies-expo.firebasestorage.app/o/'

/**
 * A resized copy of a Firebase meal photo via /api/thumb, or the original
 * URL for anything else. Client-safe: no imports, no secrets.
 */
export function thumbUrl(src: string, width: ThumbWidth): string {
  if (!src.startsWith(FIREBASE_ORIGIN)) return src
  return `/api/thumb?w=${width}&u=${encodeURIComponent(src)}`
}

/**
 * The original photo's URL if, and only if, it is an object in this project's
 * bucket: https, the Firebase Storage host and the exact bucket path. Anything
 * else (another bucket with the same prefix, http, a redirecting host) is
 * null. Only the `alt` and `token` query parameters survive, so the resize
 * route fetches nothing but the file the app itself links to.
 */
export function thumbSource(u: string): string | null {
  let url: URL
  try {
    url = new URL(u)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.host !== 'firebasestorage.googleapis.com' || !url.pathname.startsWith(BUCKET_PATH)) return null
  const query = new URLSearchParams()
  for (const key of ['alt', 'token']) {
    const value = url.searchParams.get(key)
    if (value !== null) query.set(key, value)
  }
  return `${FIREBASE_ORIGIN}${url.pathname.slice(1)}${query.size ? `?${query}` : ''}`
}
