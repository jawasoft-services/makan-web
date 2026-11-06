import crypto from "node:crypto"
import type { Firestore } from "firebase-admin/firestore"

// RM20320 — what the web landing for a taste-match link may show: the sharer's name and
// photo plus their top three PUBLIC meals. The app's previewTasteInvite callable
// (munchies-rn functions/tasteInvite.js) applies the same rules; keep the two in step.

export const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{12}$/
export const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/
const MAX_TEASER_MEALS = 3

export type TasteInviteState = "active" | "expired" | "revoked" | "invalid" | "unavailable"

export type TasteInviteMeal = { mealId: string; caption: string; locationName: string; imageURL: string }

export type TasteInvitePreview = {
  state: TasteInviteState
  hostDisplayName: string
  hostAvatarUrl: string
  meals: TasteInviteMeal[]
}

const EMPTY: Omit<TasteInvitePreview, "state"> = { hostDisplayName: "", hostAvatarUrl: "", meals: [] }

type Doc = Record<string, unknown> | undefined

const clip = (value: unknown, max: number): string => (typeof value === "string" ? value.trim().slice(0, max) : "")

const secretMatches = (stored: unknown, supplied: string): boolean => {
  if (typeof stored !== "string" || !SECRET_PATTERN.test(supplied)) return false
  const a = Buffer.from(stored)
  const b = Buffer.from(supplied)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Same answer as the app's tasteGraphTop3 publicMeal(), narrowed to isPublic === true:
// the top-3 projection also holds friends-only meals, which a stranger must never see.
const isPublicMeal = (meal: Doc, hostUid: string): boolean =>
  Boolean(
    meal
    && meal.isPublic === true
    && meal.isDeleted !== true
    && !meal.deletedAt
    && meal.isPublicDraft !== true
    && meal.isLocalDraft !== true
    && meal.isLocalOnly !== true
    && meal.storageScope !== "local_private"
    && (!meal.moderationStatus || meal.moderationStatus === "active")
    && meal.userID === hostUid,
  )

const isActiveProfile = (user: Doc): boolean => {
  if (!user) return false
  if (user.accountStatus && user.accountStatus !== "active") return false
  const done = typeof user.profileSetupCompletedAt === "string" && user.profileSetupCompletedAt.trim()
  return Boolean(done || ((user.name || user.display_name) && (user.username || user.username_normalized)))
}

// Same bar as the app's search and social surfaces: hidden, held, suspended or deleted hosts are not shown.
const HIDDEN = new Set(["deleted", "disabled", "held", "hidden", "moderated", "pending", "suspended"])
const isHidden = (user: Doc): boolean =>
  Boolean(user?.deletedAt || user?.isDeleted === true)
  || [user?.moderationStatus, user?.visibility_status, user?.status].some(
    (value) => typeof value === "string" && HIDDEN.has(value.trim().toLowerCase()),
  )

const hostName = (user: Doc): string =>
  clip(user?.name, 80) || clip(user?.display_name, 80) || clip(user?.username, 80) || "A Makan friend"

export async function loadTasteInvitePreview(
  db: Firestore,
  publicId: string,
  secret: string,
  nowMs: number = Date.now(),
): Promise<TasteInvitePreview> {
  const invalid = { state: "invalid" as const, ...EMPTY }
  if (!PUBLIC_ID_PATTERN.test(publicId) || !SECRET_PATTERN.test(secret)) return invalid

  const config = (await db.doc("config/tasteMatchInvite").get()).data() as Doc
  if (config?.enabled !== true) return { state: "unavailable", ...EMPTY }

  const invite = (await db.doc(`tasteInvites/${publicId}`).get()).data() as Doc
  if (!invite || !secretMatches(invite.secret, secret)) return invalid
  if (invite.status === "revoked") return { state: "revoked", ...EMPTY }
  const expiresAt = invite.expiresAt as { toMillis?: () => number } | undefined
  const expiresAtMs = expiresAt?.toMillis?.()
  if (!Number.isFinite(expiresAtMs) || Number(expiresAtMs) <= nowMs) return { state: "expired", ...EMPTY }
  if (invite.status !== "active" || typeof invite.hostUid !== "string") return invalid

  const hostUid = invite.hostUid
  const host = (await db.doc(`users/${hostUid}`).get()).data() as Doc
  if (!isActiveProfile(host) || isHidden(host)) return invalid

  const projection = (await db.doc(`users/${hostUid}/publicTasteGraph/top3`).get()).data() as Doc
  const ids = (Array.isArray(projection?.entries) ? (projection.entries as { mealId?: unknown }[]) : [])
    .map((entry) => entry?.mealId)
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .slice(0, MAX_TEASER_MEALS)
  const snapshots = ids.length ? await db.getAll(...ids.map((id) => db.doc(`meals/${id}`))) : []
  const meals = snapshots.flatMap((snap, index) => {
    const meal = snap.data() as Doc
    if (!meal || !isPublicMeal(meal, hostUid)) return []
    const imageURL = typeof meal.imageURL === "string" && meal.imageURL.startsWith("https://") ? meal.imageURL : ""
    return [{ mealId: ids[index], caption: clip(meal.caption, 80), locationName: clip(meal.locationName, 60), imageURL }]
  })

  const avatar = host?.photoURL ?? host?.profileImageUrl
  return {
    state: "active",
    hostDisplayName: hostName(host),
    hostAvatarUrl: typeof avatar === "string" && avatar.startsWith("https://") ? avatar.slice(0, 2048) : "",
    meals,
  }
}
