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

/** Six hex characters of the id, so two "The White Hart"s get different URLs. */
export function shortHash(id: string): string {
  return createHash('sha1').update(id).digest('hex').slice(0, 6)
}
