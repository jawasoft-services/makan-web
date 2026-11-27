'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const CURSOR = '<svg viewBox="0 0 76 76" width="76" height="76" overflow="visible"><g class="chops"><g class="stB"><path d="M64.7 10.7 L13.1 63.1 Q12.8 65.1 14.9 64.9 L69.3 15.3 Q68.4 11.6 64.7 10.7Z" fill="#F2C38B" stroke="#11181C" stroke-width="2" stroke-linejoin="round"/><path d="M59.6 15.9 L53.4 22.2 L57.3 26.3 L63.8 20.3Z" fill="#FF9932" stroke="#11181C" stroke-width="1.4" stroke-linejoin="round"/><path d="M50.3 27.5 L28.5 49.3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".75"/></g><g class="stA"><path d="M55.7 2.7 L6.1 57.1 Q5.9 59.2 7.9 58.9 L60.3 7.3 Q59.4 3.6 55.7 2.7Z" fill="#F2C38B" stroke="#11181C" stroke-width="2" stroke-linejoin="round"/><path d="M50.7 8.2 L44.7 14.7 L48.8 18.6 L55.1 12.4Z" fill="#FF9932" stroke="#11181C" stroke-width="1.4" stroke-linejoin="round"/><path d="M41.9 20.1 L20.9 42.8" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".75"/></g></g><circle class="chopdot" cx="9" cy="63" r="3.2" fill="#FF9932" stroke="#11181C" stroke-width="1.4"/><g class="clack" stroke="#FF9932" stroke-width="2.6" stroke-linecap="round"><line x1="7.8" y1="69.9" x2="6.7" y2="75.8"/><line x1="3.6" y1="67.5" x2="-1.0" y2="71.4"/><line x1="2.0" y1="63.0" x2="-4.0" y2="63.0"/><line x1="3.6" y1="58.5" x2="-1.0" y2="54.6"/><line x1="7.8" y1="56.1" x2="6.7" y2="50.2"/></g></svg>'

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const jump = (y: number) => window.scrollTo({ top: y, left: 0, behavior: 'instant' })

declare global { interface WindowEventMap { 'makan:jump': Event } }

/** Snaps and holds stand down for this long after a section jump, so they never pull the page away from it. */
export const JUMP_QUIET_MS = 1200

/**
 * Devon, 27 Nov 2026: header links must land instantly at the top of their page or section. A link to a
 * section of the page already open (the home page's /#c3b, /#get, /#story) jumps there at once: no smooth
 * scroll down the long home page, and the magnetic stops are told to stand down (`makan:jump`). A link to
 * another page navigates as usual; the home page's HashScroll lands it the same way.
 */
export function jumpToSection(el: Element) {
  window.dispatchEvent(new Event('makan:jump'))
  jump(el.getBoundingClientRect().top + window.scrollY)
}

/**
 * The shell's motion runtime, from the approved prototype's kit.js, for every page:
 * - the chopsticks cursor (mouse only);
 * - [data-rise] / [data-pop] land once as they come into view, [data-count] counts up;
 * - [data-read] parts come up to full as they reach the reading line;
 * - the header turns cream over a `.dark` chapter (main > section) and steps aside at the footer;
 * - [data-stop] magnetic stops: after scrolling stops, the page eases onto the next stop in the direction
 *   of travel, then holds there for a beat;
 * - a document page's contents list (.doc-toc) follows the section being read.
 * Reduced motion: everything shows at once, no snapping, no cursor animation.
 */
