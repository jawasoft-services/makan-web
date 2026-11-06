'use client'

import { useCallback, useEffect, useId, useRef } from 'react'
import Image from 'next/image'
import { track } from '@vercel/analytics'
import styles from './maitred-demo.module.css'
import MaitredNativeMockup from './MaitredNativeMockup'

export type DemoStep = 'save' | 'qualify' | 'lead' | 'share'
export type MaitredDemoCopy = {
  legend: string
  steps: { id: DemoStep; title: string; body: string }[]
}

function revealStep(fieldset: HTMLFieldSetElement | null, step: DemoStep, animate: boolean) {
  const panel = fieldset?.querySelector<HTMLElement>(`[data-demo-panel="${step}"]`)
  const screen = panel?.querySelector<HTMLElement>('[role="region"]')
  const section = panel?.querySelector<HTMLElement>(`[data-native-section="${step === 'save' ? 'your-meals' : 'maitred'}"]`)
  if (!screen || !section) return
  // Native layout coordinates stay constant while the whole phone scales.
  screen.scrollTo({ top: Math.max(0, section.offsetTop - (step === 'save' ? 128 : 224)),
    behavior: animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' })
}

function activatePanel(fieldset: HTMLFieldSetElement | null, step: DemoStep) {
  fieldset?.querySelectorAll<HTMLElement>('[data-demo-panel]').forEach(panel => {
    panel.inert = panel.dataset.demoPanel !== step
  })
  if (fieldset) fieldset.dataset.motionReady = 'true'
}

function stepAtReadingLine(fieldset: HTMLFieldSetElement | null) {
  const bounds = fieldset?.getBoundingClientRect()
  const phoneBottom = window.innerWidth <= 700 ? fieldset?.querySelector('[data-demo-scene]')?.getBoundingClientRect().bottom : undefined
  const line = phoneBottom === undefined ? window.innerHeight / 2
    : Math.min(window.innerHeight - 40, (phoneBottom + window.innerHeight) / 2)
  if (!bounds || bounds.top > line || bounds.bottom < line) return
  let nearest: HTMLInputElement | undefined
  let distance = Infinity
  fieldset?.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(input => {
    const row = input.closest('label')?.getBoundingClientRect()
    if (!row) return
    const delta = Math.abs(row.top + row.height / 2 - line)
    if (delta < distance) { nearest = input; distance = delta }
  })
  return nearest
}

/** Native radio selection controls the illustration, even before hydration.
 * The visible step labels carry the complete explanation for assistive tech.
 * This never creates a meal, awards a title, or reads personal progress. */
export default function MaitredDemo({ copy, locale }: { copy: MaitredDemoCopy; locale: string }) {
  const id = useId()
  const fieldset = useRef<HTMLFieldSetElement>(null)
  const activeStep = useRef<DemoStep>('save')
  const pendingScroll = useRef<number | undefined>(undefined)
  const pageY = useRef(0)
  const scrollStep = useRef<string | undefined>(undefined)
  useEffect(() => {
    const selected = fieldset.current?.querySelector<HTMLInputElement>('input:checked')?.value as DemoStep | undefined
    activeStep.current = selected ?? 'save'
    activatePanel(fieldset.current, activeStep.current)
    revealStep(fieldset.current, activeStep.current, false)
    return () => window.clearTimeout(pendingScroll.current)
  }, [])

  function restoreStep(step: DemoStep) {
    pageY.current = window.scrollY
    scrollStep.current = stepAtReadingLine(fieldset.current)?.value
    window.clearTimeout(pendingScroll.current)
    revealStep(fieldset.current, step, true)
  }

  const selectStep = useCallback((step: DemoStep) => {
    window.clearTimeout(pendingScroll.current)
    const previous = fieldset.current?.querySelector<HTMLElement>(`[data-demo-panel="${activeStep.current}"] [role="region"]`)
    const next = fieldset.current?.querySelector<HTMLElement>(`[data-demo-panel="${step}"] [role="region"]`)
    const top = previous?.scrollTop ?? 0
    // Carry the exact visible position forward, including an interrupted scroll.
    previous?.scrollTo({ top, behavior: 'instant' })
    next?.scrollTo({ top, behavior: 'instant' })
    activeStep.current = step
    activatePanel(fieldset.current, step)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) revealStep(fieldset.current, step, false)
    else pendingScroll.current = window.setTimeout(() => {
      if (activeStep.current === step) revealStep(fieldset.current, step, true)
    }, 220)
  }, [])

  useEffect(() => {
    let frame: number | undefined
    pageY.current = window.scrollY
    function followScroll() {
      if (window.scrollY === pageY.current) return
      pageY.current = window.scrollY
      if (frame !== undefined) return
      frame = window.requestAnimationFrame(() => {
        frame = undefined
        const nearest = stepAtReadingLine(fieldset.current)
        if (!nearest || nearest.value === scrollStep.current) return
        scrollStep.current = nearest.value
        if (nearest && nearest.value !== activeStep.current) {
          nearest.checked = true
          selectStep(nearest.value as DemoStep)
        }
      })
    }
    window.addEventListener('scroll', followScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', followScroll)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [selectStep])

  return <fieldset className={styles.demo} ref={fieldset}>
    <legend className={styles.srOnly}>{copy.legend}</legend>
    <div className={styles.steps}>
      {copy.steps.map((step, index) => <label className={styles.step} key={step.id} htmlFor={`${id}-${step.id}`}>
        <input className={styles.radio} type="radio" name={`${id}-step`} id={`${id}-${step.id}`} value={step.id}
          defaultChecked={index === 0} aria-labelledby={`${id}-${step.id}-title`} aria-describedby={`${id}-${step.id}-description`} aria-controls={`${id}-${step.id}-phone`}
          onPointerDown={event => { if (event.currentTarget.checked) restoreStep(step.id) }}
          onKeyDown={event => { if (event.key === ' ' && event.currentTarget.checked) restoreStep(step.id) }}
          onChange={() => {
            pageY.current = window.scrollY
            scrollStep.current = stepAtReadingLine(fieldset.current)?.value
            selectStep(step.id)
            track('Maitre d Demo Step Selected', { location: 'maitre-d', locale, step: step.id })
          }} />
        <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.stepCopy}><span className={styles.stepTitle} id={`${id}-${step.id}-title`}>{step.title}</span><span className={styles.stepBody} id={`${id}-${step.id}-description`}>{step.body}</span></span>
      </label>)}
    </div>
    <div className={styles.scene} data-demo-scene>
      <div className={styles.phone}>
        <div className={styles.island} />
        <div className={styles.panels}
          onWheel={() => window.clearTimeout(pendingScroll.current)}
          onTouchStart={() => window.clearTimeout(pendingScroll.current)}
          onKeyDown={() => window.clearTimeout(pendingScroll.current)}>
          <div id={`${id}-save-phone`} className={`${styles.panel} ${styles.initialPanel}`} data-demo-panel="save"><MaitredNativeMockup locale={locale} state="regulars" /></div>
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
