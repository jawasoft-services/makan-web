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
                public/makan-logo-white.svg: a clean single-path vector export
                (cubic béziers, 902×209). Deliberately NOT makan-wordmark-white
                .svg — that one is a crude auto-trace with lumpy stems and a
                malformed 'k', and it's what Navbar/Footer still render.
                Inlined because Satori renders inline <svg> reliably, whereas an
                SVG via <img src=data:...> is flaky. */}
            <div style={{ display: 'flex', marginTop: 30 }}>
              <svg
                viewBox="0 0 902 209"
                width={400}
                height={93}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#FFFFFF"
                  d="M327.0,201.4C334.8,199.1 340.6,196.0 347.9,190.1C351.4,187.3 354.9,185.0 355.6,185.0C356.7,185.0 357.0,186.8 357.0,192.5L357.0,200.0L375.0,200.0L393.0,200.0L393.0,129.5L393.0,59.0L374.5,59.0L356.0,59.0L356.0,67.0C356.0,71.4 355.7,75.0 355.2,75.0C354.8,75.0 351.8,72.7 348.5,69.9C341.7,64.2 331.1,58.8 323.0,56.9C315.3,55.1 298.0,55.4 290.0,57.5C271.1,62.4 256.2,75.0 247.1,93.4C241.0,105.6 240.0,110.9 240.0,129.6C240.0,144.2 240.2,146.5 242.6,153.6C247.8,169.6 257.5,183.3 270.1,192.6C276.4,197.2 287.3,201.8 294.7,203.0C302.8,204.3 320.5,203.4 327.0,201.4Z M654.9,203.0C664.2,201.8 674.2,197.0 683.2,189.6C686.8,186.5 690.1,184.0 690.4,184.0C690.7,184.0 691.0,187.6 691.0,192.0L691.0,200.0L709.0,200.0L727.0,200.0L727.0,129.8L727.0,59.5L709.8,59.8C700.3,60.0 692.3,60.4 692.0,60.6C691.8,60.9 691.3,64.0 690.9,67.6C690.6,71.2 690.0,74.4 689.6,74.7C689.3,75.0 686.5,73.2 683.4,70.7C676.2,64.7 669.1,60.7 661.1,58.0C656.0,56.3 652.4,55.9 642.6,55.9C621.5,55.9 609.0,60.9 594.9,75.0C587.6,82.2 585.5,85.1 581.6,93.1C579.1,98.4 576.3,105.8 575.5,109.6C573.5,118.9 573.6,139.1 575.6,148.3C578.2,160.0 584.8,172.5 593.1,181.4C605.7,194.9 618.1,201.7 632.5,203.0C644.2,204.0 646.7,204.0 654.9,203.0Z M39.8,198.6C39.9,198.4 40.3,177.4 40.7,151.9C41.3,100.8 41.1,102.8 47.9,95.7C53.0,90.2 55.9,89.0 63.5,89.0C73.7,89.0 80.9,93.1 85.3,101.4C87.5,105.4 87.5,106.2 87.8,152.8L88.1,200.0L106.6,200.0L125.0,200.0L125.0,154.4C125.0,122.0 125.3,107.6 126.2,104.8C127.6,100.0 134.6,92.5 139.5,90.4C144.3,88.4 153.6,88.6 158.5,90.9C160.7,91.9 163.9,94.3 165.7,96.1C172.2,103.0 172.2,102.9 173.0,152.8C173.4,177.7 173.9,198.2 174.1,198.5C174.3,198.7 182.2,199.0 191.5,199.2L208.5,199.5L208.3,167.5C207.9,123.5 206.7,101.0 204.3,93.9C200.0,81.1 189.3,68.0 178.5,62.3C168.8,57.2 161.8,55.6 150.0,55.6C133.4,55.7 122.0,60.7 111.3,72.4L106.0,78.1L100.3,72.0C89.0,59.8 79.9,55.8 63.0,55.7C57.2,55.6 50.0,56.2 47.0,56.9C32.1,60.5 19.3,70.6 12.6,84.1C5.8,97.9 5.8,97.6 5.3,148.7C5.0,174.2 5.1,196.2 5.4,197.6L6.1,200.3L22.8,199.6C32.0,199.2 39.6,198.7 39.8,198.6Z M467.0,168.5C467.0,150.4 467.4,137.0 467.9,137.0C468.4,137.0 480.6,151.2 495.1,168.6L521.4,200.2L540.9,199.5C551.7,199.1 561.3,198.4 562.3,198.1C563.8,197.5 558.5,190.8 533.1,160.5C516.0,140.1 502.0,122.8 502.0,122.0C502.0,120.1 508.4,112.7 531.5,88.0C541.5,77.3 551.2,66.8 552.9,64.8L556.1,61.1L552.8,60.5C551.0,60.1 541.2,60.0 531.1,60.2L512.8,60.5L504.6,69.0C500.2,73.7 490.0,84.9 482.2,93.8C474.3,102.7 467.4,110.0 466.9,110.0C466.4,110.0 466.0,88.2 466.0,57.5L466.0,5.0L448.0,5.0L430.0,5.0L430.0,102.5L430.0,200.0L448.5,200.0L467.0,200.0L467.0,168.5Z M801.0,154.2L801.0,108.4L803.8,103.9C810.6,93.2 819.8,88.5 832.3,89.2C841.0,89.6 846.7,92.2 853.2,98.4C856.8,101.8 858.0,103.8 858.9,107.9C859.6,111.3 860.0,128.5 860.0,156.5L860.0,200.0L878.5,200.0L897.0,200.0L896.5,183.2C896.2,174.0 895.8,153.7 895.5,138.0C894.8,102.8 894.2,98.0 888.9,87.1C878.0,65.0 856.0,53.2 831.1,56.0C821.7,57.1 816.3,59.2 808.7,64.9C801.3,70.5 799.0,70.2 799.0,63.4C799.0,60.3 797.9,60.1 779.2,59.8L764.0,59.5L764.0,129.8L764.0,200.0L782.5,200.0L801.0,200.0L801.0,154.2Z M302.3,170.2C292.7,166.8 285.5,159.8 279.8,148.6L275.8,140.7L276.2,128.1C276.5,116.6 276.8,115.0 279.4,110.1C283.1,102.8 292.1,94.0 299.3,90.6C304.8,87.9 305.5,87.8 316.3,88.2C326.1,88.6 328.2,89.0 333.0,91.5C340.3,95.2 350.4,105.1 353.6,111.7C356.7,118.0 357.9,130.6 356.1,138.9C353.3,151.9 342.9,164.6 331.3,169.1C323.2,172.2 309.4,172.7 302.3,170.2Z M637.3,170.1C624.4,165.3 615.9,155.8 611.4,141.1C609.8,135.7 609.6,125.4 611.1,119.1C613.7,107.5 622.1,96.8 632.7,91.4C638.1,88.7 639.3,88.5 649.5,88.5C663.3,88.6 669.0,90.6 677.8,98.6C686.1,106.1 690.0,113.9 690.7,124.9C692.1,144.8 684.0,160.4 668.2,168.1C662.3,170.9 660.3,171.4 652.0,171.7C644.5,172.0 641.4,171.6 637.3,170.1Z"
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