export default function SiteMotion() {
  const pathname = usePathname()

  // Devon, 27 Nov 2026: FAQ answers open one at a time and animate. The <details name> groups already close the
  // others without JavaScript; here each answer eases open and the open one eases shut (260 ms, ease-out). The
  // group's `name` is lifted on first use so the browser doesn't snap the other answer shut mid-animation.
  // Reduced motion keeps the browser's instant, one-at-a-time behaviour.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const running = new Map<HTMLDetailsElement, { anim: Animation; opening: boolean }>()
    const closedHeight = (d: HTMLDetailsElement) => { const was = d.open; d.open = false; const h = d.getBoundingClientRect().height; d.open = was; return h }
    const move = (d: HTMLDetailsElement, opening: boolean) => {
      running.get(d)?.anim.cancel()
      const from = d.getBoundingClientRect().height
      d.open = true
      const to = opening ? d.getBoundingClientRect().height : closedHeight(d)
      d.style.overflow = 'hidden'
      const anim = d.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 260, easing: 'cubic-bezier(.2, .8, .2, 1)' })
      running.set(d, { anim, opening })
      anim.onfinish = () => { if (running.get(d)?.anim !== anim) return; running.delete(d); d.style.overflow = ''; if (!opening) d.open = false }
      anim.oncancel = () => { if (running.get(d)?.anim === anim) { running.delete(d); d.style.overflow = '' } }
    }
    const click = (e: MouseEvent) => {
      const summary = (e.target as Element | null)?.closest?.('.sx .faq summary')
      const d = summary?.parentElement
      if (!(d instanceof HTMLDetailsElement) || summary !== d.querySelector(':scope > summary')) return
      e.preventDefault()
      const group = d.closest('.faq')
      group?.querySelectorAll<HTMLDetailsElement>('details[name]').forEach(x => { x.dataset.name = x.name; x.removeAttribute('name') })
      const state = running.get(d)
      const opening = state ? !state.opening : !d.open
      if (opening) group?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(x => { if (x !== d && running.get(x)?.opening !== false) move(x, false) })
      move(d, opening)
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [])

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank') return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin || url.pathname.replace(/\/$/, '') !== location.pathname.replace(/\/$/, '') || url.search !== location.search) return
      // the page already open: a section link jumps to the section, a plain link (the logo, "The app" on the
      // home page) jumps back to the top
      const el = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : document.documentElement
      if (!el) return
      e.preventDefault()
      jumpToSection(el)
      if (location.hash !== url.hash) history.pushState(history.state, '', url.hash || url.pathname)
    }
    document.addEventListener('click', click, true)
    return () => document.removeEventListener('click', click, true)
  }, [])

  // The cursor lives for the whole visit.
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const cur = document.createElement('div')
    cur.className = 'chopcur'
    cur.setAttribute('aria-hidden', 'true')
    cur.innerHTML = CURSOR
    document.body.appendChild(cur)
    const root = document.documentElement
    const HOT = 'a,button,[role="button"],summary,input,label,select,textarea'
    root.classList.add('chop', 'chop-out')
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      root.classList.remove('chop-out')
      cur.style.transform = `translate(${e.clientX - 9}px,${e.clientY - 63}px)`
      const target = e.target as Element | null
      cur.classList.toggle('hot', Boolean(target?.closest?.(HOT)))
    }
    const down = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; cur.classList.add('down'); cur.classList.remove('snap'); void cur.offsetWidth; cur.classList.add('snap') }
    const up = () => cur.classList.remove('down')
    const leave = () => root.classList.add('chop-out')
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerdown', down, { passive: true })
    addEventListener('pointerup', up, { passive: true })
    document.addEventListener('mouseleave', leave)
    return () => {
      removeEventListener('pointermove', move); removeEventListener('pointerdown', down); removeEventListener('pointerup', up)
      document.removeEventListener('mouseleave', leave)
      root.classList.remove('chop', 'chop-out')
      cur.remove()
    }
  }, [])

  // Everything else is per page.
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const $$ = <T extends Element = HTMLElement>(s: string) => [...document.querySelectorAll<T & Element>(s)] as T[]
    const offs: (() => void)[] = []
    const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      addEventListener(type, fn as EventListener, opts)
      offs.push(() => removeEventListener(type, fn as EventListener, opts))
    }
    const root = document.documentElement

    // count-ups: <b data-count="80" data-suffix="%">80%</b>
    const countUp = (el: HTMLElement) => {
      const n = Number(el.dataset.count), suf = el.dataset.suffix ?? '', t0 = performance.now(), dur = 1100
      const fmt = (v: number) => v.toLocaleString(el.dataset.locale || 'en-GB') + suf
      if (reduce || !Number.isFinite(n)) { if (Number.isFinite(n)) el.textContent = fmt(n); return }
      const f = () => { const k = clamp((performance.now() - t0) / dur, 0, 1); el.textContent = fmt(Math.round(n * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(f) }
      f()
    }
    // rise-ins and pops land once as they come into view
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return
      const el = e.target as HTMLElement
      el.classList.add('in'); io?.unobserve(el)
      if (el.dataset.count !== undefined) countUp(el)
    }), { rootMargin: '0px 0px -12% 0px' }) : null
    if (io) offs.push(() => io.disconnect())
    $$('[data-rise],[data-pop],[data-count]').forEach(el => {
      if (el.classList.contains('in')) return
      if (reduce || !io) { el.classList.add('in'); if (el.dataset.count !== undefined) countUp(el) } else io.observe(el)
    })

    // reading focus
    const reads = $$('[data-read]')
    const readFrame = () => {
      const H = innerHeight, line = H * 0.48
      reads.forEach(el => {
        const r = el.getBoundingClientRect()
        if (r.bottom < -H || r.top > 2 * H) return
        const d = (r.top + Math.min(r.height, H * 0.3) / 2 - line) / H
        let a: number, y: number
        if (reduce) { a = 1; y = 0 } else if (d > 0) { const k = clamp(d / 0.34, 0, 1); a = 1 - k * 0.9; y = 40 * k } else { const k2 = clamp((-d - 0.14) / 0.3, 0, 1); a = 1 - k2 * 0.55; y = 0 }
        el.style.opacity = a.toFixed(3)
        el.style.transform = y > 0.2 ? `translateY(${y.toFixed(1)}px)` : ''
      })
    }
    offs.push(() => reads.forEach(el => { el.style.opacity = ''; el.style.transform = '' }))

    // header: dark chapters turn it cream; it steps aside at the footer. A rebuilt page (main.sx) marks its dark
    // chapters with .dark, as the prototype does. Pages that keep their own design are read instead: the colour
    // behind the header decides cream words over a dark ground, white words and the white logo over orange.
    const rebuilt = Boolean(document.querySelector('main.sx'))
    const toneBehindHeader = (): 'dark' | 'orange' | 'light' => {
      for (const top of document.elementsFromPoint(innerWidth / 2, 40)) {
        if (top.closest('.hx, .hx-sheet, .chopcur, canvas')) continue
        for (let n: Element | null = top; n; n = n.parentElement) {
          const cs = getComputedStyle(n)
          const m = (cs.backgroundImage !== 'none' && cs.backgroundImage.match(/rgba?\(([^)]+)\)/)) || cs.backgroundColor.match(/rgba?\(([^)]+)\)/)
          if (!m) continue
          const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
          if (a < 0.5) continue
          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
          return lum < 0.35 ? 'dark' : r > 200 && g > 110 && g < 190 && b < 110 ? 'orange' : 'light'
        }
        return 'light'
      }
      return 'light'
    }
    const headerFrame = () => {
      let dark = false, orange = false
      if (rebuilt) $$('main > section, main > div').forEach(s => { const r = s.getBoundingClientRect(); if (r.top <= 50 && r.bottom > 50) dark = s.classList.contains('dark') })
      else { const tone = toneBehindHeader(); dark = tone === 'dark'; orange = tone === 'orange' }
      root.classList.toggle('hx-dark', dark)
      root.classList.toggle('hx-orange', orange)
      const foot = document.querySelector('.sitefoot')
      root.classList.toggle('hx-foot', Boolean(foot && foot.getBoundingClientRect().top < 110))
      // Devon, 27 Nov 2026 ("(b) Fade"): once the page has scrolled, a fade under the header keeps text from running under it
      root.classList.toggle('hx-scrolled', window.scrollY > 8)
    }
    offs.push(() => { root.classList.toggle('hx-dark', false); root.classList.toggle('hx-orange', false); root.classList.toggle('hx-foot', false); root.classList.toggle('hx-scrolled', false) })

    // magnetic stops, after GSAP's snapTo: 'labelsDirectional'
    const stops = $$('[data-stop]')
    let quietUntil = 0
    const SN = { active: false, dir: 1, lastY: scrollY, idle: 0, touching: false, hold: null as null | { y: number; until: number } }
    const docTop = (e: HTMLElement | null) => { let y = 0; while (e) { y += e.offsetTop; e = e.offsetParent as HTMLElement | null } return y }
    const stopY = (el: HTMLElement) => { const top = el.dataset.stop === 'top'; return docTop(el) + (top ? 0 : el.offsetHeight / 2) - innerHeight * (top ? 0.18 : 0.5) }
    const held = () => Boolean(SN.hold && performance.now() < SN.hold.until)
    const snapCheck = () => {
      if (reduce || !stops.length || SN.active || SN.touching || held() || performance.now() < quietUntil) return
      const H = innerHeight, y = scrollY
      let ahead: number | null = null, ad = 1e9, back: number | null = null, bk = 1e9
      stops.forEach(el => { const t = stopY(el), d = (t - y) * SN.dir; if (d >= 0 && d < H * 0.35 && d < ad) { ad = d; ahead = t } if (d < 0 && -d < H * 0.08 && -d < bk) { bk = -d; back = t } })
      const best: number | null = ahead !== null ? ahead : back
      if (best === null || Math.abs(best - y) < 3) return
      const target: number = best
      const y0 = y, dist = target - y0, dur = clamp(Math.abs(dist) * 1.1, 380, 820), t0 = performance.now()
      SN.active = true
      const step = () => {
        if (!SN.active) return
        const k = clamp((performance.now() - t0) / dur, 0, 1)
        jump(y0 + dist * ease(k))
        if (k < 1) { requestAnimationFrame(step); return }
        SN.active = false
        SN.hold = { y: target, until: performance.now() + 650 }
      }
      step()
    }
    if (stops.length) {
      on('wheel', e => { if (held()) e.preventDefault(); else if (SN.active) SN.active = false }, { passive: false })
      on('touchstart', () => { SN.touching = true; if (SN.active) SN.active = false }, { passive: true })
      on('touchend', () => { SN.touching = false; clearTimeout(SN.idle); SN.idle = window.setTimeout(snapCheck, 220) }, { passive: true })
      on('keydown', () => { if (SN.active) SN.active = false }, { passive: true })
      on('mousedown', () => { if (SN.active) SN.active = false }, { passive: true })
      on('makan:jump', () => { SN.active = false; SN.hold = null; clearTimeout(SN.idle); quietUntil = performance.now() + JUMP_QUIET_MS })
      offs.push(() => { SN.active = false; clearTimeout(SN.idle) })
    }

    // document pages: the contents list follows the section you are reading
    const toc = $$<HTMLAnchorElement>('.doc-toc a')
    const heads = toc.map(a => document.getElementById(decodeURIComponent((a.getAttribute('href') ?? '').replace(/^#/, ''))))
    const tocFrame = () => {
      if (!toc.length) return
      let cur = 0
      heads.forEach((h, i) => { if (h && h.getBoundingClientRect().top < innerHeight * 0.3) cur = i })
      toc.forEach((a, i) => a.classList.toggle('on', i === cur))
    }

    let ticking = false
    const frame = () => { ticking = false; readFrame(); headerFrame(); tocFrame() }
    on('scroll', () => {
      const y = scrollY
      if (!SN.active && Math.abs(y - SN.lastY) > 0.5) SN.dir = y > SN.lastY ? 1 : -1
      SN.lastY = y
      if (stops.length) {
        if (held() && !SN.active && SN.hold && Math.abs(y - SN.hold.y) > 1) jump(SN.hold.y)
        clearTimeout(SN.idle); SN.idle = window.setTimeout(snapCheck, 170)
      }
      if (!ticking) { ticking = true; requestAnimationFrame(frame) }
    }, { passive: true })
    on('resize', frame)
    frame()
    return () => offs.forEach(fn => fn())
  }, [pathname])

  return null
}
