'use client'

import { useLayoutEffect, useRef } from 'react'
import { illustrationTable, IllustrationPortrait, NativeCrown, type NativeMaitredState } from './MaitredIllustration'
import { NATIVE_MAITRED_COPY } from './native-copy'
import styles from './maitred-native-mockup.module.css'

/** Keep the same four actors mounted while the native top-three + viewer changes. */
export default function MaitredStandings({ locale, state, days }: { locale: string; state: NativeMaitredState; days: number }) {
  const table = useRef<HTMLDivElement>(null)
  const previousHolder = useRef<string | undefined>(undefined)
  const copy = NATIVE_MAITRED_COPY[locale === 'id' ? 'id' : 'en']
  const { rows, holder } = illustrationTable(state, days)
  const maya = illustrationTable('regulars').rows.find(person => person.id === 'maya')!
  const actors = rows.some(person => person.id === 'maya') ? rows : [...rows, maya]

  useLayoutEffect(() => {
    const root = table.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const crown = root.querySelector<HTMLElement>('[data-moving-crown]')!
    function positionRows() {
      let top = 0
      let crownTop = 0
      root!.querySelectorAll<HTMLElement>('[data-illustration-row]').forEach(row => {
        const visible = row.getAttribute('aria-hidden') !== 'true'
        row.style.transform = `translateY(${top}px)`
        if (row.dataset.illustrationHolder) {
          crownTop = top + row.querySelector<HTMLElement>('[data-row-avatar]')!.offsetTop - 2
        }
        if (visible) top += row.offsetHeight + 4
      })
      root!.style.height = `${top - 4}px`
      const destination = `translateY(${crownTop}px)`
      const origin = getComputedStyle(crown).transform
      if (reduced || previousHolder.current !== holder.id) crown.getAnimations().forEach(animation => animation.cancel())
      crown.style.transform = destination
      if (!reduced && previousHolder.current && previousHolder.current !== holder.id) {
        crown.animate([{ transform: origin }, { transform: `translateY(${crownTop - 26}px) rotate(-14deg) scale(1.16)`, offset: .45 }, { transform: destination }],
          { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' })
      }
      previousHolder.current = holder.id
      root!.dataset.positioned = 'true'
    }
    positionRows()
    const observer = new ResizeObserver(positionRows)
    root.querySelectorAll<HTMLElement>('[data-illustration-row]').forEach(row => observer.observe(row))
    return () => observer.disconnect()
  }, [days, holder.id])

  return <div className={styles.movingTable} ref={table} data-animated-standings data-days={days}>
    {actors.map(person => {
      const visible = rows.some(row => row.id === person.id)
      return <div key={person.id} data-illustration-row={person.id} data-illustration-holder={person.isHolder || undefined} aria-hidden={!visible || undefined}
        className={`${styles.regularRow} ${styles.movingRow} ${person.isYou ? styles.ownRow : ''}`}>
        <span className={styles.rank}>{person.rank}</span>
        <div data-row-avatar className={`${styles.rowAvatar} ${person.isHolder ? styles.crownedAvatar : ''}`}><IllustrationPortrait portrait={person.portrait} /></div>
        <div className={styles.rowName}><strong>{person.isYou ? copy.you : person.name}</strong>{person.isHolder && <span>{copy.role}</span>}</div>
        <strong className={styles.days}><span key={person.days} className={styles.dayDigit}>{person.days}</span></strong>
      </div>
    })}
    <span className={styles.movingCrown} data-moving-crown aria-hidden="true"><NativeCrown size={16} /></span>
  </div>
}
