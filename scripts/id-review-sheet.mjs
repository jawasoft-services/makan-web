// scripts/id-review-sheet.mjs — writes an en/id side-by-side sheet for the Decision namespace
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
const en = JSON.parse(readFileSync("messages/en.json", "utf8")).Decision
const id = JSON.parse(readFileSync("messages/id.json", "utf8")).Decision
const rows = []
for (const ns of Object.keys(en)) for (const k of Object.keys(en[ns])) rows.push([`${ns}.${k}`, en[ns][k], id[ns]?.[k] ?? "(missing)"])
const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ")
const out = ["# Indonesian review — Decision namespace", "", "Mark a row `fix` in the last column and write the better line under it. Rows without `fix` are approved.", "", "| key | en | id | fix? |", "|---|---|---|---|", ...rows.map(([k, e, i]) => `| \`${k}\` | ${esc(e)} | ${esc(i)} | |`), ""]
mkdirSync("docs/decision-first", { recursive: true })
writeFileSync("docs/decision-first/id-review.md", out.join("\n"))
console.log(`id-review: ${rows.length} rows written to docs/decision-first/id-review.md`)
