'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { MapMarker } from './PlacesMap'

// Leaflet touches `window` at import time, so the map is client-only. It is
// also deferred until its box is near the viewport, so the library and the
// tiles never compete with the page's first paint.
const PlacesMap = dynamic(() => import('./PlacesMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-brand-card" aria-hidden />,
})

export default function PlacesMapLoader(props: { markers: MapMarker[]; className?: string; zoom?: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      // No observer support: show the map after the first paint instead.
      const t = setTimeout(() => setNear(true), 800)
      return () => clearTimeout(t)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={props.className}>
      {near ? <PlacesMap {...props} className="h-full" /> : <div className="h-full w-full rounded-2xl bg-brand-card" aria-hidden />}
    </div>
  )
}
