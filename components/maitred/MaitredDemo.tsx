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

function revealStep(fieldset: HTMLFieldSetElement | null, step: DemoStep, animate: boolean) {
  const panel = fieldset?.querySelector<HTMLElement>('[data-demo-panel="save"]')
  const screen = panel?.querySelector<HTMLElement>('[role="region"]')
  const section = panel?.querySelector<HTMLElement>(`[data-native-section="${step === 'save' ? 'your-meals' : 'maitred'}"]`)
  if (!screen || !section) return
  screen.scrollTo({ top: Math.max(0, section.offsetTop - (step === 'save' ? 128 : 224)),
    behavior: animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' })
}

function scrollProgress(fieldset: HTMLFieldSetElement) {
  const bounds = fieldset.getBoundingClientRect()
  const phoneBottom = window.innerWidth <= 700 ? fieldset.querySelector('[data-demo-scene]')?.getBoundingClientRect().bottom : undefined
  const line = phoneBottom === undefined ? window.innerHeight / 2
    : Math.min(window.innerHeight - 40, (phoneBottom + window.innerHeight) / 2)
  if (bounds.top > line || bounds.bottom < line) return
  const centers = Array.from(fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]'), input => {
    const row = input.closest('label')!.getBoundingClientRect()
    return row.top + row.height / 2
  })
  return progressAtLine(centers, line)
}

/** One persistent phone; four complete CSS-controlled snapshots remain before hydration. */
export default function MaitredDemo({ copy, locale }: { copy: MaitredDemoCopy; locale: string }) {
  const id = useId()
  const fieldset = useRef<HTMLFieldSetElement>(null)
  const select = useRef<(index: number) => void>(() => {})
  const [story, setStory] = useState(() => storyAtProgress(0))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const root = fieldset.current!
    const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
    let progress = Math.max(0, inputs.findIndex(input => input.checked))
    let target = progress
    let frame: number | undefined
    let lastTime = 0
    let heldStep: number | undefined
    let selectionSettling = false
    let selectionTimer: number | undefined
    let pageY = window.scrollY
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    function publish(value: number) {
      progress = value
      const snapshot = storyAtProgress(value)
      inputs.find(input => input.value === snapshot.step)!.checked = true
      setStory(previous => previous.days === snapshot.days && previous.step === snapshot.step && previous.state === snapshot.state ? previous : snapshot)
    }
    function tick(time: number) {
      frame = undefined
      const delta = lastTime ? Math.min(64, time - lastTime) : 16
      lastTime = time
      const next = progress + (target - progress) * (1 - Math.exp(-delta / 85))
      publish(Math.abs(next - target) < .002 ? target : next)
      if (progress !== target) frame = window.requestAnimationFrame(tick)
    }
    function moveTo(value: number) {
      target = value
      if (motion.matches) {
        if (frame !== undefined) window.cancelAnimationFrame(frame)
        frame = undefined
        publish(target)
      } else if (frame === undefined) {
        lastTime = 0
        frame = window.requestAnimationFrame(tick)
      }
    }
    select.current = index => {
      pageY = window.scrollY
      const measured = scrollProgress(root)
      heldStep = measured === undefined ? undefined : Math.round(measured)
      // Let the browser finish scrolling a newly focused radio before resuming the story.
      selectionSettling = true
      window.clearTimeout(selectionTimer)
      selectionTimer = window.setTimeout(() => { selectionSettling = false }, 250)
      moveTo(index)
      if (storyAtProgress(progress).step === inputs[index].value) revealStep(root, inputs[index].value as DemoStep, true)
    }
    function followScroll(event: Event) {
      if (window.scrollY === pageY && event.type !== 'resize') return
      pageY = window.scrollY
      const measured = scrollProgress(root)
      if (measured === undefined) return
      if (selectionSettling) { heldStep = Math.round(measured); return }
      if (heldStep === Math.round(measured)) return
      heldStep = undefined
      moveTo(measured)
    }
    function reduceMotion() { if (motion.matches) moveTo(target) }
    const hydrate = window.requestAnimationFrame(() => { publish(progress); setReady(true) })
    root.querySelectorAll<HTMLElement>('[data-demo-panel]').forEach(panel => { panel.inert = panel.dataset.demoPanel !== 'save' })
    window.addEventListener('scroll', followScroll, { passive: true })
    window.addEventListener('resize', followScroll)
    motion.addEventListener('change', reduceMotion)
    return () => {
      window.cancelAnimationFrame(hydrate)
      window.clearTimeout(selectionTimer)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', followScroll)
      window.removeEventListener('resize', followScroll)
      motion.removeEventListener('change', reduceMotion)
    }
  }, [])

  const previousStep = useRef<DemoStep | undefined>(undefined)
  useLayoutEffect(() => {
    if (!ready) return
    revealStep(fieldset.current, story.step, previousStep.current !== undefined)
    previousStep.current = story.step
  }, [ready, story.step])

  return <fieldset className={styles.demo} ref={fieldset} data-motion-ready={ready || undefined} data-story-holder={story.days === 8 || undefined}>
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
          <div id={`${id}-save-phone`} className={`${styles.panel} ${styles.initialPanel}`} data-demo-panel="save"><MaitredNativeMockup locale={locale} state={story.state} viewerDays={story.days} standings={ready ? <MaitredStandings locale={locale} state={story.state} days={story.days} /> : undefined} /></div>
          <div id={`${id}-qualify-phone`} className={styles.panel} data-demo-panel="qualify"><MaitredNativeMockup locale={locale} state="qualify" /></div>
          <div id={`${id}-lead-phone`} className={styles.panel} data-demo-panel="lead"><MaitredNativeMockup locale={locale} state="holder" /></div>
          <div id={`${id}-share-phone`} className={styles.panel} data-demo-panel="share"><MaitredNativeMockup locale={locale} state="order" /></div>
        </div>
        <div className={styles.homeIndicator} />
      </div>
      <Image className={styles.sceneCrown} src="/redesign/maitred-crown.svg" alt="" width={160} height={120} />
      <p className={styles.credit}>Kendal Street Kitchen · @ridorichard</p>
    </div>
  </fieldset>
}
