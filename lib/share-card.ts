/**
 * RM20616 A12 U3 — the stored share card of a place, a meal or a profile: the 1200 x 630 image
 * the app's backend renders once when its subject changes (A12 U2) and the website points
 * `og:image` at, so no card is drawn per request.
 *
 * This file is the one place that knows the document's shape. U2's plan (PLAN.md section 3):
 * `shareCardMeta/<kind>_<id>` = { hash, url, updatedAt }, where `url` is the Firebase Storage
 * download address of `shareCards/<kind>/<id>/<hash>.jpg`. If U2 lands a different shape, change
 * `shareCardMetaPath` and `shareCardUrlFrom` and nothing else.
 */
export type ShareCardKind = 'place' | 'meal' | 'profile'

/** The id of the subject: the place id, the meal id, or the profile owner's uid. */
export function shareCardMetaPath(kind: ShareCardKind, id: unknown): string | null {
  return typeof id === 'string' && id.length > 0 && id.length <= 1500 && !id.includes('/') ? `shareCardMeta/${kind}_${id}` : null
}

/** The card's address from its document, or null for anything that is not a stored share card. */
export function shareCardUrlFrom(doc: unknown): string | null {
  const value = doc !== null && typeof doc === 'object' ? (doc as Record<string, unknown>).url : undefined
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null
  try {
    const url = new URL(value)
    const isStorage = url.protocol === 'https:' && url.hostname === 'firebasestorage.googleapis.com' && !url.username && !url.password
    return isStorage && /^\/v0\/b\/[^/]+\/o\/shareCards\//.test(decodeURIComponent(url.pathname)) ? value : null
  } catch {
    return null
  }
}

type CardStore = { doc(path: string): { get(): Promise<{ data(): unknown }> } }

/** One document read. No card, a refused read or no database all mean "use the page's own image". */
export async function readShareCardUrl(db: CardStore | null, kind: ShareCardKind, id: unknown): Promise<string | null> {
  const path = shareCardMetaPath(kind, id)
  if (!db || !path) return null
  try {
    return shareCardUrlFrom((await db.doc(path).get()).data())
  } catch {
    return null
  }
}
