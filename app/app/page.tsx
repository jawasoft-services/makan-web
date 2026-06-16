import type { Metadata } from "next"
import AppLanding from "./AppLanding"

export const metadata: Metadata = {
  title: "Get Makan",
  description: "Get Makan — a food journal. Remember every meal.",
  alternates: { canonical: "https://www.makanofficial.com/app" },
}

export default function AppPage() {
  return <AppLanding />
}
