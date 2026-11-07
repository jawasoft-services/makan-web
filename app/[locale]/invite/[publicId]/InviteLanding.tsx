"use client"

import StoreLink from "@/components/home/StoreLink"
import styles from "@/components/standings/public-pages.module.css"
import { goToStoreWithLink, phoneKind } from "@/lib/carry-link"

import Image from "next/image"
import Link from "next/link"
import { track } from "@/lib/website-analytics"
import { useEffect, useMemo, useState } from "react"

type InviteState = "active" | "expired" | "revoked" | "full" | "invalid"

type Preview = {
  state: InviteState
  hostDisplayName: string
  hostAvatarUrl: string
  expiresAt: string | null
}

const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{12}$/
const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/

const terminalCopy: Record<Exclude<InviteState, "active">, { title: string; body: string }> = {
  expired: {
    title: "This invite has ended",
    body: "Ask your friend to open a new table invite.",
  },
  revoked: {
    title: "This invite was closed",
    body: "Ask your friend to open a new table invite.",
  },
  full: {
    title: "This table is full",
    body: "Six people have already joined this invite.",
  },
  invalid: {
    title: "This invite isn’t available",
    body: "The link may be incomplete. Ask your friend to share it again.",
  },
}

const initialsFor = (name: string): string =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0]?.toUpperCase()).join("") || "M"

const canRenderRemoteAvatar = (url: string): boolean => {
  try {
    return new URL(url).hostname === "firebasestorage.googleapis.com"
  } catch {
    return false
  }
}

export default function InviteLanding({ publicId }: { publicId: string }) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [secret, setSecret] = useState("")
  const [error, setError] = useState("")
  const [attemptedOpen, setAttemptedOpen] = useState(false)

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const nextSecret = fragment.get("s") || ""
    if (!PUBLIC_ID_PATTERN.test(publicId) || !SECRET_PATTERN.test(nextSecret)) {
      queueMicrotask(() => setPreview({
        state: "invalid",
        hostDisplayName: "",
        hostAvatarUrl: "",
        expiresAt: null,
      }))
      return
    }

    const controller = new AbortController()
    void fetch("/api/table-invite/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId, secret: nextSecret }),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("preview unavailable")
        return response.json() as Promise<Preview>
      })
      .then((nextPreview) => {
        setSecret(nextSecret)
        setPreview(nextPreview)
      })
      .catch((requestError: unknown) => {
        if ((requestError as { name?: string })?.name !== "AbortError") {
          setError("We couldn’t open this invite. Try again.")
        }
      })
    return () => controller.abort()
  }, [publicId])

  const appUrl = useMemo(
    () => secret ? `makanapp://invite/${publicId}?s=${encodeURIComponent(secret)}` : "",
    [publicId, secret],
  )

  const openApp = () => {
    if (!appUrl) return
    setAttemptedOpen(true)
    track("Table Invite Open App Clicked", { invite_state: preview?.state || "unknown" })
    window.location.href = appUrl
  }

  if (error) {
    return (
      <InviteShell>
        <StatusIcon />
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-ink">Couldn’t open the invite</h1>
        <p className="max-w-sm text-base leading-relaxed text-brand-muted">{error}</p>
        <button type="button" onClick={() => window.location.reload()} className={styles.primary}>Try again</button>
      </InviteShell>
    )
  }

  if (!preview) {
    return (
      <InviteShell>
        <Image src="/redesign/food-noodles.svg" alt="" width={140} height={125} className={styles.statusArt} />
        <h1 className="sr-only">Table invite</h1>
        <p role="status" className="font-medium text-brand-muted">Opening invite…</p>
      </InviteShell>
    )
  }

  if (preview.state !== "active") {
    const copy = terminalCopy[preview.state]
    return (
      <InviteShell>
        <StatusIcon />
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-ink">{copy.title}</h1>
        <p className="max-w-sm text-base leading-relaxed text-brand-muted">{copy.body}</p>
        <Link href="/" className={styles.primary}>Go to Makan</Link>
      </InviteShell>
    )
  }

  const hostName = preview.hostDisplayName || "A Makan friend"
  // Always the canonical /invite/ form, even when this page was opened under an /id/ prefix.
  const carryInviteThroughInstall = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (phoneKind() === "other") return
    event.preventDefault()
    void goToStoreWithLink(`https://www.makanofficial.com/invite/${publicId}${window.location.hash}`)
  }
  return (
    <InviteShell>
      <p className={styles.tag}>Table invite</p>
      <div className={`${styles.hostAvatar} flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-brand-orange/25 bg-white text-3xl font-extrabold text-brand-ink`}>
        {canRenderRemoteAvatar(preview.hostAvatarUrl) ? (
          <Image
            src={preview.hostAvatarUrl}
            alt=""
            width={112}
            height={112}
            className="h-full w-full object-cover"
            priority
          />
        ) : initialsFor(hostName)}
      </div>
      <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-brand-ink sm:text-4xl">
        {hostName} invited you to their table
      </h1>
      <p className="max-w-md text-base leading-relaxed text-brand-muted sm:text-lg">
        Open Makan to see the invite. Join to become Makan friends with {hostName} and everyone else who joins this table.
      </p>
      <button type="button" onClick={openApp} className={styles.primary}>Open in Makan</button>
      <StoreLink
        location="table-invite"
        // RM20333 — the secret lives only in this page's #fragment; a phone's store button carries the
        // whole link through install (Play referrer on Android, clipboard + Paste on iPhone), never a server.
        onStoreClick={carryInviteThroughInstall}
        className={styles.textLink}
      >
        Get Makan on the App Store
      </StoreLink>
      <p className={styles.handoffNote}>
        {attemptedOpen
          ? "If Makan didn’t open, install it below. Then come back to this link after setup."
          : "Installing Makan now? Your invite comes with you: Makan opens it after setup. On iPhone, tap Paste when Makan asks."}
      </p>
    </InviteShell>
  )
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className={`${styles.page} ${styles.handoff} ${styles.focused}`}>
      <Image src="/makan-logo-orange.svg" alt="Makan" width={160} height={38} className={styles.wordmark} priority />
      {children}
    </main>
  )
}

function StatusIcon() {
  return <Image src="/redesign/food-noodles.svg" alt="" width={140} height={125} className={styles.statusArt} />
}
