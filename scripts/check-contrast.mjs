import { readFile } from "node:fs/promises"

const config = await readFile("tailwind.config.ts", "utf8")
const muted = config.match(/muted:\s*"(#[0-9A-Fa-f]{6})"/)?.[1]
if (!muted) {
  console.error("Could not read brand.muted from tailwind.config.ts")
  process.exit(1)
}

const channel = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
const ratio = (a, b) => {
  const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// #e4dace is the darkest patch of the paper stack (spec 2026-09-01 §6.2)
const DARKEST_PAPER = "#e4dace"
const measured = ratio(muted, DARKEST_PAPER)
if (measured < 4.5) {
  console.error(
    `brand.muted ${muted} is ${measured.toFixed(2)}:1 on the darkest paper ` +
      `(${DARKEST_PAPER}); AA body text needs 4.5:1.`,
  )
  process.exit(1)
}
console.log(`contrast passed — brand.muted ${muted} is ${measured.toFixed(2)}:1 on paper.`)
