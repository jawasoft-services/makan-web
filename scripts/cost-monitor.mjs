#!/usr/bin/env node
// Daily Firestore reads by type and Places API calls by method, from Cloud
// Monitoring, for the pass condition in
// docs/2026-09-05-prd-cost-firestore-places.md §7. Uses the gcloud
// application-default credential (run `gcloud auth application-default
// login` once). Usage: node scripts/cost-monitor.mjs [days]   (default 8)
//   --hourly   one row per hour instead of per day (for the hours after a deploy)
import { execSync } from "node:child_process"

const PROJECT = "munchies-expo"
const HOURLY = process.argv.includes("--hourly")
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"))
const DAYS = Number(args[0] ?? (HOURLY ? 1.5 : 8))
// Points are hourly windows ending on the hour; a day is the UTC calendar
// day those windows fall in, so the table matches Billing's daily figures.
const bucket = (iso) => (HOURLY ? iso.slice(0, 13) + "Z" : new Date(new Date(iso).getTime() - 1).toISOString().slice(0, 10))
const QUERY_LIMIT = 200_000 // Firestore QUERY reads per day
const PHOTO_LIMIT = 100 // Places GetPhotoMedia per day

const token = execSync("gcloud auth application-default print-access-token", { encoding: "utf8" }).trim()
const end = new Date()
end.setUTCMinutes(0, 0, 0)
end.setUTCHours(end.getUTCHours() + 1)
const start = new Date(end.getTime() - Math.ceil(DAYS) * 86400_000)
start.setUTCHours(0, 0, 0, 0)

async function series(filter, groupBy) {
  const params = new URLSearchParams({
    filter,
    "interval.startTime": start.toISOString(),
    "interval.endTime": end.toISOString(),
    "aggregation.alignmentPeriod": "3600s",
    "aggregation.perSeriesAligner": "ALIGN_SUM",
    "aggregation.crossSeriesReducer": "REDUCE_SUM",
  })
  for (const g of groupBy) params.append("aggregation.groupByFields", g)
  const res = await fetch(`https://monitoring.googleapis.com/v3/projects/${PROJECT}/timeSeries?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.timeSeries ?? []
}

function byDay(ts, labelOf) {
  const days = new Map() // day -> { label -> value }
  for (const s of ts) {
    const label = labelOf(s)
    for (const p of s.points ?? []) {
      const day = bucket(p.interval.endTime)
      const v = Number(p.value.int64Value ?? p.value.doubleValue ?? 0)
      const row = days.get(day) ?? {}
      row[label] = (row[label] ?? 0) + v
      days.set(day, row)
    }
  }
  return [...days.entries()].sort()
}

const fmt = (n) => (n === undefined ? "-" : Math.round(n).toLocaleString("en-GB"))

const reads = await series('metric.type="firestore.googleapis.com/document/read_count"', ["metric.label.type"])
const places = await series(
  'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.label.service="places.googleapis.com"',
  ["resource.label.method"],
)

console.log(`Firestore document reads per day, ${PROJECT} (pass: QUERY <= ${QUERY_LIMIT.toLocaleString("en-GB")})`)
console.log(`${HOURLY ? "hour (end)      " : "day         "}LOOKUP       QUERY        total     `)
for (const [day, row] of byDay(reads, (s) => s.metric.labels?.type ?? "?")) {
  const q = row.QUERY ?? 0
  const limit = HOURLY ? QUERY_LIMIT / 24 : QUERY_LIMIT
  const total = Object.values(row).reduce((a, b) => a + b, 0)
  console.log(`${day}  ${fmt(row.LOOKUP).padStart(10)}  ${fmt(q).padStart(10)}  ${fmt(total).padStart(10)}  ${q > limit ? "FAIL" : "ok"}`)
}
console.log()
console.log(`Places API calls per day (pass: GetPhotoMedia <= ${PHOTO_LIMIT})`)
const placeDays = byDay(places, (s) => (s.resource?.labels?.method ?? "?").split(".").pop())
const methods = [...new Set(placeDays.flatMap(([, row]) => Object.keys(row)))].sort()
console.log((HOURLY ? "hour (end)      " : "day         ") + methods.map((m) => m.padStart(14)).join(""))
for (const [day, row] of placeDays) {
  const photo = row.GetPhotoMedia ?? 0
  console.log(`${day}  ${methods.map((m) => fmt(row[m]).padStart(14)).join("")}  ${photo > (HOURLY ? PHOTO_LIMIT / 24 : PHOTO_LIMIT) ? "FAIL" : "ok"}`)
}
console.log("\n(UTC calendar days; today is partial. Confirm spend in Billing → Reports by SKU; there is no billing export to query.)")
