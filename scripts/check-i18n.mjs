import { readFile } from "node:fs/promises"

const english = JSON.parse(await readFile("messages/en.json", "utf8"))
const indonesian = JSON.parse(await readFile("messages/id.json", "utf8"))

function leafKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return child && typeof child === "object"
      ? leafKeys(child, path)
      : [path]
  })
}

const enKeys = new Set(leafKeys(english))
const idKeys = new Set(leafKeys(indonesian))
const missingInIndonesian = [...enKeys].filter((key) => !idKeys.has(key))
const missingInEnglish = [...idKeys].filter((key) => !enKeys.has(key))

if (missingInIndonesian.length || missingInEnglish.length) {
  console.error("Translation keys are out of sync.")
  if (missingInIndonesian.length) {
    console.error(`Missing in Indonesian: ${missingInIndonesian.join(", ")}`)
  }
  if (missingInEnglish.length) {
    console.error(`Missing in English: ${missingInEnglish.join(", ")}`)
  }
  process.exit(1)
}

const indonesianSource = JSON.stringify(indonesian)
for (const productTerm of [
  "Eat or Yeet",
  "Top 4",
  "Public",
  "Friends Only",
]) {
  if (!indonesianSource.includes(productTerm)) {
    console.error(`Indonesian copy must preserve product term: ${productTerm}`)
    process.exit(1)
  }
}

const availability = await readFile("i18n/availability.ts", "utf8")
for (const path of [
  '"/"',
  '"/app"',
  '"/contact"',
  '"/manifesto"',
  '"/partner"',
  '"/story"',
  '"/support"',
]) {
  if (!availability.includes(path)) {
    console.error(`Missing Indonesian route declaration: ${path}`)
    process.exit(1)
  }
}

for (const englishOnlyPath of [
  '"/blog"',
  '"/privacy-policy"',
  '"/tos"',
  '"/meal"',
  '"/r"',
]) {
  if (availability.includes(englishOnlyPath)) {
    console.error(`English-only route was accidentally enabled: ${englishOnlyPath}`)
    process.exit(1)
  }
}

console.log(
  `i18n passed — ${enKeys.size} shared message keys and route availability are in sync.`,
)
