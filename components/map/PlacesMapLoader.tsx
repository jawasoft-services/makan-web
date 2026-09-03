'use client'

import dynamic from 'next/dynamic'
import type { MapMarker } from './PlacesMap'

// Leaflet touches `window` at import time, so the map is client-only and
// arrives after the page has painted. The box keeps its height meanwhile.
const PlacesMap = dynamic(() => import('./PlacesMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-brand-card" aria-hidden />,
})

export default function PlacesMapLoader(props: { markers: MapMarker[]; className?: string; zoom?: number; label: string }) {
  return (
    <div className={props.className}>
      <PlacesMap {...props} className="h-full" />
    </div>
  )
}
