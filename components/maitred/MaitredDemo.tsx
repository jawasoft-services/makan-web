'use client'

import { useId } from 'react'
import Image from 'next/image'
import { track } from '@vercel/analytics'
import styles from './maitred-demo.module.css'
import MaitredNativeMockup from './MaitredNativeMockup'

export type DemoStep = 'save' | 'qualify' | 'lead' | 'share'
export type MaitredDemoCopy = {
  legend: string
  steps: { id: DemoStep; title: string; body: string }[]
}

/** Native radio selection controls the illustration, even before hydration.
 * The visible step labels carry the complete explanation for assistive tech.
 * This never creates a meal, awards a title, or reads personal progress. */
export default function MaitredDemo({ copy, locale }: { copy: MaitredDemoCopy; locale: string }) {
  const id = useId()
  return <fieldset className={styles.demo}>
    <legend className={styles.srOnly}>{copy.legend}</legend>
    <div className={styles.steps}>
      {copy.steps.map((step, index) => <label className={styles.step} key={step.id} htmlFor={`${id}-${step.id}`}>
        <input className={styles.radio} type="radio" name={`${id}-step`} id={`${id}-${step.id}`} value={step.id}
          defaultChecked={index === 0} aria-labelledby={`${id}-${step.id}-title`} aria-describedby={`${id}-${step.id}-description`}
          onChange={() => track('Maitre d Demo Step Selected', { location: 'maitre-d', locale, step: step.id })} />
        <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.stepCopy}><span className={styles.stepTitle} id={`${id}-${step.id}-title`}>{step.title}</span><span className={styles.stepBody} id={`${id}-${step.id}-description`}>{step.body}</span></span>
      </label>)}
    </div>
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.phone}>
        <div className={styles.island} />
        <div className={styles.panels}>
          <div className={`${styles.panel} ${styles.initialPanel}`} data-demo-panel="save"><MaitredNativeMockup locale={locale} state="regulars" /></div>
          <div className={styles.panel} data-demo-panel="qualify"><MaitredNativeMockup locale={locale} state="regulars" /></div>
          <div className={styles.panel} data-demo-panel="lead"><MaitredNativeMockup locale={locale} state="holder" /></div>
          <div className={styles.panel} data-demo-panel="share"><MaitredNativeMockup locale={locale} state="order" /></div>
        </div>
        <div className={styles.homeIndicator} />
      </div>
      <Image className={styles.sceneCrown} src="/redesign/maitred-crown.svg" alt="" width={160} height={120} />
      <p className={styles.credit}>Kendal Street Kitchen · @ridorichard</p>
    </div>
  </fieldset>
}
