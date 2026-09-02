"use client"

import { useEffect, useRef } from "react"

/**
 * A short, silent, looping screen recording. Plays only when the reader
 * allows motion; otherwise the poster stands in, so nothing moves uninvited.
 */
export default function DemoVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      video.play().catch(() => {})
    }
  }, [])
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      className="block h-auto w-full"
    />
  )
}
