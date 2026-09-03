/** Sizes the resize route accepts; anything else falls back to the original. */
export const THUMB_WIDTHS = [240, 480, 720, 960] as const
export type ThumbWidth = (typeof THUMB_WIDTHS)[number]

const FIREBASE_ORIGIN = 'https://firebasestorage.googleapis.com/'

/**
 * A resized copy of a Firebase meal photo via /api/thumb, or the original
 * URL for anything else. Client-safe: no imports, no secrets.
 */
export function thumbUrl(src: string, width: ThumbWidth): string {
  if (!src.startsWith(FIREBASE_ORIGIN)) return src
  return `/api/thumb?w=${width}&u=${encodeURIComponent(src)}`
}
