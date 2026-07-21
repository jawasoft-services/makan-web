import type { Metadata } from "next"
import AppLanding from "./AppLanding"
import { createPageMetadata } from "@/lib/site-metadata"

export const metadata: Metadata = createPageMetadata({
  title: "Get Makan",
  description: "Get Makan — a food journal. Remember every meal.",
  path: "/app",
})

export default function AppPage() {
  return <AppLanding />
}
