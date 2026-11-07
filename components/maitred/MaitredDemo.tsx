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

function readingLine(fieldset: HTMLFieldSetElement) {
  if (window.innerWidth > 700) return window.innerHeight / 2
  const height = fieldset.querySelector('[data-demo-scene]')?.getBoundingClientRect().height ?? 0
  return Math.min(window.innerHeight - 40, (height + window.innerHeight) / 2)
}

function scrollProgress(fieldset: HTMLFieldSetElement) {
  const bounds = fieldset.getBoundingClientRect()
  const line = readingLine(fieldset)
  if (bounds.top > line || bounds.bottom < line) return
  const centers = Array.from(fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]'), input => {
    const row = input.closest('label')!.getBoundingClientRect()
    return row.top + row.height / 2
  })
  return progressAtLine(centers, line)
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
    function publish(value: number) {
      inputs.find(input => input.value === storyAtProgress(value).step)!.checked = true
      setProgress(value)
    }
    function followScroll() {
      if (frame !== undefined) return
      frame = window.requestAnimationFrame(() => {
        frame = undefined
        const measured = scrollProgress(root)
        if (measured !== undefined) publish(measured)
      })
    }
    select.current = index => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      frame = undefined
      const row = inputs[index].closest('label')!.getBoundingClientRect()
      const top = Math.max(0, window.scrollY + row.top + row.height / 2 - readingLine(root))
      // Keep the page and the scene on the same timeline, including keyboard selection.
      if (window.__lenis) window.__lenis.scrollTo(top, { immediate: true, force: true })
      else window.scrollTo({ top, behavior: 'instant' })
      publish(index)
    }
    function preferenceChanged() { setReducedMotion(motion.matches) }
    const hydrate = window.requestAnimationFrame(() => {
      publish(scrollProgress(root) ?? Math.max(0, inputs.findIndex(input => input.checked)))
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
  return <fieldset className={styles.demo} ref={fieldset} data-lenis-prevent data-motion-ready={ready || undefined} data-story-progress={progress} data-story-holder={story.days === 8 || undefined}>
    <legend className={styles.srOnly}>{copy.legend}</legend>
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
          <div id={`${id}-qualify-phone`} className={styles.panel} data-demo-panel="qualify"><MaitredNativeMockup locale={locale} state="qualify" locked /></div>
          <div id={`${id}-lead-phone`} className={styles.panel} data-demo-panel="lead"><MaitredNativeMockup locale={locale} state="holder" locked /></div>
          <div id={`${id}-share-phone`} className={styles.panel} data-demo-panel="share"><MaitredNativeMockup locale={locale} state="order" locked /></div>
        </div>
        <div className={styles.homeIndicator} />
      </div>
      <Image style={ready ? { opacity: crown, transform: `translateY(${(1 - crown) * -20}px) rotate(${-8 + 23 * crown}deg) scale(${.85 + .15 * crown})` } : undefined} className={styles.sceneCrown} src="/redesign/maitred-crown.svg" alt="" width={160} height={120} />
      <p className={styles.credit}>Kendal Street Kitchen · @ridorichard</p>
    </div>
  </fieldset>
}
