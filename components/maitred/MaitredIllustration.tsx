import StaticPicture from '@/components/StaticPicture'
import type { CSSProperties, ReactNode } from 'react'
import { NATIVE_MAITRED_COPY } from './native-copy'
import styles from './maitred-native-mockup.module.css'

export type NativeMaitredState = 'regulars' | 'qualify' | 'holder' | 'order'

export const ILLUSTRATION_EOY = { eat: 21, yeet: 4, tied: 0, comparisons: 25, percent: 84 } as const

export const ILLUSTRATION_MEALS = [
  { image: '/blog/kendal-street-kitchen/harissa-prawns.jpg', caption: 'Harissa prawns', name: 'Alex Chen' },
  { image: '/blog/kendal-street-kitchen/carbonara-risotto.jpg', caption: 'Carbonara and mushroom risotto', name: 'Jamie Morgan' },
  { image: '/blog/kendal-street-kitchen/tiramisu.jpg', caption: 'Tiramisu', name: 'Sam Rivera' },
] as const

// Authored illustration data only. Never import this into public data readers.
export const ILLUSTRATION_DINERS = [
  { id: 'alex', name: 'Alex Chen', portrait: 0, days: 1 },
  { id: 'jamie', name: 'Jamie Morgan', portrait: 1, days: 7 },
  { id: 'sam', name: 'Sam Rivera', portrait: 2, days: 5 },
  { id: 'maya', name: 'Maya Patel', portrait: 3, days: 4 },
  { id: 'taylor', name: 'Taylor Kim', portrait: 4, days: 3 },
  { id: 'robin', name: 'Robin Brooks', portrait: 5, days: 3 },
] as const

export function illustrationTable(stage: NativeMaitredState, viewerDays = stage === 'holder' || stage === 'order' ? 8 : stage === 'qualify' ? 2 : 1) {
  const days = Math.max(1, Math.min(8, Math.floor(viewerDays)))
  const own = days === 8
  const holderId = own ? 'alex' : 'jamie'
  const ranked = ILLUSTRATION_DINERS.map(person => ({ ...person,
    days: person.id === 'alex' ? days : person.days,
    isYou: person.id === 'alex', isHolder: person.id === holderId,
  })).sort((a, b) => b.days - a.days || Number(b.isHolder) - Number(a.isHolder) || a.id.localeCompare(b.id)).map((person, index) => ({ ...person, rank: index + 1 }))
  // Match the native selector: top three, then the viewer when outside them.
  const rows = ranked.slice(0, 3)
  const viewer = ranked.find(person => person.isYou)!
  if (!rows.some(person => person.isYou)) rows.push(viewer)
  return { own, rows, holder: ranked.find(person => person.isHolder)! }
}

export function illustrationViewerMeals(stage: NativeMaitredState, viewerDays?: number) {
  const visits = illustrationTable(stage, viewerDays).rows.find(person => person.isYou)!.days
  return Array.from({ length: visits }, (_, index) => ({
    ...ILLUSTRATION_MEALS[index % ILLUSTRATION_MEALS.length],
    id: `alex-meal-${index + 1}`, dishId: `dish-${index % ILLUSTRATION_MEALS.length}`,
    name: 'Alex Chen',
  }))
}

export function NativeCrown({ size }: { size: number }) {
  return <svg width={size} height={size * .78} style={{ width: size, height: size * .78 }} viewBox="0 0 35 27" aria-hidden="true"><path d="M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z" fill="#FF9932" stroke="#FF9932" strokeWidth="2" strokeLinejoin="round" /></svg>
}

export function IllustrationPortrait({ portrait }: { portrait: number }) {
  return <span className={styles.portrait} style={{ '--portrait-column': portrait % 3, '--portrait-row': Math.floor(portrait / 3) } as CSSProperties}>
    <StaticPicture basePath="/static-images/v1/redesign/fictional-diners" widths={[400, 600, 800, 1066]} alt="" width={1536} height={1024} sizes="180px" loading="lazy" />
  </span>
}

export function MaitredCardContent({ locale, stage, tab, viewerDays, standings, publication }: { locale: string; stage: NativeMaitredState; tab: 'regulars' | 'order'; viewerDays?: number; standings?: ReactNode; publication?: number }) {
  const copy = NATIVE_MAITRED_COPY[locale === 'id' ? 'id' : 'en']
  const { own, rows, holder } = illustrationTable(stage, viewerDays)
  const hasOrder = stage !== 'holder'
  const holderName = own ? copy.you : holder.name
  return <div className={`${styles.carousel} ${styles.cardContent}`}>
    {hasOrder && <div className={`${styles.order} ${tab !== 'order' ? styles.hiddenPage : ''}`} aria-hidden={publication !== undefined ? publication < .5 : undefined} style={publication !== undefined ? { visibility: 'visible', opacity: publication } : undefined}>
      <div className={styles.person}>
        <div className={styles.orderAvatar}><NativeCrown size={22} /><IllustrationPortrait portrait={holder.portrait} /></div>
        <div className={styles.personText}><p>{holderName}</p><strong>{copy.maitredAt.replace('{{placeName}}', 'Kendal Street Kitchen')}</strong></div>
      </div>
      <div className={styles.orderText}><p>{own ? copy.yourUsualOrder : copy.usualOrder.replace('{{name}}', holderName)}</p><strong>Harissa prawns</strong></div>
    </div>}
    <div className={`${styles.regulars} ${tab === 'order' && hasOrder ? styles.hiddenPage : ''}`} aria-hidden={publication !== undefined ? publication >= .5 : undefined} style={publication !== undefined ? { visibility: 'visible', opacity: 1 - publication } : undefined}>
      <p className={styles.window}>{copy.countingWindow}</p>
      {standings ?? rows.map(person => <div key={person.id} data-illustration-row={person.id} data-illustration-holder={person.isHolder || undefined} className={`${styles.regularRow} ${person.isYou ? styles.ownRow : ''}`}>
        <span className={styles.rank}>{person.rank}</span>
        <div className={`${styles.rowAvatar} ${person.isHolder ? styles.crownedAvatar : ''}`}>{person.isHolder && <NativeCrown size={16} />}<IllustrationPortrait portrait={person.portrait} /></div>
        <div className={styles.rowName}><strong>{person.isYou ? copy.you : person.name}</strong>{person.isHolder && <span>{copy.role}</span>}</div>
        <strong className={styles.days}>{person.days}</strong>
      </div>)}
    </div>
  </div>
}
