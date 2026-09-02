import Link from 'next/link'
import { localizePath } from '@/i18n/paths'
import type { StandingRow } from '@/lib/eat-standings'

/**
 * The standings as a table: rank, restaurant (linked to its page), where,
 * Eats, Yeets, Eat rate, on Makan since. Wide, so it scrolls inside its own
 * box; the page never scrolls sideways. `showWhere` is off on a city page,
 * where every row is in the same place.
 */
export default function StandingsTable({
  rows,
  locale,
  labels,
  showWhere = true,
  caption,
}: {
  rows: StandingRow[]
  locale: string
  labels: { rank: string; restaurant: string; where: string; eats: string; yeets: string; rate: string; since: string }
  showWhere?: boolean
  caption: string
}) {
  const monthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { month: 'short', year: 'numeric' })
  const percent = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB', { style: 'percent', maximumFractionDigits: 0 })
  const th = 'px-4 py-3 sm:px-5'
  return (
    <div className="mt-10 overflow-x-auto rounded-2xl border border-brand-line bg-brand-card">
      <table className={`w-full border-collapse text-left ${showWhere ? 'min-w-[42rem]' : 'min-w-[34rem]'}`}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-brand-line text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
            <th scope="col" className={th}>{labels.rank}</th>
            <th scope="col" className={th}>{labels.restaurant}</th>
            {showWhere ? <th scope="col" className={th}>{labels.where}</th> : null}
            <th scope="col" className={`${th} text-right`}>{labels.eats}</th>
            <th scope="col" className={`${th} text-right`}>{labels.yeets}</th>
            <th scope="col" className={`${th} text-right`}>{labels.rate}</th>
            <th scope="col" className={`${th} text-right`}>{labels.since}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.placeId} className="border-b border-brand-line last:border-b-0">
              <td className="px-4 py-4 text-base font-bold tabular-nums text-brand-orange sm:px-5">{i + 1}</td>
              <th scope="row" className="px-4 py-4 text-base font-semibold text-brand-ink sm:px-5">
                <Link
                  href={localizePath(locale, `/places/${row.slug}`)}
                  className="underline decoration-brand-orange/60 decoration-2 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
                >
                  {row.name}
                </Link>
              </th>
              {showWhere ? (
                <td className="px-4 py-4 text-base leading-[1.35] text-brand-ink sm:px-5">
                  {row.where ? (
                    <>
                      <span className="block">{row.where.city}</span>
                      <span className="block text-sm text-brand-muted">{row.where.country}</span>
                    </>
                  ) : (
                    <span className="text-brand-muted">—</span>
                  )}
                </td>
              ) : null}
              <td className="px-4 py-4 text-right text-base font-bold tabular-nums text-brand-ink sm:px-5">{row.eats}</td>
              <td className="px-4 py-4 text-right text-base tabular-nums text-brand-muted sm:px-5">{row.yeets}</td>
              <td className="px-4 py-4 text-right text-base tabular-nums text-brand-ink sm:px-5">{percent.format(row.eatRate)}</td>
              <td className="px-4 py-4 text-right text-base tabular-nums text-brand-muted sm:px-5">
                {row.since ? monthYear.format(new Date(row.since)) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
