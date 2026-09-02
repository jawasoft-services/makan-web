import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const M_MARK_PATH =
  "M87.5 105h72q10.12 1.37 14.5 8.5L255.5 265l3.5-1.5 75-141 9.5-13.5 8-4 .5 1.5q-4 5-2 16l9.5 15.5 8 5h3.5l-1 12.5q3 12 11.5 18.5 6.85 6.15 20 6l2-1 7 9 13 7H437v204.5q-1.48 8.52-7.5 12.5l-7 3h-60l-9.5-5-5-11.5v-167l-1.5-1.5L287 342.5l-9.5 13.5q-10.21 7.79-31 5-10.25-1.75-15.5-8.5L164.5 230l-.5 170.5-7.5 11.5-7 3h-60q-7.89-2.11-11.5-8.5l-3-8v-280l7.5-11.5 5-2Z"

/** Two words and the promise, in the brand face, for the decision home. */
export async function createDecisionSocialImage(title: string, sub: string) {
  // Node runtime: read the bundled brand face from disk. (A fetch of a
  // file: URL 500s once built, which is what the old "Satori silent-fail"
  // note was about.)
  const fontsDir = join(process.cwd(), "public", "fonts")
  const [bold, regular] = await Promise.all([
    readFile(join(fontsDir, "PlusJakartaSans-Bold.ttf")),
    readFile(join(fontsDir, "PlusJakartaSans-Regular.ttf")),
  ])
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#FFF8EF",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        <svg viewBox="0 0 512 512" width="96" height="96" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FF9932" d={M_MARK_PATH} />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 108, fontWeight: 700, lineHeight: 1, letterSpacing: "-3px", color: "#2B1503" }}>{title}</div>
            {/* The site's one gesture: a hand-drawn saffron stroke under the promise. */}
            <svg viewBox="0 0 300 24" width="975" height="28" preserveAspectRatio="none" style={{ marginTop: 10 }}>
              <path d="M8,11 C80,5 222,5 292,10" fill="none" stroke="#FF9932" strokeWidth="6" strokeLinecap="round" />
              <path d="M14,19 C92,14 212,14 286,17" fill="none" stroke="#FF9932" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
            </svg>
          </div>
          <div style={{ marginTop: 28, fontSize: 40, fontWeight: 400, lineHeight: 1.3, color: "#785739", maxWidth: 900 }}>{sub}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Plus Jakarta Sans", data: bold.buffer.slice(bold.byteOffset, bold.byteOffset + bold.byteLength) as ArrayBuffer, weight: 700, style: "normal" },
        { name: "Plus Jakarta Sans", data: regular.buffer.slice(regular.byteOffset, regular.byteOffset + regular.byteLength) as ArrayBuffer, weight: 400, style: "normal" },
      ],
    },
  )
}

export function createSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FF9932",
        }}
      >
        <svg
          viewBox="0 0 512 512"
          width="380"
          height="380"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="#FFF4E6" d={M_MARK_PATH} />
        </svg>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
