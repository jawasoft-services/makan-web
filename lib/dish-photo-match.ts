import { foldName } from '@/lib/aggregates/dishes'

/**
 * RM20616 dish pages U3 — which meal lends its photo to which rated dish on the Share v2 restaurant page.
 *
 * Exact dish only (Devon, 27 Nov 2026, after review M1): a meal's photo goes on a dish row only when its caption names
 * that exact dish, folded (case, accents and punctuation aside): `foldName(caption) === foldName(name)`. A variant
 * ("Sate lilit" on "Sate", "Nasi goreng seafood" on "Nasi goreng"), extra words, or a caption naming two dishes lends
 * nothing, and the row has no photo. The newest meal that names a dish wins; one photo per dish. The answer block never
 * has a photo, and a caption naming the answer matches no row (the answer is never a row).
 *
 * `meals` must be the meals the page already shows, newest first: the place aggregate's public meals that passed the
 * page's author check (getVisiblePlaceMealIds). Nothing is read or stored. Returns rated name → meal id.
 */
export function matchDishPhotos(rated: readonly string[], meals: readonly { id: string; caption: string }[]): Map<string, string> {
  const byCaption = new Map<string, string>()
  for (const meal of meals) {
    const key = meal.caption ? foldName(meal.caption) : ''
    if (key && !byCaption.has(key)) byCaption.set(key, meal.id)
  }
  const out = new Map<string, string>()
  for (const name of rated) {
    const id = byCaption.get(foldName(name))
    if (id) out.set(name, id)
  }
  return out
}
