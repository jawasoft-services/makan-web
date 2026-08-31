import type { Metadata } from "next"
import { notFound } from "next/navigation"
import InviteLanding from "./InviteLanding"

const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{12}$/

export const metadata: Metadata = {
  title: "Join a table on Makan",
  description: "A friend invited you to connect on Makan.",
  robots: { index: false, follow: false },
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; publicId: string }>
}) {
  const { publicId } = await params
  if (!PUBLIC_ID_PATTERN.test(publicId)) notFound()
  return <InviteLanding publicId={publicId} />
}
