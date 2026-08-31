import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { getDb } from "@/lib/firebase-admin"
import {
  ALLOWED_ORIGINS,
  isAllowedOrigin,
  parseSafeJson,
} from "@/lib/api-validation"

export const runtime = "nodejs"

const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{12}$/
const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/
const CONSENT_VERSION = 2

type PreviewBody = {
  publicId?: unknown
  secret?: unknown
}

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  })

const invalidPreview = () => json({
  state: "invalid",
  hostDisplayName: "",
  hostAvatarUrl: "",
  expiresAt: null,
})

const hashSecret = (secret: string): Buffer =>
  crypto.createHash("sha256").update(secret).digest()

const secretMatches = (storedHex: unknown, secret: string): boolean => {
  if (typeof storedHex !== "string" || !/^[a-f0-9]{64}$/i.test(storedHex)) return false
  const stored = Buffer.from(storedHex, "hex")
  const candidate = hashSecret(secret)
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate)
}

const inviteState = (data: Record<string, unknown>, now: number): string => {
  if (data.consentVersion !== CONSENT_VERSION) return "invalid"
  if (data.status === "revoked") return "revoked"
  if (data.status === "full") return "full"
  const expiresAt = data.expiresAt as { toMillis?: () => number } | undefined
  const expiresAtMs = expiresAt?.toMillis?.()
  if (!Number.isFinite(expiresAtMs) || Number(expiresAtMs) <= now) return "expired"
  return data.status === "active" ? "active" : "invalid"
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request, ALLOWED_ORIGINS)) return json({ error: "Forbidden." }, 403)

  const body = await parseSafeJson<PreviewBody>(request, 1024)
  if (
    !body
    || typeof body.publicId !== "string"
    || typeof body.secret !== "string"
    || !PUBLIC_ID_PATTERN.test(body.publicId)
    || !SECRET_PATTERN.test(body.secret)
  ) {
    return invalidPreview()
  }

  try {
    const db = getDb()
    if (!db) return json({ error: "Invite preview is unavailable." }, 503)

    const snap = await db.doc(`tableInvites/${body.publicId}`).get()
    if (!snap.exists) return invalidPreview()
    const data = snap.data() as Record<string, unknown>
    if (!secretMatches(data.tokenHash, body.secret)) return invalidPreview()

    const expiresAt = data.expiresAt as { toDate?: () => Date } | undefined
    const displayName = typeof data.hostDisplayName === "string"
      ? data.hostDisplayName.trim().slice(0, 80)
      : "A Makan friend"
    const avatarUrl = typeof data.hostAvatarUrl === "string" && data.hostAvatarUrl.startsWith("https://")
      ? data.hostAvatarUrl.slice(0, 2048)
      : ""

    return json({
      state: inviteState(data, Date.now()),
      hostDisplayName: displayName || "A Makan friend",
      hostAvatarUrl: avatarUrl,
      expiresAt: expiresAt?.toDate?.().toISOString() || null,
    })
  } catch {
    // The credential and document path are intentionally omitted from logs.
    console.error("Table invite preview failed")
    return json({ error: "Invite preview is unavailable." }, 503)
  }
}
