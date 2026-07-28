import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const projectRoot = process.cwd()
const publicRoot = path.join(projectRoot, 'public')
const outputRoot = path.join(publicRoot, 'static-images', 'v1')

const groups = [
  {
    sourceDir: path.join(publicRoot, 'meals'),
    outputDir: path.join(outputRoot, 'hero'),
    match: /^card-\d+\.jpg$/i,
    widths: [320, 640, 800],
    quality: 78,
  },
  {
    sourceDir: path.join(publicRoot, 'meals'),
    outputDir: path.join(outputRoot, 'meals'),
    match: /^IMG_.+\.jpg$/i,
    widths: [480, 720],
    quality: 80,
  },
  {
    sourceDir: path.join(publicRoot, 'app-mockups'),
    outputDir: path.join(outputRoot, 'app-mockups'),
    match: /\.png$/i,
    widths: [560, 800],
    quality: 90,
    alphaQuality: 95,
  },
  {
    sourceDir: path.join(publicRoot, 'app-screens'),
    outputDir: path.join(outputRoot, 'app-screens'),
    match: /^(?:diary|detail)\.png$/i,
    widths: [560, 800],
    quality: 88,
    alphaQuality: 95,
  },
  {
    sourceDir: path.join(publicRoot, 'mockups'),
    outputDir: path.join(outputRoot, 'mockups'),
    match: /\.png$/i,
    widths: [560, 800],
    quality: 90,
    alphaQuality: 95,
  },
  {
    sourceDir: path.join(publicRoot, 'blog', 'kendal-street-kitchen'),
    outputDir: path.join(outputRoot, 'blog', 'kendal-street-kitchen'),
    match: /\.(?:jpg|jpeg|png|webp)$/i,
    widths: [480, 900, 1400],
    quality: 82,
  },
]

let sourceCount = 0
let variantCount = 0
let inputBytes = 0
let outputBytes = 0

for (const group of groups) {
  await mkdir(group.outputDir, { recursive: true })
  const filenames = (await readdir(group.sourceDir))
    .filter((filename) => group.match.test(filename))
    .sort()

  for (const filename of filenames) {
    sourceCount += 1
    const inputPath = path.join(group.sourceDir, filename)
    const source = sharp(inputPath, { failOn: 'warning' }).rotate()
    inputBytes += (await stat(inputPath)).size
    const basename = path.parse(filename).name

    for (const width of group.widths) {
      const outputPath = path.join(group.outputDir, `${basename}-${width}.webp`)
      const info = await source
        .clone()
        .resize({
          width,
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({
          quality: group.quality,
          alphaQuality: group.alphaQuality ?? 100,
          effort: 5,
          smartSubsample: true,
        })
        .toFile(outputPath)

      variantCount += 1
      outputBytes += info.size
    }
  }
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`
console.log(
  `Generated ${variantCount} static variants from ${sourceCount} sources ` +
    `(${mb(inputBytes)} source → ${mb(outputBytes)} responsive assets).`,
)
