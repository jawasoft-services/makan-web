/**
 * RM20616 A12 U3 — Makan's own Firebase Storage: the project's bucket, under its current name and
 * the name older objects carry. A photo or card address is accepted only from here, so a document
 * that names another project's bucket shows nothing instead of loading someone else's file.
 * (lib/thumb.ts pins the same bucket for the resize route; a test keeps the two in step.)
 */
export const MAKAN_BUCKETS: readonly string[] = ['munchies-expo.firebasestorage.app', 'munchies-expo.appspot.com']

/** The object path (`meals/x.jpg`) of a download address in one of Makan's buckets, or null for anything else. */
export function makanStorageObject(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com' || url.username || url.password || url.port) return null
    const match = /^\/v0\/b\/([^/]+)\/o\/(.+)$/.exec(decodeURIComponent(url.pathname))
    return match && MAKAN_BUCKETS.includes(match[1]) && !match[2].split('/').includes('..') ? match[2] : null
  } catch {
    return null
  }
}
