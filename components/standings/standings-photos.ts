import 'server-only'
import { getDirectoryPlaceById, type DirectoryPlace } from '@/lib/place-directory'
import { thumbUrl } from '@/lib/thumb'

/** The most places one standings render reads: the same budget the earlier GuideStory spent (24 documents). */
const MAX_PLACES = 24

export interface StandingsPhotos {
  /** placeId → a small copy of the newest public meal photo saved there. */
  thumbs: Record<string, string>
  /** Real meals from the ranked restaurants, two each, then the busiest places, for the "everyone who ate there" mosaic. */
  mosaic: { id: string; src: string; alt: string }[]
}

/**
 * Real public meal photos for a standings page (RM20773): the board's round thumbnails and the mosaic
 * beside "A Michelin star." Reads at most MAX_PLACES place documents, ranked rows first.
 */
export async function getStandingsPhotos(rankedIds: string[], busiestIds: string[] = [], mosaicSize = 0): Promise<StandingsPhotos> {
  const unique = [...new Set([...rankedIds, ...busiestIds])].slice(0, MAX_PLACES)
  const loaded = await Promise.all(unique.map(id => getDirectoryPlaceById(id).catch(() => null)))
  const byId = new Map<string, DirectoryPlace>()
  unique.forEach((id, i) => { const p = loaded[i]; if (p) byId.set(id, p) })
  const thumbs: Record<string, string> = {}
  for (const id of rankedIds) {
    const meal = byId.get(id)?.meals[0]
    if (meal) thumbs[id] = meal.thumb || thumbUrl(meal.src, 240)
  }
  const mosaic: StandingsPhotos['mosaic'] = []
  const take = (placeId: string, n: number) => {
    const p = byId.get(placeId)
    if (!p) return
    for (const m of p.meals.slice(0, n)) {
      if (mosaic.length >= mosaicSize) return
      if (mosaic.some(x => x.id === m.id)) continue
      mosaic.push({ id: m.id, src: m.thumb || thumbUrl(m.src, 240), alt: m.caption ? `${m.caption}, ${p.name}` : p.name })
    }
  }
  if (mosaicSize) {
    for (const id of rankedIds) take(id, 2)
    for (const id of busiestIds) { if (mosaic.length >= mosaicSize) break; take(id, 1) }
  }
  return { thumbs, mosaic }
}
