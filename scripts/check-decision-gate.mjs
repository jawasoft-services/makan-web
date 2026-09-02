// scripts/check-decision-gate.mjs
import { readFileSync } from "node:fs"
if (process.env.DECISION_HOME !== "1") { console.log("decision-gate: DECISION_HOME is off; nothing to check."); process.exit(0) }
const g = JSON.parse(readFileSync("docs/decision-first/gate.json", "utf8"))
const problems = []
if (!g.RM19664?.live) problems.push("RM19664 (decision surface) is not live")
if (!g.RM19665?.live) problems.push("RM19665 (fallback ladder) is not live")
if (g.maitredRungOnSite && !g.RM19505?.live) problems.push("RM19505 (Maitre'D) is not live and the Maitre'D rung is still on the site")
if (problems.length) { for (const p of problems) console.error(`decision-gate: ${p}`); console.error("decision-gate: refusing to build the decision home. Update docs/decision-first/gate.json from Redmine or unset DECISION_HOME."); process.exit(1) }
console.log("decision-gate passed — release condition met.")
