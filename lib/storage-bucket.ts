/**
 * RM20616 A12 U3 — which Firebase Storage buckets are Makan's own. ONE configuration value, read
 * here and nowhere else:
 *
 *   SHARE_STORAGE_BUCKETS   the bucket name(s) of this deployment's Firebase project, comma-separated,
 *                           exactly as they appear in a download address after `/v0/b/`
 *
 * No name is built in: the right one differs between the dev and the production project and has to
 * be confirmed against real addresses (progress/A12/NOTES.md, "U3 review fixes, second round").
 *
 *   - A stored share card is accepted only from a configured bucket. Unset, or no match: there is no
 *     card, and the page uses today's image.
 *   - A meal photo or an avatar is accepted only from a configured bucket once the value is set.
 *     Unset, it is accepted from the Firebase Storage host, as today's pages accept it.
 */
const BUCKET_NAME = /^[a-z0-9][a-z0-9._-]{1,220}$/

export function configuredBuckets(): string[] {
  return (process.env.SHARE_STORAGE_BUCKETS ?? '').split(',').map((name) => name.trim()).filter((name) => BUCKET_NAME.test(name))
}

/** The bucket and object path of a Firebase Storage download address over https, or null for anything else. */
function storageObject(value: unknown): { bucket: string; object: string } | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com' || url.username || url.password || url.port) return null
    const match = /^\/v0\/b\/([^/]+)\/o\/(.+)$/.exec(decodeURIComponent(url.pathname))
    return match && !match[2].split('/').includes('..') ? { bucket: match[1], object: match[2] } : null
  } catch {
    return null
  }
}

/** The object path of an address in one of the configured buckets, or null. With no bucket configured, always null. */
export function makanStorageObject(value: unknown): string | null {
  const found = storageObject(value)
  return found && configuredBuckets().includes(found.bucket) ? found.object : null
}

/** Whether a photo address may be loaded: a configured bucket, or (with none configured) the Firebase Storage host. */
export function isMakanPhoto(value: unknown): boolean {
  const found = storageObject(value)
  if (!found) return false
  const buckets = configuredBuckets()
  return buckets.length === 0 || buckets.includes(found.bucket)
}
