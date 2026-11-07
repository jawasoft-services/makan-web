'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { track } from '@vercel/analytics'
import styles from './maitred-demo.module.css'
import MaitredNativeMockup from './MaitredNativeMockup'
import MaitredStandings from './MaitredStandings'
import { progressAtLine, storyAtProgress } from './maitred-story'

export type DemoStep = 'save' | 'qualify' | 'lead' | 'share'
export type MaitredDemoCopy = {
  legend: string
  steps: { id: DemoStep; title: string; body: string }[]
}

function storyStops(fieldset: HTMLFieldSetElement) {
  const stage = fieldset.querySelector<HTMLElement>('[data-story-stage]')!
  const distance = fieldset.querySelector('[data-story-track]')!.getBoundingClientRect().height
  const start = fieldset.getBoundingClientRect().top - (parseFloat(window.getComputedStyle(stage).top) || 0)
  return [start, start + distance / 4, start + distance / 2, start + distance]
}

function scrollProgress(fieldset: HTMLFieldSetElement) {
  return progressAtLine(storyStops(fieldset), 0)
}

/** Scroll position is the clock. No spring, delay or autonomous animation. */
export default function MaitredDemo({ copy, locale }: { copy: MaitredDemoCopy; locale: string }) {
  const id = useId()
  const fieldset = useRef<HTMLFieldSetElement>(null)
  const select = useRef<(index: number) => void>(() => {})
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const story = storyAtProgress(progress)

  useEffect(() => {
    const root = fieldset.current!
    const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame: number | undefined
    let stopFollowing: (() => void) | undefined
    let stopReversing: (() => void) | undefined
    function publish(value: number) {
      const step = storyAtProgress(value).step
      inputs.forEach(input => { input.checked = input.value === step })
      setProgress(value)
    }
    function followPosition() { publish(scrollProgress(root)) }
    function followScroll() {
      if (frame !== undefined) return
      frame = window.requestAnimationFrame(() => {
        frame = undefined
        followPosition()
      })
    }
    select.current = index => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      frame = undefined
      const top = Math.max(0, window.scrollY + storyStops(root)[index])
      // The phone and highlight travel with the page, including keyboard selection.
      followPosition()
      if (window.__lenis) {
        const current = scrollProgress(root)
        const shareTravel = Math.abs(Math.max(0, index - 2) - Math.max(0, current - 2))
        // Give the editor, typing, preview and publication time to be read.
        const duration = Math.max(1.2, Math.abs(index - current) * 2.5 + shareTravel * 4.5)
        window.__lenis.scrollTo(top, { immediate: motion.matches, force: true, duration, lerp: 0, easing: t => t })
      }
      else window.scrollTo({ top, behavior: motion.matches ? 'instant' : 'smooth' })
      if (motion.matches) publish(index)
    }
    function preferenceChanged() { setReducedMotion(motion.matches) }
    const hydrate = window.requestAnimationFrame(() => {
      const scroller = window.__lenis
      if (scroller) {
        window.removeEventListener('scroll', followScroll)
        stopFollowing = scroller.on('scroll', followPosition)
        stopReversing = scroller.on('virtual-scroll', ({ deltaY, event }) => {
          if (event.type !== 'wheel' || event.ctrlKey || !root.contains(event.target as Node)) return
          // Discard old-direction momentum before Lenis applies the new wheel delta.
          if (deltaY * (scroller.targetScroll - scroller.actualScroll) < 0) {
            scroller.scrollTo(scroller.actualScroll, { immediate: true, force: true })
          }
        })
      }
      followPosition()
      preferenceChanged()
      setReady(true)
    })
    root.querySelectorAll<HTMLElement>('[data-demo-panel]').forEach(panel => { panel.inert = panel.dataset.demoPanel !== 'save' })
    window.addEventListener('scroll', followScroll, { passive: true })
    window.addEventListener('resize', followScroll)
    motion.addEventListener('change', preferenceChanged)
    return () => {
      window.cancelAnimationFrame(hydrate)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      stopFollowing?.()
      stopReversing?.()
      window.removeEventListener('scroll', followScroll)
      window.removeEventListener('resize', followScroll)
      motion.removeEventListener('change', preferenceChanged)
    }
  }, [])

  useLayoutEffect(() => {
    if (!ready) return
    const panel = fieldset.current?.querySelector<HTMLElement>('[data-demo-panel="save"]')
    const screen = panel?.querySelector<HTMLElement>('[data-story-screen]')
    const history = panel?.querySelector<HTMLElement>('[data-native-section="your-meals"]')
    const table = panel?.querySelector<HTMLElement>('[data-native-section="maitred"]')
    if (!screen || !history || !table) return
    const from = Math.max(0, history.offsetTop - 128)
    const to = Math.max(0, table.offsetTop - 224)
    const camera = reducedMotion ? Number(story.camera >= .5) : story.camera
    screen.scrollTo({ top: from + (to - from) * camera, behavior: 'instant' })
  }, [ready, reducedMotion, story.camera, story.days])

  const crown = reducedMotion ? Number(story.days === 8) : Math.max(0, Math.min(1, story.dayProgress - 7))
  return <fieldset className={styles.demo} ref={fieldset} data-motion-ready={ready || undefined} data-story-progress={progress} data-story-holder={story.days === 8 || undefined}>
    <legend className={styles.srOnly}>{copy.legend}</legend>
    <noscript><style>{`.${styles.stage}{position:static}.${styles.track},.${styles.mobileDescription}{display:none!important}.${styles.stepBody}{display:block!important}`}</style></noscript>
    <div className={styles.stage} data-story-stage>
    <div className={styles.steps}>
      {copy.steps.map((step, index) => <label className={styles.step} key={step.id} htmlFor={`${id}-${step.id}`}>
        <input className={styles.radio} type="radio" name={`${id}-step`} id={`${id}-${step.id}`} value={step.id}
          defaultChecked={index === 0} aria-labelledby={`${id}-${step.id}-title`} aria-describedby={`${id}-${step.id}-description`} aria-controls={`${id}-${ready ? 'save' : step.id}-phone`}
          onPointerDown={event => { if (event.currentTarget.checked) select.current(index) }}
          onKeyDown={event => { if (event.key === ' ' && event.currentTarget.checked) select.current(index) }}
          onChange={() => {
            select.current(index)
            track('Maitre d Demo Step Selected', { location: 'maitre-d', locale, step: step.id })
          }} />
        <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.stepCopy}><span className={styles.stepTitle} id={`${id}-${step.id}-title`}>{step.title}</span><span className={styles.stepBody} id={`${id}-${step.id}-description`}>{step.body}</span></span>
      </label>)}
    </div>
    <div className={styles.scene} data-demo-scene>
      <div className={styles.phone}>
        <div className={styles.island} />
        <div className={styles.panels}>
          <div id={`${id}-save-phone`} className={`${styles.panel} ${styles.initialPanel}`} data-demo-panel="save"><MaitredNativeMockup locale={locale} state={story.state} viewerDays={story.days} story={ready ? story : undefined} reducedMotion={reducedMotion} locked standings={ready ? <MaitredStandings locale={locale} state={story.state} days={story.days} dayProgress={story.dayProgress} reducedMotion={reducedMotion} /> : undefined} /></div>
          {!ready && <><div id={`${id}-qualify-phone`} className={styles.panel} data-demo-panel="qualify"><MaitredNativeMockup locale={locale} state="qualify" locked /></div>
          <div id={`${id}-lead-phone`} className={styles.panel} data-demo-panel="lead"><MaitredNativeMockup locale={locale} state="holder" locked /></div>
          <div id={`${id}-share-phone`} className={styles.panel} data-demo-panel="share"><MaitredNativeMockup locale={locale} state="order" locked /></div></>}
        </div>
        <div className={styles.homeIndicator} />
      </div>
      <Image style={ready ? { opacity: crown, transform: `translateY(${(1 - crown) * -20}px) rotate(${-8 + 23 * crown}deg) scale(${.85 + .15 * crown})` } : undefined} className={styles.sceneCrown} src="/redesign/maitred-crown.svg" alt="" width={160} height={120} />
      <p className={styles.credit}>Kendal Street Kitchen · @ridorichard</p>
    </div>
    <div className={styles.mobileDescription} aria-hidden="true">
      {copy.steps.map(step => <p key={step.id} data-current={step.id === story.step || undefined}>{step.body}</p>)}
    </div>
    </div>
    <div className={styles.track} data-story-track aria-hidden="true" />
  </fieldset>
}
