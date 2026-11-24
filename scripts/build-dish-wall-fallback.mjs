// Builds the dish wall's bundled set: what the homepage shows when the live wall cannot be read.
// Photo-only meal previews (Devon, 24 Nov 2026): share cards are cropped above their orange band.
// Inputs are photos already public on this site; no pork, no drinks. Run: node scripts/build-dish-wall-fallback.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const OUT = 'public/static-images/v1/dish-wall'
const TILES = ['02', '03', '04', '06', '08', '09', '12', '19', '26', '29', '31', '36', '37', '38'].map((n) => `public/meals/card-${n}.jpg`)
const PREVIEWS = ['prawns', 'sushi', 'fish-sando', 'roast', 'dining'].map((n) => `public/redesign/${n}.jpg`)

/** The first row (from 30% down) that is mostly Makan Orange: the share card's caption band. */
async function photoArea(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  for (let y = Math.floor(height * 0.3); y < height; y++) {
    let orange = 0
    for (let x = 0; x < width; x += 8) {
      const i = (y * width + x) * channels
      if (data[i] > 225 && data[i + 1] > 125 && data[i + 1] < 185 && data[i + 2] < 100) orange++
    }
    if (orange / (width / 8) > 0.85) return { width, height: y - 6 }
  }
  return { width, height }
}

async function square(file, size, out) {
  const { width, height } = await photoArea(file)
  const s = Math.min(width, height)
  await sharp(file).extract({ left: Math.floor((width - s) / 2), top: 0, width: s, height: s }).resize(size, size).webp({ quality: 74 }).toFile(out)
}

mkdirSync(OUT, { recursive: true })
await Promise.all([
  ...TILES.map((f, i) => square(f, 256, `${OUT}/tile-${String(i + 1).padStart(2, '0')}.webp`)),
  ...PREVIEWS.map((f) => square(f, 480, `${OUT}/preview-${f.split('/').pop().replace('.jpg', '')}.webp`)),
])
console.log(`dish-wall fallback: ${TILES.length} tiles, ${PREVIEWS.length} previews in ${OUT}`)
