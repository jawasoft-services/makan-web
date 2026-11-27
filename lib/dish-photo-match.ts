import { foldName } from '@/lib/aggregates/dishes'

/**
 * RM20616 dish pages U3 — which meal lends its photo to which rated dish on the Share v2 restaurant page. The app's
 * rule (components/restaurant/restaurantPagePresentation.ts buildMenuRows): a meal's caption names a dish when the
 * folded caption holds the folded name as whole words; the longest name wins; the newest meal comes first; one photo
 * per dish. The answer is one of the names, so a caption naming the answer never lends its photo to a shorter rated
 * name inside it ("Nasi campur ayam betutu" is never a photo of "Nasi campur").
 *
 * `meals` must be the meals the page already shows, newest first: the place aggregate's public meals that passed the
 * page's author check (getVisiblePlaceMealIds). Nothing is read or stored. Returns rated name → meal id.
 *
 * Known limit: the web knows only the rated names and the answer, not the venue's whole menu. A caption naming an
 * unrated dish whose name holds a rated one ("Sate lilit" when only "Sate" is rated) lends its photo to that row.
 */
export function matchDishPhotos(rated: readonly string[], answer: string, meals: readonly { id: string; caption: string }[]): Map<string, string> {
  const keys = [...new Set([answer, ...rated].map(foldName).filter(Boolean))]
  const photos = new Map<string, string>()
  for (const meal of meals) {
    if (!meal.caption) continue
    const caption = ` ${foldName(meal.caption)} `
    let best: string | null = null
    for (const key of keys) if (caption.includes(` ${key} `) && (!best || key.length > best.length)) best = key
    if (best && !photos.has(best)) photos.set(best, meal.id)
  }
  const out = new Map<string, string>()
  for (const name of rated) {
    const id = photos.get(foldName(name))
    if (id) out.set(name, id)
  }
  return out
}
