'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

export interface MapMarker {
  slug: string
  name: string
  lat: number
  lng: number
  /** One short line under the name in the popup, e.g. "#1 · 14 Eats". */
  line?: string
  href: string
}

/**
 * An OpenStreetMap map of restaurants (Leaflet, no key, no tracking).
 * Saffron circle markers; each popup links to the restaurant's page. Loaded
 * on the client only: Leaflet needs a window. Tiles are OSM's own, with the
 * attribution they require.
 */
export default function PlacesMap({
  markers,
  className = '',
  zoom,
  label,
}: {
  markers: MapMarker[]
  className?: string
  /** Fixed zoom for a single marker; otherwise the map fits all markers. */
  zoom?: number
  /** Accessible name for the map region. */
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !markers.length) return
    let map: import('leaflet').Map | null = null
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !ref.current) return
      map = L.map(el, { scrollWheelZoom: false, attributionControl: true })
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      const points: [number, number][] = []
      for (const m of markers) {
        points.push([m.lat, m.lng])
        const marker = L.circleMarker([m.lat, m.lng], {
          radius: 9,
          color: '#FFF4E6',
          weight: 2,
          fillColor: '#FF9932',
          fillOpacity: 1,
        }).addTo(map)
        const safe = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
        marker.bindPopup(
          `<a href="${safe(m.href)}" style="font-weight:700;color:#2B1503;text-decoration:underline;text-decoration-color:#FF9932;text-underline-offset:3px">${safe(m.name)}</a>` +
            (m.line ? `<div style="color:#785739;margin-top:2px">${safe(m.line)}</div>` : ''),
          { closeButton: false },
        )
        marker.bindTooltip(m.name, { direction: 'top', offset: [0, -8] })
      }
      if (points.length === 1) map.setView(points[0], zoom ?? 15)
      else map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 14 })
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [markers, zoom])

  if (!markers.length) return null
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      className={`w-full overflow-hidden rounded-2xl border border-brand-line bg-brand-card ${className}`}
    />
  )
}
