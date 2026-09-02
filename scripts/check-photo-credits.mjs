// scripts/check-photo-credits.mjs
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const credits = readFileSync("docs/decision-first/photo-credits.md", "utf8")
const credited = new Map(
  [...credits.matchAll(/^\| ([\w.-]+\.jpg) \|[^|]*\|[^|]*\| (yes|no) \|/gm)].map((m) => [m[1], m[2] === "yes"]),
)
const files = []
const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); statSync(p).isDirectory() ? walk(p) : (/\.(tsx?|mjs)$/.test(f) && files.push(p)) } }
walk("components")
const referenced = new Set()
for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/\/meals\/story\/([\w.-]+\.jpg)/g)) referenced.add(m[1])
let failed = false
for (const file of referenced) {
  if (!credited.has(file)) { console.error(`photo-credits: ${file} is used but has no credit line`); failed = true }
  else if (!credited.get(file)) { console.error(`photo-credits: ${file} is not marked public`); failed = true }
}
if (failed) process.exit(1)
console.log(`photo-credits passed — ${referenced.size} story photos credited and public.`)
