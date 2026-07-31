"use client"

import Image from "next/image"
import Link from "next/link"
import { track } from "@vercel/analytics"
import { useEffect, useMemo, useState } from "react"
import { APP_STORE_URL } from "@/lib/links"

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
    () => secret ? `makanapp://invite/${publicId}#s=${encodeURIComponent(secret)}` : "",
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
        <button type="button" onClick={() => window.location.reload()} className="invite-primary">Try again</button>
      </InviteShell>
    )
  }

  if (!preview) {
    return (
      <InviteShell>
        <div className="h-20 w-20 animate-pulse rounded-full bg-brand-orange/15" aria-hidden />
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
        <Link href="/" className="invite-primary">Go to Makan</Link>
      </InviteShell>
    )
  }

  const hostName = preview.hostDisplayName || "A Makan friend"
  return (
    <InviteShell>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange">Table invite</p>
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-brand-orange/25 bg-white text-3xl font-extrabold text-brand-ink shadow-sm">
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
      <button type="button" onClick={openApp} className="invite-primary">Open in Makan</button>
      <a
        href={APP_STORE_URL}
        onClick={() => track("App Store CTA Clicked", { location: "table-invite" })}
        className="inline-flex min-h-12 items-center justify-center px-5 font-semibold text-brand-muted underline decoration-brand-orange/50 underline-offset-4 hover:text-brand-ink"
      >
        Get Makan on the App Store
      </a>
      <p className="max-w-sm text-sm leading-relaxed text-brand-muted">
        {attemptedOpen
          ? "If Makan didn’t open, install it below. Then come back to this link after setup."
          : "Installing Makan now? Come back to this link after setup—the invite won’t carry into a fresh install."}
      </p>
    </InviteShell>
  )
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-brand-cream px-6 py-14 text-center">
      <Image src="/makan-logo-orange.svg" alt="Makan" width={160} height={38} className="mb-3 h-auto w-36" priority />
      {children}
    </main>
  )
}

function StatusIcon() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-9 w-9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
      </svg>
    </div>
  )
}
