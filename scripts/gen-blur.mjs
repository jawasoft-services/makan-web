// Tiny blurred previews for the story images, so a slow connection shows a
// soft version of each photo instead of empty cream while the real file
// loads. Output is committed (lib/data/story-blur.json); rerun this after
// adding or replacing anything under public/meals/story or
// public/app-screens/story:  node scripts/gen-blur.mjs
import { readdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import sharp from "sharp"

const DIRS = ["public/meals/story", "public/app-screens/story"]
const out = {}
for (const dir of DIRS) {
  for (const file of (await readdir(dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))) {
    const buf = await sharp(join(dir, file)).resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer()
    out["/" + dir.replace(/^public\//, "") + "/" + file] = `data:image/webp;base64,${buf.toString("base64")}`
  }
}
await writeFile("lib/data/story-blur.json", JSON.stringify(out, null, 1) + "\n")
console.log(`story-blur: ${Object.keys(out).length} previews written`)
