import Link from 'next/link'
import PlayfulArrow from '@/components/PlayfulArrow'
import { localizePath } from '@/i18n/paths'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/lib/links'
import { COFOUNDERS, COMPANY, FOUNDER, LAUNCH, PRESS_ASSETS, PRESS_EMAIL, PRESS_FACTS, QUOTES } from '@/lib/press'
import { pressCopy } from './press-copy'
import styles from './press.module.css'

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
const formatDate = (iso: string, tag: string) => new Intl.DateTimeFormat(tag, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso))
const formatBytes = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

export default function PressPage({ locale, mealCount }: { locale: string; mealCount: number | null }) {
  const isId = locale === 'id'
  const tag = isId ? 'id-ID' : 'en-GB'
  const copy = pressCopy[isId ? 'id' : 'en']
  const values = {
    launched: formatDate(LAUNCH.date, tag),
    ios: PRESS_FACTS.iosMinimum,
    version: PRESS_FACTS.version,
    versionDate: formatDate(PRESS_FACTS.versionDate, tag),
    count: mealCount?.toLocaleString(tag) ?? '',
    legalName: COMPANY.legalName,
    registration: COMPANY.registration,
  }
  const f = copy.facts
  const rows: [string, string][] = [
    [f.price, f.priceValue],
    [f.platform, fill(f.platformValue, values)],
    [f.languages, f.languagesValue],
    [f.launched, fill(f.launchedValue, values)],
    [f.version, fill(f.versionValue, values)],
    ...(mealCount === null ? [] : [[f.meals, fill(f.mealsValue, values)] as [string, string]]),
    [f.company, fill(f.companyValue, values)],
  ]
  const assetLabels = {
    icon: { title: copy.assets.icon, note: null, alt: copy.alt.icon },
    wordmarkOrange: { title: copy.assets.wordmarkOrange, note: copy.assets.forLight, alt: copy.alt.wordmarkOrange },
    wordmarkWhite: { title: copy.assets.wordmarkWhite, note: copy.assets.forDark, alt: copy.alt.wordmarkWhite },
    founderPhoto: { title: copy.assets.founderPhoto, note: null, alt: copy.alt.founder },
  } as const
  const [ewan, julian] = COFOUNDERS
  const founderPhoto = PRESS_ASSETS.find((asset) => asset.id === 'founderPhoto')

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className={styles.intro}>{copy.intro}</p>
          </div>
          <aside className={styles.contactCard} aria-label={copy.contactLabel}>
            <p className={styles.label}>{copy.contactLabel}</p>
            <a className={styles.mail} href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</a>
            <p className={styles.meta}>{COMPANY.legalName}, {COMPANY.city}</p>
            <a className={styles.buttonDark} href="#assets">{copy.downloadAssets}</a>
          </aside>
        </div>
      </header>

      <section className={styles.band}>
        <div className={`${styles.wrap} ${styles.twoCol}`}>
          <div className={styles.text}>
            <p className={styles.label}>{copy.shortLabel}</p>
            <p className={styles.short}>{fill(copy.short, values)}</p>
            <div className={styles.rule} />
            <p className={styles.label}>{copy.longLabel}</p>
            <div className={styles.long}>{copy.long.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          </div>
          <aside className={styles.facts} aria-labelledby="press-facts">
            <h2 id="press-facts">{copy.factsTitle}</h2>
            <dl>
              {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              <div>
                <dt>{f.getIt}</dt>
                <dd className={styles.links}>
                  <a href={APP_STORE_URL}>App Store</a>
                  <a href={GOOGLE_PLAY_URL}>{f.googlePlay}</a>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className={`${styles.band} ${styles.bordered}`} aria-labelledby="press-angles">
        <div className={styles.wrap}>
          <h2 id="press-angles" className={styles.h2}>{copy.anglesTitle}</h2>
          <div className={styles.cards3}>
            {copy.angles.map((angle) => (
              <article key={angle.href} className={styles.card}>
                <h3>{angle.title}</h3>
                <p>{angle.body}</p>
                <Link className={styles.link} href={localizePath(locale, angle.href)}>{angle.link} <PlayfulArrow direction="right" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.bordered}`} aria-labelledby="press-people">
        <div className={styles.wrap}>
          <h2 id="press-people" className={styles.h2}>{copy.peopleTitle}</h2>
          <div className={styles.people}>
            <article className={`${styles.card} ${styles.founder}`}>
              {/* Static file sized for this slot; avoids the runtime image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={founderPhoto?.file} alt={copy.alt.founder} width={380} height={380} />
              <div className={styles.founderBody}>
                <h3>{FOUNDER.name}</h3>
                <p className={styles.role}>{copy.founderRole} · {COMPANY.city}</p>
                <p className={styles.bio}>{copy.founderBio}</p>
                <p className={styles.credit}>{copy.photoCredit}: {founderPhoto && 'credit' in founderPhoto ? founderPhoto.credit : FOUNDER.name}</p>
              </div>
            </article>
            <article className={styles.card}>
              <h3>{ewan.name}</h3>
              <p className={styles.role}>{copy.coFounderRole} · {ewan.city}</p>
              <p className={styles.bio}>{copy.ewanBio}</p>
            </article>
            <article className={styles.card}>
              <h3>{julian.name}</h3>
              <p className={styles.role}>{copy.coFounderRole} · {julian.city}</p>
              <p className={styles.bio}>{copy.julianBio}</p>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.bordered}`} aria-labelledby="press-quotes">
        <div className={styles.wrap}>
          <h2 id="press-quotes" className={styles.h2}>{copy.quotesTitle}</h2>
          <div className={styles.quotes}>
            {QUOTES.map((quote) => (
              <figure key={quote} className={styles.card}>
                <blockquote lang={copy.quotesLang || undefined}>“{quote.replace(/'/g, '’')}”</blockquote>
                <figcaption>{FOUNDER.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="assets" className={`${styles.band} ${styles.bordered} ${styles.last}`} aria-labelledby="press-assets">
        <div className={styles.wrap}>
          <h2 id="press-assets" className={styles.h2}>{copy.assetsTitle}</h2>
          <div className={styles.assets}>
            {PRESS_ASSETS.map((asset) => {
              const label = assetLabels[asset.id]
              const detail = [asset.format, 'dimensions' in asset ? asset.dimensions : null, formatBytes(asset.bytes), label.note, 'credit' in asset ? `${copy.photoCredit}: ${asset.credit}` : null].filter(Boolean).join(' · ')
              const light = asset.id === 'wordmarkWhite' ? styles.previewOrange : styles.previewCream
              const preview = 'preview' in asset ? asset.preview : asset.file
              return (
                <article key={asset.id} className={styles.asset}>
                  <div className={asset.id === 'founderPhoto' ? styles.previewPhoto : `${styles.preview} ${light}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={asset.id === 'icon' ? styles.iconImage : asset.id === 'founderPhoto' ? undefined : styles.wordmarkImage} src={preview} alt={label.alt} loading="lazy" decoding="async" />
                  </div>
                  <div className={styles.assetBody}>
                    <h3>{label.title}</h3>
                    <p>{detail}</p>
                    <a className={styles.buttonLine} href={asset.file} download>{copy.assets.download}</a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
