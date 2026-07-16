import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

// Node runtime (not edge): we read the meal thumbnails off disk and base64them.
export const runtime = 'nodejs'
export const alt = 'Makan — Remember every meal'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Hero-inspired card: the same 5-column waterfall of *real* shared meals from
// the homepage hero, composed for 1200×630 with a dark scrim + centered panel.
// Photos favour the strongest shots (hero's outer columns 1 & 5), laid out
// column-major so each column reads like the live waterfall.
// Explicit tile geometry (Satori won't resolve percentage <img> sizes).
// 5 columns × 3 rows across 1200×630 with 12px padding + gaps.
const CARD_W = 1200
const CARD_H = 630
const PAD = 12
const GAP = 12
const COL_W = Math.floor((CARD_W - PAD * 2 - GAP * 4) / 5) // 225
const TILE_H = Math.floor((CARD_H - PAD * 2 - GAP * 2) / 3) // 194

const GRID: string[][] = [
  ['card-01', 'card-06', 'card-10'],
  ['card-41', 'card-45', 'card-48'],
  ['card-03', 'card-24', 'card-30'],
  ['card-42', 'card-13', 'card-47'],
  ['card-05', 'card-18', 'card-44'],
]

// Pre-generated 256px thumbnails (see /public/og-tiles). Satori silently drops
// large rasters, so we deliberately feed it small images sized for the tiles.
// Read from disk and inline as data URIs — Vercel bundles them via
// `outputFileTracingIncludes` in next.config.ts.
async function toDataUri(name: string): Promise<string | null> {
  const p = join(process.cwd(), 'public', 'og-tiles', `${name}.jpg`)
  try {
    const buf = await readFile(p)
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch (e) {
    console.error('[og-tiles] FAILED', p, (e as Error).message)
    return null
  }
}

// Brand font. `next/font/google` only reaches the DOM — Satori has no CSS
// pipeline, so the TTFs must be loaded and handed to ImageResponse directly.
// Static weights (not the variable font): Satori renders variable axes
// inconsistently. WOFF2 is unsupported, hence .ttf.
// Never throw on a missing font: a 500 here would blank the card entirely,
// which is the very bug this route exists to avoid. Degrade to Satori's
// default face instead.
const FONT_DIR = join(process.cwd(), 'public', 'fonts')
async function loadFont(file: string): Promise<Buffer | null> {
  try {
    return await readFile(join(FONT_DIR, file))
  } catch (e) {
    console.error('[og-font] FAILED', file, (e as Error).message)
    return null
  }
}

export default async function Image() {
  // Fetch every tile in parallel; a failed tile falls back to a night-coloured
  // block so the card always renders.
  const [tiles, jakartaRegular, jakartaBold] = await Promise.all([
    Promise.all(GRID.map((col) => Promise.all(col.map(toDataUri)))),
    loadFont('PlusJakartaSans-Regular.ttf'),
    loadFont('PlusJakartaSans-Bold.ttf'),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: CARD_W,
          height: CARD_H,
          display: 'flex',
          backgroundColor: '#050505',
          fontFamily: 'Plus Jakarta Sans',
        }}
      >
        {/* Waterfall backdrop — 5 columns of real shared meals.
            Satori needs EXPLICIT pixel dims on <img> (percentages lay out at 0). */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CARD_W,
            height: CARD_H,
            display: 'flex',
            flexDirection: 'row',
            gap: GAP,
            padding: PAD,
          }}
        >
          {tiles.map((col, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: GAP,
                width: COL_W,
              }}
            >
              {col.map((uri, j) =>
                uri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={j}
                    src={uri}
                    alt=""
                    width={COL_W}
                    height={TILE_H}
                    style={{
                      width: COL_W,
                      height: TILE_H,
                      objectFit: 'cover',
                      borderRadius: 18,
                    }}
                  />
                ) : (
                  <div
                    key={j}
                    style={{
                      display: 'flex',
                      width: COL_W,
                      height: TILE_H,
                      borderRadius: 18,
                      backgroundColor: '#1c1c1c',
                    }}
                  />
                ),
              )}
            </div>
          ))}
        </div>

        {/* Scrim — unifies the waterfall so the panel reads (mirrors the hero's
            fade-to-night). MUST use explicit px: Satori ignores the `inset`
            shorthand, so a content-less `inset:0` box collapses to 0×0 and
            silently renders nothing. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CARD_W,
            height: CARD_H,
            display: 'flex',
            backgroundImage:
              'linear-gradient(180deg, rgba(5,5,5,0.52) 0%, rgba(5,5,5,0.80) 100%)',
          }}
        />

        {/* Centre lockup. No glass panel: Satori has no backdrop-filter, so a
            translucent slab renders as a hard-edged rect that reads like a
            broken tile. The scrim above carries the contrast instead. */}
        <div
          style={{
            position: 'relative',
            width: CARD_W,
            height: CARD_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* App-icon mark — rounded orange tile with the bitten M */}
            <div
              style={{
                display: 'flex',
                width: 116,
                height: 116,
                borderRadius: 27,
                overflow: 'hidden',
              }}
            >
              <svg viewBox="0 0 512 512" width="116" height="116" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="#FF9932"
                  d="M0 0h512v512H0V0Zm88 105-5 2-8 12v280l3 8q4 6 12 8h60l7-3 7-11 1-171 66 123q5 6 16 8 20 3 31-5l9-13 60-113 1 2v167l5 11 10 5h60l7-3q6-4 7-12V195h-13l-13-7-7-9-2 1q-14 0-20-6-9-7-12-18l1-13h-3l-8-5-10-15q-2-12 2-16v-2l-8 4-10 14-75 141-3 1-82-151q-4-8-14-9H88Z"
                />
                <path
                  fill="#FFF4E6"
                  d="M87.5 105h72q10.12 1.37 14.5 8.5L255.5 265l3.5-1.5 75-141 9.5-13.5 8-4 .5 1.5q-4 5-2 16l9.5 15.5 8 5h3.5l-1 12.5q3 12 11.5 18.5 6.85 6.15 20 6l2-1 7 9 13 7H437v204.5q-1.48 8.52-7.5 12.5l-7 3h-60l-9.5-5-5-11.5v-167l-1.5-1.5L287 342.5l-9.5 13.5q-10.21 7.79-31 5-10.25-1.75-15.5-8.5L164.5 230l-.5 170.5-7.5 11.5-7 3h-60q-7.89-2.11-11.5-8.5l-3-8v-280l7.5-11.5 5-2Z"
                />
              </svg>
            </div>

            {/* Wordmark — the real brand asset, not type. Source of truth is
                public/makan-wordmark-white.svg (already white for the dark
                scrim); inlined because Satori renders inline <svg> reliably,
                whereas an SVG via <img src=data:...> is flaky. Keep the
                viewBox verbatim — it's offset, not origin-based. */}
            <div style={{ display: 'flex', marginTop: 30 }}>
              <svg
                viewBox="104 127 304 75"
                width={392}
                height={97}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#FFFFFF"
                  d="M249 132q3.72 2.25 12 1l.5 34 15-17 14.5.5-15 16-3 6 21 24-14.5.5-18-21-.5 21h-11.5l-.5-.5V132ZM119.5 149q13.53-2.17 18.5 3l2.5 4q2.25.75 1.5-1.5 4.46-8.04 19.5-5.5l8.5 5.5q4.49 4.51 5 13v28l-1.5 1.5H163l1-9.5-1-1v-21l-4.5-5.5q-8.31-1.31-10.5 3.5l-1 3V197h-12v-31.5l-4.5-5.5q-8.75-1.75-10.5 3.5l-1 2V197h-10.5l-1.5-1.5v-30q1.27-9.23 7.5-13.5l5-3ZM201.5 149q16.6-2.6 22 6l2-5h10l.5.5V197h-11v-5h-1.5q-5.1 8.4-21 6-8.35-2.15-12.5-8.5-6.72-6.78-5-22 2.75-10.25 10.5-15.5l6-3Zm4.5 11-2 1q-5 3-7 10-1 7 2 11 2 5 10 6l10-2q4-4 6-10l-2-10-6-6h-11ZM313.5 149h12l10.5 6v-5h11q1.88 2.69 1 9.5-3 2-1 9 2.5 1.5 1 7l-1 1v10q3 2 1 9-2.25 3.75-10.5 1.5l-2-5q-5.75 8.25-22 6-7.39-2.11-11.5-7.5-7.5-7.5-5-25l8.5-12.5 8-4Zm3.5 11q-7 4-9 12 0 8 4 12l9 4q8 0 12-4l3-6-1-11q-3-10-18-7ZM379.5 149q16.79-2.29 21.5 7.5l3 8V197h-10.5l-.5-1.5-1-1v-29l-3.5-4.5q-3.17-2.33-10-1l-5.5 4.5-1 3V197h-10.5l-.5-.5V150h11v3.5l2.5-1.5 5-3Z"
                />
              </svg>
            </div>

            {/* Tagline */}
            <div
              style={{
                marginTop: 18,
                fontSize: 36,
                color: '#FFF4E6',
                display: 'flex',
              }}
            >
              Remember every meal
            </div>

            {/* Orange accent bar */}
            <div
              style={{
                marginTop: 28,
                width: 56,
                height: 4,
                backgroundColor: '#FF9932',
                borderRadius: 2,
                display: 'flex',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      // Omit `fonts` entirely if either face is missing — next/og then falls
      // back to its bundled default rather than erroring.
      ...(jakartaRegular && jakartaBold
        ? {
            fonts: [
              {
                name: 'Plus Jakarta Sans',
                data: jakartaRegular,
                weight: 400 as const,
                style: 'normal' as const,
              },
              {
                name: 'Plus Jakarta Sans',
                data: jakartaBold,
                weight: 700 as const,
                style: 'normal' as const,
              },
            ],
          }
        : {}),
    },
  )
}
