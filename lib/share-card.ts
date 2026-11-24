import { makanStorageObject } from './storage-bucket'

/**
 * RM20616 A12 U3 — the stored share card of a place, a meal or a profile: the 1200 x 630 image
 * the app's backend renders once when its subject changes (A12 U2) and the website points
 * `og:image` at, so no card is drawn per request.
 *
 * ASSUMED SHAPE (U2 had no code when this was written; the controller has told U2 the same):
 *
 *   document  shareCardMeta/<kind>_<id>            { hash, url, updatedAt }
 *   object    shareCards/<kind>/<id>/<hash>.jpg    in Makan's own bucket; `url` is its download address
 *
 *   kind `place`    id = the place id
 *   kind `meal`     id = the meal id
 *   kind `profile`  id = the person's PUBLIC PROFILE KEY (the 8 characters at the end of /u/<handle>-<key>),
 *                   never their uid: a uid must not reach a page's HTML or its og:image.
 *
 * This file is the one place that knows that shape. A document whose `url` is not exactly this
 * subject's card in Makan's bucket is ignored, and the page falls back to today's image.
 */
export type ShareCardKind = 'place' | 'meal' | 'profile'

const cardId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(id)

export function shareCardMetaPath(kind: ShareCardKind, id: unknown): string | null {
  return cardId(id) ? `shareCardMeta/${kind}_${id}` : null
}

/** The card's address from its document, or null unless it is this subject's own card in Makan's bucket. */
export function shareCardUrlFrom(doc: unknown, kind: ShareCardKind, id: unknown): string | null {
  if (!cardId(id)) return null
  const value = doc !== null && typeof doc === 'object' ? (doc as Record<string, unknown>).url : undefined
  const object = makanStorageObject(value)
  return object !== null && object.startsWith(`shareCards/${kind}/${id}/`) ? (value as string).trim() : null
}

type CardStore = { doc(path: string): { get(): Promise<{ data(): unknown }> } }

/** One document read. No card, a refused read or no database all mean "use the page's own image". */
export async function readShareCardUrl(db: CardStore | null, kind: ShareCardKind, id: unknown): Promise<string | null> {
  const path = shareCardMetaPath(kind, id)
  if (!db || !path) return null
  try {
    return shareCardUrlFrom((await db.doc(path).get()).data(), kind, id)
  } catch {
    return null
  }
}
