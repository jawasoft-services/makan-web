import { illustrationTable, IllustrationPortrait, NativeCrown, type NativeMaitredState } from './MaitredIllustration'
import { NATIVE_MAITRED_COPY } from './native-copy'
import styles from './maitred-native-mockup.module.css'

function layout(days: number) {
  const { rows } = illustrationTable(days === 8 ? 'holder' : 'qualify', days)
  let top = 0
  const positions = new Map(rows.map(person => {
    // Native row: 40 minimum; holder name23 + gap1 + role20 + padding8 = 52.
    const height = person.isHolder ? 52 : 40
    const position = { top, height, holder: Number(person.isHolder), opacity: 1 }
    top += height + 4
    return [person.id, position] as const
  }))
  return { positions, height: top - 4 }
}

/** Every position is a function of scroll progress, including partial row swaps. */
export default function MaitredStandings({ locale, state, days, dayProgress = days, reducedMotion = false }: {
  locale: string; state: NativeMaitredState; days: number; dayProgress?: number; reducedMotion?: boolean
}) {
  const copy = NATIVE_MAITRED_COPY[locale === 'id' ? 'id' : 'en']
  const { rows } = illustrationTable(state, days)
  const maya = illustrationTable('regulars').rows.find(person => person.id === 'maya')!
  const actors = rows.some(person => person.id === 'maya') ? rows : [...rows, maya]
  const value = reducedMotion ? days : Math.max(1, Math.min(8, dayProgress))
  const fraction = value - Math.floor(value)
  const blend = fraction * fraction * (3 - 2 * fraction)
  const from = layout(Math.floor(value)), to = layout(Math.ceil(value))
  const mix = (a: number, b: number) => a + (b - a) * blend
  const flight = reducedMotion ? 0 : Math.sin(Math.PI * Math.max(0, value - 7))
  return <div className={styles.movingTable} style={{ height: mix(from.height, to.height) }} data-animated-standings data-days={days} data-day-progress={value}>
    {actors.map(person => {
      const hidden = { top: 144, height: 40, holder: 0, opacity: 0 }
      const start = from.positions.get(person.id) ?? hidden
      const end = to.positions.get(person.id) ?? hidden
      const holderWeight = mix(start.holder, end.holder)
      const roleVisible = person.id === 'jamie' || person.isYou
      // Pass to the right so the other profile stays visible even when scrolling stops mid-swap.
      const passing = person.isYou && start.top !== end.top ? Math.sin(Math.PI * blend) * 72 : 0
      return <div key={person.id} data-illustration-row={person.id} data-illustration-holder={person.isHolder || undefined}
        aria-hidden={!rows.some(row => row.id === person.id) || undefined}
        style={{ transform: `translateY(${mix(start.top, end.top)}px)`, left: passing, width: `calc(100% - ${passing}px)`, height: mix(start.height, end.height), opacity: mix(start.opacity, end.opacity), zIndex: person.isYou ? 2 : 1 }}
        className={`${styles.regularRow} ${styles.movingRow} ${person.isYou ? styles.ownRow : ''}`}>
        <span className={styles.rank}>{person.rank}</span>
        <div data-row-avatar className={styles.rowAvatar} style={{ paddingTop: holderWeight * 14 }}><IllustrationPortrait portrait={person.portrait} /></div>
        <div className={styles.rowName} style={{ gap: holderWeight }}><strong>{person.isYou ? copy.you : person.name}</strong>{roleVisible && <span aria-hidden={!person.isHolder || undefined} style={{ height: holderWeight * 20, opacity: person.isHolder ? holderWeight : 0 }}>{copy.role}</span>}</div>
        <strong className={styles.days}>{person.days}</strong>
      </div>
    })}
    <span className={styles.movingCrown} style={{ transform: `translate(${flight * 12}px, ${3 - flight * 26}px) rotate(${-14 * flight}deg) scale(${1 + .16 * flight})` }} data-moving-crown aria-hidden="true"><NativeCrown size={16} /></span>
  </div>
}
