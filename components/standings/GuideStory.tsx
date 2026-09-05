import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import PenRing from '@/components/decision/PenRing'
import { getEatStandings } from '@/lib/eat-standings'
import { getPlaceDirectory } from '@/lib/place-directory'
import { thumbUrl } from '@/lib/thumb'

const MOSAIC = 12
const RINGED = [1, 6, 10]

/**
 * The guide-with-no-inspectors line, told in pictures: one star, alone;
 * a mosaic of real meals saved by the people who ate there, three of them
 * ringed in the site's pen; and what those add up to, the Eat or Yeet
 * screen over the current leader's row. Everything real: the mosaic is
 * public meals from the ranked restaurants, the row is live.
 *
 * `compact` drops the third panel for the homepage and partner page.
 */
export default async function GuideStory({ locale, compact = false }: { locale: string; compact?: boolean }) {
  const t = await getTranslations('Standings')
  const [standings, directory] = await Promise.all([getEatStandings(), getPlaceDirectory()])
  const byId = new Map(directory.map((p) => [p.placeId, p]))

  // Meals from the ranked places first, two each, then the busiest places.
  const thumbs: { id: string; src: string; alt: string }[] = []
  const take = (placeId: string, n: number) => {
    const p = byId.get(placeId)
    if (!p) return
    for (const m of p.meals.slice(0, n)) {
      if (thumbs.length >= MOSAIC) return
      if (thumbs.some((x) => x.id === m.id)) continue
      thumbs.push({ id: m.id, src: m.thumb || thumbUrl(m.src, 240), alt: m.caption ? `${m.caption}, ${p.name}` : p.name })
    }
  }
  for (const r of standings.rows) take(r.placeId, 2)
  for (const p of directory) {
    if (thumbs.length >= MOSAIC) break
    take(p.placeId, 1)
  }
  const leader = standings.rows[0]
  const percent = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB', { style: 'percent', maximumFractionDigits: 0 })

  const panel = 'rounded-2xl border border-brand-line bg-brand-card p-5'
  const caption = 'mt-4 text-base font-bold leading-[1.3] text-brand-ink'
  const sub = 'mt-1 text-sm text-brand-muted'

  return (
    <div className={`grid grid-cols-1 gap-4 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-3'}`}>
      {/* One star, alone. */}
      <figure className={panel}>
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-brand-cream">
          <svg viewBox="0 0 24 24" className="h-14 w-14 text-brand-orange" fill="currentColor" aria-hidden>
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />
          </svg>
        </div>
        <figcaption>
          <p className={caption}>{t('storyOne')}</p>
          <p className={sub}>{t('storyOneSub')}</p>
        </figcaption>
      </figure>

      {/* Everyone who ate there. */}
      <figure className={panel}>
        <div className="relative grid aspect-[4/3] grid-cols-4 gap-1.5 overflow-hidden rounded-xl" role="img" aria-label={t('storyAlt')}>
          {thumbs.map((m, i) => (
            <span key={m.id} className="relative block overflow-hidden rounded-md bg-brand-cream">
              <Image src={m.src} alt="" width={240} height={240} sizes="90px" className="h-full w-full object-cover" loading="lazy" />
              {RINGED.includes(i) ? (
                <span aria-hidden className="pointer-events-none absolute -inset-[8%] block">
                  <PenRing className={i % 2 ? 'rotate-3' : '-rotate-2'} />
                </span>
              ) : null}
            </span>
          ))}
        </div>
        <figcaption>
          <p className={caption}>{t('storyAll')}</p>
          <p className={sub}>{t('storyAllSub')}</p>
        </figcaption>
      </figure>

      {/* What it adds up to. */}
      {!compact ? (
        <figure className={panel}>
          <div className="relative flex aspect-[4/3] items-end justify-center overflow-hidden rounded-xl bg-brand-cream px-4 pt-4">
            <Image
              src="/app-screens/story/eat-or-yeet.webp"
              alt={t('storyScreenAlt')}
              width={760}
              height={1572}
              sizes="160px"
              className="w-[46%] max-w-[10rem] translate-y-[18%] drop-shadow-[0_12px_20px_rgba(43,21,3,0.22)]"
              loading="lazy"
            />
            {leader ? (
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-xl border border-brand-line bg-brand-card px-3 py-2 shadow-[0_8px_20px_-12px_rgba(43,21,3,0.35)]">
                <span className="text-lg font-bold tabular-nums text-brand-orange">1</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-brand-ink">{leader.name}</span>
                  {leader.where ? <span className="block truncate text-xs text-brand-muted">{leader.where.city}</span> : null}
                </span>
                <span className="text-right">
                  <span className="block text-base font-bold leading-none tabular-nums text-brand-ink">{leader.eats}</span>
                  <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-brand-muted">
                    {t('eats', { rate: percent.format(leader.eatRate) })}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
          <figcaption>
            <p className={caption}>{t('storySum')}</p>
            <p className={sub}>{t('storySumSub')}</p>
          </figcaption>
        </figure>
      ) : null}
    </div>
  )
}
