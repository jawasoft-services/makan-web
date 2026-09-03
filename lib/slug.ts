import { createHash } from 'node:crypto'

/** URL slug from a display name: lowercase, ascii, hyphens. */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '') || 'place'
}

/** The slug for a place: its name plus the hash, e.g. trabuxu-bistro-e7adf6. */
export function placeSlug(name: string, placeId: string): string {
  return `${slugify(name)}-${shortHash(placeId)}`
}

/** The hash at the end of a place slug, or null if it has none. */
export function slugHash(slug: string): string | null {
  const m = /-([0-9a-f]{6})$/.exec(slug)
  return m ? m[1] : null
}

/** Six hex characters of the id, so two "The White Hart"s get different URLs. */
export function shortHash(id: string): string {
  return createHash('sha1').update(id).digest('hex').slice(0, 6)
}
