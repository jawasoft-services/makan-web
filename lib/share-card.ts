import { makanStorageObject } from './storage-bucket'

/**
 * RM20616 A12 U3 — the stored share card of a place, a meal or a profile: the 1200 x 630 image
 * the app's backend renders once when its subject changes (A12 U2) and the website points
 * `og:image` at, so no card is drawn per request.
 *
 * THE SHAPE U2 WRITES (functions/shareCards/store.js on the app's redesign branch: CARD_ID, CARD_PATH,
 * cardUrl, isCurrent):
 *
 *   document  shareCardMeta/<kind>_<id>
 *             { hash, cards: { en: { path, url }, id: { path, url } }, want, drop, purge, ... }
 *   object    shareCards/<kind>/<id>/<32 hex>-<en|id>-<12 hex>.jpg   in Makan's own bucket;
 *             `cards.<locale>.url` is its download address
 *
 *   kind `place`    id = the place id
 *   kind `meal`     id = the meal id
 *   kind `profile`  id = the person's PUBLIC PROFILE KEY (the 8 characters at the end of /u/<handle>-<key>),
 *                   never their uid: a uid must not reach a page's HTML or its og:image.
 *
 * The card's words differ by language, so an English page uses `cards.en.url` and a Bahasa (/id/) page
 * `cards.id.url`. When the words are the same in both languages, U2 draws one file and names it under
 * both locales; that file's name carries the locale it was drawn for first.
 *
 * The record also holds private fields (the uid of the person whose photo a card shows, the words a
 * pending card will print, the paths of retired files). The website reads it only through
 * SHARE_CARD_FIELDS, so none of them enters this process.
 *
 * This file is the one place that knows that shape. A record that is not current, or whose address for
 * this page's language is not exactly this subject's card in a configured bucket (SHARE_STORAGE_BUCKETS,
 * lib/storage-bucket.ts), gives no card, and the page falls back to its own image. A record with only
 * the other language's card gives no card: a page never shows the other language's card. With no
 * bucket configured there is no card at all.
 */
export type ShareCardKind = 'place' | 'meal' | 'profile'
export type ShareCardLocale = 'en' | 'id'
export type ShareCardUrls = Record<ShareCardLocale, string | null>

/** The only fields of a card record the website reads (a Firestore field mask). */
export const SHARE_CARD_FIELDS = ['hash', 'cards', 'drop', 'purge', 'want.hash']

export const NO_SHARE_CARD: ShareCardUrls = Object.freeze({ en: null, id: null })

const cardId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(id)
const isLocale = (locale: unknown): locale is ShareCardLocale => locale === 'en' || locale === 'id'
/** The file name U2 gives a card: the start of its content hash, the locale it was drawn for, a digest of its token. */
const CARD_FILE = /^[0-9a-f]{32}-(en|id)-[0-9a-f]{12}\.jpg$/
/** The query U2 writes on a card's address, and nothing else: its download token is a random UUID. */
const CARD_QUERY = /^\?alt=media&token=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/
/** Printable ASCII with no space: a stored address with whitespace or a control character is not U2's. */
const PLAIN = /^[\x21-\x7e]+$/

export function shareCardMetaPath(kind: ShareCardKind, id: unknown): string | null {
  return cardId(id) ? `shareCardMeta/${kind}_${id}` : null
}

const fields = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

/** Drawn, not owed a removal or a purge, and not waiting for a newer drawing (U2's isCurrent, plus `purge`). */
function isCurrent(record: Record<string, unknown>): boolean {
  return typeof record.hash === 'string' && record.hash.length > 0 && record.drop !== true && record.purge !== true
    && (record.want === undefined || record.want === null)
}

/** The address the record names for one language, or undefined. */
const urlFor = (record: Record<string, unknown>, locale: ShareCardLocale): unknown => fields(fields(record.cards)?.[locale])?.url

/**
 * The card's address for a page in `locale`, from its record, or null unless the record is current and
 * the address is this subject's own card in Makan's bucket, drawn for this language (or one drawing the
 * record names for both languages).
 */
export function shareCardUrlFrom(doc: unknown, kind: ShareCardKind, id: unknown, locale: unknown): string | null {
  const record = fields(doc)
  if (!cardId(id) || !isLocale(locale) || !record || !isCurrent(record)) return null
  const value = urlFor(record, locale)
  const object = makanStorageObject(value)
  const prefix = `shareCards/${kind}/${id}/`
  if (object === null || !object.startsWith(prefix)) return null
  const drawnFor = CARD_FILE.exec(object.slice(prefix.length))?.[1] as ShareCardLocale | undefined
  if (!drawnFor) return null
  // A file drawn for the other language serves this one only when the record names that same file for both.
  if (drawnFor !== locale && urlFor(record, drawnFor) !== value) return null
  return cardAddress(value as string, object)
}

/**
 * The address U2 writes for this object (store.js `cardUrl`), rebuilt from the checked parts, or null when the
 * stored address carries anything else: whitespace or a control character, a fragment, or any query but
 * `alt=media&token=<uuid>`. The stored string itself is never passed through.
 */
function cardAddress(value: string, object: string): string | null {
  if (!PLAIN.test(value) || value.includes('#')) return null
  const url = new URL(value)
  const token = CARD_QUERY.exec(url.search)?.[1]
  const bucket = /^\/v0\/b\/([^/]+)\/o\//.exec(decodeURIComponent(url.pathname))?.[1]
  if (!token || !bucket) return null
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(object)}?alt=media&token=${token}`
}

/** The card's address for each language, from one record. */
export function shareCardUrlsFrom(doc: unknown, kind: ShareCardKind, id: unknown): ShareCardUrls {
  return { en: shareCardUrlFrom(doc, kind, id, 'en'), id: shareCardUrlFrom(doc, kind, id, 'id') }
}

/** The card for a page's language: English pages `en`, Bahasa pages `id`. Never the other language's. */
export function shareCardFor(urls: ShareCardUrls | null | undefined, locale: unknown): string | null {
  return isLocale(locale) ? urls?.[locale] ?? null : null
}

type CardStore = { doc(path: string): unknown; getAll(...refsAndOptions: unknown[]): Promise<Array<{ data(): unknown }>> }

/**
 * One document read, through the field mask. No card, a refused read or no database all mean "use the
 * page's own image".
 */
export async function readShareCardUrls(db: CardStore | null, kind: ShareCardKind, id: unknown): Promise<ShareCardUrls> {
  const path = shareCardMetaPath(kind, id)
  if (!db || !path) return { ...NO_SHARE_CARD }
  try {
    const [snap] = await db.getAll(db.doc(path), { fieldMask: SHARE_CARD_FIELDS })
    return shareCardUrlsFrom(snap?.data(), kind, id)
  } catch {
    return { ...NO_SHARE_CARD }
  }
}
