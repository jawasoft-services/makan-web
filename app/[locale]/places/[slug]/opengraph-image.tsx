import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import en from "@/messages/en.json"
import id from "@/messages/id.json"
import { createDecisionSocialImage } from "../../_social-image"
import { getEatStandings } from "@/lib/eat-standings"
import { getDirectoryPlace } from "@/lib/place-directory"

export const alt = "On Makan"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// The card an owner posts: a real meal photo from the place on the left,
// the name and the rank line on the right. Falls back to the text card
// when there is no photo.
export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const t = (locale === "id" ? id : en).Places
  const place = await getDirectoryPlace(slug)
  if (!place) return createDecisionSocialImage("Makan", t.somewhere, 108)
  const standings = await getEatStandings()
  const row = standings.all.find((r) => r.placeId === place.placeId) ?? null
  const city = place.where ? standings.cities.find((c) => c.city === place.where?.city) : undefined
  const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""))
  const line =
    row && row.cityRank !== null && city
      ? fill(t.rankCity, { rank: row.cityRank, city: city.city })
      : row && row.rank !== null
        ? fill(t.rankGlobal, { rank: row.rank })
        : row && row.matchups > 0
          ? fill(t.cardUnranked, { matchups: row.matchups })
          : fill(t.cardMeals, { count: place.meals.length })
  const eats = row && row.rank !== null ? ` · ${row.eats} ${t.eats}` : ""
  const where = place.where && !(row && row.cityRank !== null && city) ? ` · ${place.where.city}` : ""
  const photo = place.meals[0]?.src
  if (!photo) {
    const sizeFor = place.name.length > 24 ? 64 : place.name.length > 14 ? 84 : 108
    return createDecisionSocialImage(place.name, `${line}${eats}${where}`, sizeFor)
  }
  const fontsDir = join(process.cwd(), "public", "fonts")
  const [bold, regular] = await Promise.all([readFile(join(fontsDir, "PlusJakartaSans-Bold.ttf")), readFile(join(fontsDir, "PlusJakartaSans-Regular.ttf"))])
  const nameSize = place.name.length > 28 ? 44 : place.name.length > 18 ? 56 : 68
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#FFF8EF", fontFamily: "Plus Jakarta Sans" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" width={560} height={630} style={{ width: 560, height: 630, objectFit: "cover" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 56px 56px 60px", width: 640 }}>
          <svg viewBox="0 0 512 512" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#FF9932"
              d="M87.5 105h72q10.12 1.37 14.5 8.5L255.5 265l3.5-1.5 75-141 9.5-13.5 8-4 .5 1.5q-4 5-2 16l9.5 15.5 8 5h3.5l-1 12.5q3 12 11.5 18.5 6.85 6.15 20 6l2-1 7 9 13 7H437v204.5q-1.48 8.52-7.5 12.5l-7 3h-60l-9.5-5-5-11.5v-167l-1.5-1.5L287 342.5l-9.5 13.5q-10.21 7.79-31 5-10.25-1.75-15.5-8.5L164.5 230l-.5 170.5-7.5 11.5-7 3h-60q-7.89-2.11-11.5-8.5l-3-8v-280l7.5-11.5 5-2Z"
            />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: nameSize, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-1.5px", color: "#2B1503" }}>{place.name}</div>
            <div style={{ marginTop: 22, fontSize: 30, fontWeight: 400, lineHeight: 1.3, color: "#785739" }}>{`${line}${eats}${where}`}</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#FF9932" }}>makanofficial.com</div>
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
