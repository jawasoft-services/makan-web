'use client'

import { useEffect } from 'react'
import type { AgrData } from './types'

/** What the client runtime needs that is not already in the page's HTML. */
export interface AgrClientData {
  locale: string
  dishes: { name: string; venue: string; src: string }[]
  /** [lat, lng, thumbnail URL or ""]: compact, since it travels in the page payload. */
  pins: [number, number, string][]
  assets: AgrData['assets']
  t: Record<string, string>
}

type Idle = (cb: () => void, opts?: { timeout: number }) => number

/**
 * RM20773: starts the home page's scroll scenes and 3D layers. Nothing heavy runs before the page has
 * painted: the runtime (three.js and the scenes) is imported once the page has loaded and the browser
 * is idle, or on the first scroll, pointer move, touch or key, whichever comes first. The text is already on the page.
 */
export default function AgrRuntime({ data }: { data: AgrClientData }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('main.agr')
    if (!root) return
    // With JavaScript, the scenes take over from the static, readable layout.
    root.classList.remove('agr-nojs')

    let cancelled = false
    let started = false
    let api: { destroy(): void } | null = null
    let idle = 0
    let timer = 0
    const triggers = ['scroll', 'pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel'] as const
    const start = () => {
      if (started || cancelled) return
      started = true
      stopWaiting()
      import('./runtime/agr-runtime.js')
        .then((m) => {
          if (!cancelled) api = m.mountAgr(root, data)
        })
        .catch((err) => console.error('agr runtime failed to load', err))
    }
    const stopWaiting = () => {
      for (const ev of triggers) removeEventListener(ev, start)
      removeEventListener('load', onLoad)
      const cancelIdle = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback
      if (idle && cancelIdle) cancelIdle(idle)
      clearTimeout(timer)
    }
    const onLoad = () => {
      const ric = (window as unknown as { requestIdleCallback?: Idle }).requestIdleCallback
      if (ric) idle = ric(start, { timeout: 2000 })
      else timer = window.setTimeout(start, 1200)
    }
    for (const ev of triggers) addEventListener(ev, start, { passive: true, once: true })
    if (document.readyState === 'complete') onLoad()
    else addEventListener('load', onLoad, { once: true })

    return () => {
      cancelled = true
      stopWaiting()
      api?.destroy()
      api = null
    }
  }, [data])

  return null
}
