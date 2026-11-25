/**
 * Build-time WebP sizes of the site's own photos (scripts/generate-static-images.mjs). The site
 * serves images unoptimized, so next/image would otherwise send the 2048px original (300–700 KB)
 * to a card a few hundred pixels wide. Keep each set's widths in step with that script.
 */
const LOCAL_PHOTO_SETS: { from: string; match: RegExp; to: string; widths: readonly number[] }[] = [
  { from: '/redesign/native/', match: /^[^/]+\.jpg$|^reference-feed-(?:en|id)\.png$/i, to: '/static-images/v1/redesign-native/', widths: [320, 640, 1024, 1280] },
  { from: '/redesign/', match: /^[^/]+\.jpg$/i, to: '/static-images/v1/redesign-photos/', widths: [320, 640, 1024, 1280] },
  { from: '/blog/kendal-street-kitchen/', match: /^[^/]+\.(?:jpg|jpeg|png|webp)$/i, to: '/static-images/v1/blog/kendal-street-kitchen/', widths: [480, 900, 1400] },
]

/**
 * The smallest generated size that is still sharp at twice `cssWidth` (or the largest there is)
 * for a file one of the sets above generates. Any other path comes back unchanged.
 */
export function localPhoto(src: string, cssWidth: number): string {
  for (const set of LOCAL_PHOTO_SETS) {
    if (!src.startsWith(set.from)) continue
    const file = src.slice(set.from.length)
    if (!set.match.test(file)) continue
    const name = file.replace(/\.[a-z]+$/i, '')
    const width = set.widths.find((w) => w >= cssWidth * 2) ?? set.widths.at(-1)!
    return `${set.to}${name}-${width}.webp`
  }
  return src
}
