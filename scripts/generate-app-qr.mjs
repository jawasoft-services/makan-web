/** Generate the first-party /app QR used beside the desktop homepage CTA. */
import QRCode from "qrcode"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const output = join(here, "..", "public", "app-download-qr.svg")

await QRCode.toFile(output, "https://www.makanofficial.com/app", {
  type: "svg",
  margin: 2,
  errorCorrectionLevel: "Q",
  color: { dark: "#2B1503", light: "#FFFFFF" },
})

console.log("Generated public/app-download-qr.svg")
