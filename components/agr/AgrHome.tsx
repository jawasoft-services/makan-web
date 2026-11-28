/* eslint-disable @next/next/no-img-element -- plain <img>: the runtime swaps classes and sizes on
   these, the files are already sized WebP (images are unoptimised site-wide), and the thumbnails are
   /api/thumb URLs. */
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { localizePath } from '@/i18n/paths'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/lib/links'
import AgrRuntime, { type AgrClientData } from './AgrRuntime'
import { plateVariant } from './plates'
import type { AgrData } from './types'
import './agr.css'

/**
 * RM20773: the home page, a faithful port of the approved 26 Nov 2026 prototype
 * (strategy/website-direction-2026-11-25/prototype-src/agr.template.html).
 *
 * Every word is server-rendered from the `Agr` messages, so the page reads without JavaScript and its
 * largest paint is the headline. The 3D and scroll scenes are one client runtime
 * (`runtime/agr-runtime.js`), loaded after first paint by `AgrRuntime`. Section ids and classes are the
 * prototype's: the runtime, the anchors (/#story, /#c3b, /#get) and the shared header rely on them.
 * Dark chapters carry `.dark` so the header can switch colour over them.
 */

type Style = CSSProperties & Record<`--${string}`, string | number>
const css = (s: Record<string, string | number>) => s as Style

const Crown = ({ className, width, height }: { className: string; width: number; height: number }) => (
  <svg className={className} viewBox="0 0 35 27" width={width} height={height} aria-hidden="true">
    <path d="M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z" fill="#FF9932" stroke="#FF9932" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)

const Info = () => (
  <svg className="info" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="#2C3B4D" strokeWidth="1.6" />
    <path d="M12 11v5.2" stroke="#2C3B4D" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="7.8" r="1.1" fill="#2C3B4D" />
  </svg>
)

const STAR = 'M50 4l13.5 29.5 32 3.5-24 22 7 31.5L50 74.5 21.5 90.5l7-31.5-24-22 32-3.5z'
const Stars = () => (
  <svg viewBox="0 0 500 100" preserveAspectRatio="xMinYMid meet">
    {[0, 100, 200, 300, 400].map((x) => <path key={x} transform={`translate(${x} 0)`} d={STAR} />)}
  </svg>
)

const Fork = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1.5-2.5 5-2.5 8h2.5v10" fill="none" stroke="#5B6B74" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Chevron = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M9 6l6 6-6 6" fill="none" stroke="#5B6B74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Sparks thrown off the usual's name when it lands (angle, distance), as in the prototype.
const SPARKS: [number, number][] = [[-75, 64], [-50, 80], [-25, 58], [22, 84], [0, 66], [45, 78], [68, 70], [-90, 60]]
const BOARD_SPARKS = [-150, -110, -70, -30, 10, 50, 110, 160].map((a, i): [number, number] => [a, 60 + (i % 3) * 14])

// The diary month: day number, and the plate (index into data.dishes) saved that day with its drop order.
const DAYS: [number, number | null, number][] = [
  [1, 8, 0], [2, null, 0], [3, 9, 2], [4, 10, 3], [5, null, 0], [6, 11, 5], [7, null, 0],
  [8, null, 0], [9, 12, 1], [10, 13, 2], [11, null, 0], [12, 14, 4], [13, null, 0], [14, 15, 6],
  [15, 16, 0], [16, null, 0], [17, 17, 2], [18, null, 0], [19, 18, 4], [20, 19, 5], [21, null, 0],
]

// The regulars card starts where the climb starts: you on 3 days, the three ahead of you shown.
const RIVAL_DAYS = [14, 11, 9]
const YOU_START = { rank: 7, days: 3 }

// Where each Maître d' sticker sits (the prototype's three), and its card colour class.
const STICKER_SPOTS: { cls: string; style: Style }[] = [
  { cls: '', style: css({ left: '6vw', top: 'max(17vh,156px)', '--r': '-3deg' }) },
  { cls: 'ink', style: css({ right: '6vw', top: 'max(19vh,164px)', '--r': '2.5deg' }) },
  { cls: 'peach', style: css({ left: '9vw', bottom: '9vh', '--r': '2deg' }) },
]

const RING_PATH = 'M500,500 m-420,0 a420,420 0 1,1 840,0 a420,420 0 1,1 -840,0'
// The QR code (www.makanofficial.com/app), as drawn in the prototype.
const QR_PATH =
  'M2 2.5h7m1 0h1m3 0h2m4 0h4m1 0h1m2 0h7M2 3.5h1m5 0h1m2 0h5m1 0h2m1 0h1m1 0h2m4 0h1m5 0h1M2 4.5h1m1 0h3m1 0h1m3 0h1m1 0h1m1 0h1m1 0h1m4 0h2m3 0h1m1 0h3m1 0h1M2 5.5h1m1 0h3m1 0h1m2 0h2m1 0h2m1 0h1m2 0h2m1 0h1m1 0h2m1 0h1m1 0h3m1 0h1M2 6.5h1m1 0h3m1 0h1m1 0h2m2 0h5m3 0h3m3 0h1m1 0h3m1 0h1M2 7.5h1m5 0h1m1 0h4m2 0h1m1 0h4m1 0h1m1 0h2m1 0h1m5 0h1M2 8.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M12 9.5h1m1 0h1m2 0h2m2 0h5M3 10.5h7m2 0h1m2 0h5m1 0h1m2 0h3m2 0h2m3 0h1M4 11.5h3m3 0h6m2 0h5m2 0h1m2 0h2m1 0h2m1 0h1M4 12.5h5m1 0h1m2 0h1m1 0h5m4 0h1m1 0h1m3 0h1m1 0h1M2 13.5h1m1 0h1m1 0h1m2 0h1m1 0h7m1 0h4m2 0h1m1 0h1m2 0h3M2 14.5h1m4 0h2m4 0h2m3 0h1m3 0h4m1 0h1m1 0h3m1 0h2M2 15.5h1m2 0h1m3 0h4m2 0h1m3 0h2m5 0h3m2 0h1m1 0h2M3 16.5h2m2 0h2m2 0h1m1 0h1m3 0h3m2 0h1m4 0h2m1 0h1m2 0h1M2 17.5h1m1 0h1m1 0h2m2 0h2m7 0h1m3 0h2m1 0h3m1 0h3M2 18.5h1m1 0h2m2 0h1m1 0h5m1 0h2m1 0h2m3 0h1m1 0h2m1 0h2m3 0h1M3 19.5h2m6 0h1m3 0h1m3 0h5m1 0h5m1 0h2m1 0h1M2 20.5h1m2 0h4m2 0h1m1 0h1m2 0h2m1 0h1m3 0h1m5 0h2m1 0h2M2 21.5h1m2 0h1m1 0h1m1 0h5m3 0h2m1 0h6m3 0h5M3 22.5h3m2 0h1m2 0h2m3 0h2m2 0h1m2 0h1m2 0h2m1 0h3M2 23.5h1m4 0h1m1 0h2m2 0h6m1 0h1m1 0h3m2 0h3m2 0h1m1 0h1M2 24.5h1m2 0h1m1 0h4m2 0h2m1 0h2m1 0h3m1 0h1m1 0h3m3 0h1m1 0h1M2 25.5h1m3 0h2m2 0h1m1 0h1m3 0h4m1 0h5m1 0h2m1 0h4M2 26.5h1m1 0h2m2 0h3m1 0h1m2 0h5m1 0h1m2 0h7M10 27.5h1m1 0h3m3 0h1m2 0h2m2 0h2m3 0h1m1 0h1m1 0h1M2 28.5h7m1 0h1m2 0h1m1 0h3m2 0h1m1 0h1m1 0h3m1 0h1m1 0h1m1 0h2M2 29.5h1m5 0h1m1 0h2m2 0h2m5 0h2m2 0h2m3 0h4M2 30.5h1m1 0h3m1 0h1m1 0h1m5 0h2m2 0h5m1 0h6m2 0h1M2 31.5h1m1 0h3m1 0h1m1 0h3m1 0h2m1 0h3m5 0h1m1 0h1m2 0h2m2 0h1M2 32.5h1m1 0h3m1 0h1m1 0h1m1 0h3m2 0h1m4 0h1m1 0h6m1 0h1M2 33.5h1m5 0h1m1 0h1m1 0h1m3 0h2m5 0h1m2 0h1m3 0h3M2 34.5h7m2 0h1m1 0h3m3 0h1m4 0h1m1 0h1m2 0h1m3 0h1'

export default async function AgrHome({ data }: { data: AgrData }) {
  const { locale } = data
  const t = await getTranslations({ locale, namespace: 'Agr' })
  const em = (chunks: ReactNode) => <em>{chunks}</em>
  const b = (chunks: ReactNode) => <b>{chunks}</b>
  const dishes = data.dishes
  const dish = (i: number) => dishes[i] ?? dishes[0]
  const usual = dish(0)
  const caption = (i: number) => t('runtime.caption', { name: dish(i).name, venue: dish(i).venue })
  const thumb = (i: number) => plateVariant(dish(i).src, 256)
  const mid = (i: number) => plateVariant(dish(i).src, 384)
  const alt = (d: string, v: string) => t('c4.alt', { dish: d, venue: v })
  const words = (line: string, from: number) =>
    line.split(' ').map((w, i) => (
      <Fragment key={i}>
        {i > 0 ? ' ' : null}
        <span className="w"><span style={css({ '--i': from + i })}>{w}</span></span>
      </Fragment>
    ))
  const head1 = t('c2.head1')
  const days = (n: number) => t(n === 1 ? 'runtime.day' : 'runtime.days', { n })
  const rivals = [t('c3b.rival1'), t('c3b.rival2'), t('c3b.rival3')]
  const chip = t('ch.chip1')
  const client: AgrClientData = {
    locale,
    dishes: dishes.map((d) => ({ name: d.name, venue: d.venue, src: d.src })),
    pins: data.pins.map((p) => [Math.round(p.lat * 1000) / 1000, Math.round(p.lng * 1000) / 1000, p.s]),
    assets: data.assets,
    t: data.t,
  }

  return (
    <main id="main-content" className="agr agr-nojs">
      <canvas id="gl" aria-hidden="true" />

      <section className="hero" style={{ height: `calc(100svh + ${Math.max(0, dishes.length - 1)} * 32vh)` }} aria-label={t('hero.label')}>
        <div className="in gut">
          <h1 className="layer">{t('hero.title')}</h1>
          <div className="arch" aria-hidden="true">
            <div className="disc" />
            <svg viewBox="0 0 1000 1000" id="ring">
              <defs><path id="circ" d={RING_PATH} /></defs>
              <text><textPath href="#circ" textLength="2639" lengthAdjust="spacing">{t('hero.ring')}</textPath></text>
            </svg>
          </div>
          <img className="still" src={usual.src} alt={alt(usual.name, usual.venue)} width={768} height={768} loading="lazy" decoding="async" />
          <p className="caption" id="pilltext">{caption(0)}</p>
          <span className="discover cap">{t('hero.discover')}</span>
          <span className="legal">{t('hero.legal')}</span>
          <a className="skip cap" href="#story">{t('hero.skip')}</a>
        </div>
      </section>

      <section className="s3 hs dark" id="story" aria-label={t('story.label')} style={css({ '--s3-len': 1245 })}>
        <div className="s3-stage">
          <canvas className="s3-canvas" aria-hidden="true" />
          <div className="s3-scrim" aria-hidden="true" />
          <div className="s3-bar" aria-hidden="true"><i /></div>
          <p className="s3-line s3-cap" data-b="cue">{t('story.cue')}</p>
          {(['t1', 't2', 't3', 't5', 't6', 't7', 't8', 't9'] as const).map((k) => (
            <p key={k} className="s3-line s3-thought" data-b={k}>{t(`story.${k}`)}</p>
          ))}
          <p className="s3-line s3-said" data-b="said">{t('story.said')}</p>
          <p className="s3-line s3-cap" data-b="after">{t('story.after')}</p>
          <p className="s3-line s3-cap s3-gap" data-b="gap"><i>{t('story.gap')}</i></p>
        </div>
      </section>

      <section className="c1" id="c1" aria-label={t('c1.label')}>
        <div className="in gut">
          <div className="head layer">
            <h2>{t('c1.title')}</h2>
            <p className="sub">{t('c1.sub')}</p>
          </div>
          <p className="travel layer" id="travel">
            <span>{t('c1.travel')}{' '}</span>
            {[1, 2, 3].map((k) => <span key={k} aria-hidden="true">{t('c1.travel')}{' '}</span>)}
          </p>
        </div>
      </section>

      <section className="c2" aria-label={t('c2.label')}>
        <div className="in gut">
          <div className="stars" aria-hidden="true">
            <div className="o"><Stars /></div>
            <div className="f"><Stars /></div>
          </div>
          <h2 className="head layer">
            <span className="ln">{words(head1, 0)}</span>
            <span className="ln">{words(t('c2.head2'), head1.split(' ').length)}</span>
          </h2>
          <div className="rule" aria-hidden="true" />
          <p className="side l layer">{t('c2.sideL')}</p>
          <p className="side r layer">{t('c2.sideR')}</p>
        </div>
      </section>

      <section className="c3" id="c3" aria-label={t('c3.label')}>
        <div className="in">
          <p className="body layer">{t.rich('c3.body', { em })}</p>
          <p className="caption layer" id="c3cap">{caption(0)}</p>
          <h2 className="title layer">{t('c3.title')}</h2>
        </div>
      </section>

      <section className="c3b" id="c3b" aria-label={t('c3b.label')}>
        <div className="in gut">
          <div className="earn">
            <div className="earncard">
              <div className="regcard" id="regcard">
                <div className="rview">
                  <div className="rtrack">
                    <div className="rpage rec">
                      <div className="mdcard">
                        <span className="mdcap">{t('c3b.whatToOrder')}</span>
                        <span className="mddish">
                          <span className="dname">
                            <span id="ydish">{usual.name}</span>
                            <span className="sparks" aria-hidden="true">
                              {SPARKS.map(([a, d], i) => <i key={i} style={css({ '--a': `${a}deg`, '--d': `${d}px` })} />)}
                            </span>
                          </span>
                        </span>
                        <div className="mdrow">
                          <span className="mdav"><Crown className="crown" width={18} height={14.04} /><i>{t('c3b.youInitial')}</i></span>
                          <span className="mdwho"><b>{t('c3b.you')}</b><span>{t('c3b.maitred')}</span></span>
                          <Info />
                        </div>
                      </div>
                    </div>
                    <div className="rpage regs">
                      <div className="rpanel">
                        <span className="rlabel">{t('c3b.regulars')}</span>
                        <div className="rlist" id="rlist">
                          {rivals.map((name, i) => (
                            <div key={i} className={i === 0 ? 'rrow lead' : 'rrow'} data-k={'JSM'[i]} style={{ transform: `translateY(${i * 52}px)` }}>
                              <span className="rrank">{i + 1}</span>
                              <span className="rav"><Crown className="pcrown" width={16} height={12.5} /><i>{name.slice(0, 1)}</i></span>
                              <b>{name}</b>
                              <span className="rdays">{days(RIVAL_DAYS[i])}</span>
                            </div>
                          ))}
                          <div className="rrow you" data-k="Y" style={{ transform: 'translateY(156px)' }}>
                            <span className="rrank">{YOU_START.rank}</span>
                            <span className="rav"><Crown className="pcrown" width={16} height={12.5} /><i>{t('c3b.youInitial')}</i></span>
                            <b>{t('c3b.you')}</b>
                            <span className="rdays">{days(YOU_START.days)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rdots"><i /><i className="on" /></div>
              </div>
            </div>
            <div className="earnsteps">
              <h2 className="big layer focus">{t('c3b.title')}</h2>
              <p className="step focus">{t.rich('c3b.step1', { b })}</p>
              <p className="step focus">{t.rich('c3b.step2', { b })}</p>
              <p className="step focus">{t.rich('c3b.step3', { b })}</p>
              <p className="step focus usualstep">{t.rich('c3b.step4', { b })}</p>
              <div className="dwell" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section className="c4" aria-label={t('c4.label')}>
        <div className="in">
          <div className="stick">
            <div className="intro">
              <h2 className="head layer">
                <span className="hl">
                  {t('c4.head1')}{' '}
                  <span className="crest" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => <img key={i} data-i={i} className={i === 0 ? 'on' : undefined} src={thumb(i)} alt="" width={256} height={256} loading="lazy" decoding="async" />)}
                  </span>
                </span>
                <span className="hl">{t('c4.head2')}</span>
              </h2>
              <p className="lede layer">{t.rich('c4.lede', { em })}</p>
            </div>
            <div className="feed" aria-label={t('c4.feedLabel')}>
              <ul className="rows layer" id="feed">
                <li>
                  <img className="ph" src={thumb(0)} alt={alt(usual.name, usual.venue)} width={152} height={152} loading="lazy" decoding="async" />
                  <div className="d">
                    <small>{t('c4.firstWhere')}</small>
                    <b>{usual.name}</b>
                    <p className="v">{t('c4.at', { venue: usual.venue })}{usual.handle ? ` ${t('c4.savedBy', { handle: usual.handle })}` : ''}</p>
                  </div>
                </li>
                {data.feed.map((m, i) => (
                  <li key={i}>
                    <img className="ph" src={m.s} alt={alt(m.d, m.v)} width={152} height={152} loading="lazy" decoding="async" />
                    <div className="d">
                      <small>{m.w || t('c4.savedOn')}</small>
                      <b>{m.d}</b>
                      <p className="v">{t('c4.at', { venue: m.v })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="c5" id="c5" aria-label={t('c5.label')}>
        <div className="in">
          <h2 className="big layer">{t('c5.title')}</h2>
          <p className="body layer">{t.rich('c5.body', { em })}</p>
          <span className="lab l layer" id="eat">{t('c5.eat')}</span>
          <span className="lab r layer" id="yeet" style={css({ '--d': '.15s' })}>{t('c5.yeet')}</span>
        </div>
      </section>

      <section className="cr dark" aria-label={t('cr.label')}>
        <div className="in">
          <div className="col layer">
            <h2 className="big">{t('cr.title')}</h2>
            <p className="step">{t('cr.step1')}</p>
            <p className="step near">{t.rich('cr.step2', { em })}</p>
            <div className="step">
              <span className="ex">{t('cr.example')}</span>
              <div className="nums" id="tally">
                <span><b data-n="12">12</b><small>{t('cr.eats')}</small></span>
                <span><b data-n="2">2</b><small>{t('cr.yeets')}</small></span>
                <span><b data-n="1">1</b><small>{t('cr.ties')}</small></span>
              </div>
            </div>
            <p className="step">{t('cr.formula')}</p>
            <div className="step near pct"><b data-n="80" data-s="%">{t('runtime.pct', { n: 80 })}</b><small>{t('cr.pctNote')}</small></div>
            <p className="step">{t('cr.minimum')}</p>
            <p className="step near">{t('cr.own')}</p>
            <p className="step final">{t('cr.final')}</p>
          </div>
        </div>
      </section>

      <section className="cs" aria-label={t('cs.label')}>
        <div className="in">
          <div className="stick">
            <div className="cshead">
              <h2 className="big">{t('cs.title')}</h2>
              <p className="lede">{t('cs.lede', { countries: data.countries })}</p>
            </div>
            <ol className="board" id="board">
              {data.standings.slice(0, 10).map((r) => (
                <li key={r.rank} data-r={r.rank} className={r.rank === 1 ? 'first' : undefined} style={css({ '--w': r.pct / 100 })}>
                  <span className="rk">{r.rank}</span>
                  <span className="th">{r.img ? <img src={r.img} alt="" width={44} height={44} loading="lazy" decoding="async" /> : r.name.charAt(0)}</span>
                  <span className="nm"><b>{r.name}</b><small>{[r.city, r.country].filter(Boolean).join(' · ')}</small></span>
                  <span className="rt">
                    <b className="pc" data-n={r.pct}>{t('runtime.pct', { n: r.pct })}</b>
                    <i className="bar"><i /></i>
                    <small>{t('cs.tally', { eats: r.eats, yeets: r.yeets })}</small>
                  </span>
                  {r.rank === 1 ? (
                    <span className="bsparks" aria-hidden="true">
                      {BOARD_SPARKS.map(([a, d], i) => <i key={i} style={css({ '--a': `${a}deg`, '--d': `${d}px` })} />)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="c6" aria-label={t('c6.label')}>
        <div className="in gut">
          <div className="top">
            <h2 className="big layer">{t('c6.title')}</h2>
            <p className="body layer">{t.rich('c6.body', { em })}</p>
          </div>
          <ol className="days" aria-hidden="true">
            {DAYS.map(([day, i, c]) =>
              i === null || !dishes[i] ? (
                <li key={day} className="e"><span>{day}</span><i className="ring" /></li>
              ) : (
                <li key={day} data-i={i} style={css({ '--c': c })}>
                  <span>{day}</span>
                  <img className="ph" src={thumb(i)} alt={alt(dish(i).name, dish(i).venue)} width={256} height={256} loading="lazy" decoding="async" />
                  <b className="vn">{dish(i).venue}</b>
                </li>
              ),
            )}
          </ol>
        </div>
      </section>

      <section className="cm dark" aria-label={t('cm.label')}>
        <div className="stick">
          <div id="globe" aria-hidden="true"><img className="gposter" src="/agr/globe-poster.webp" alt="" width={900} height={900} loading="lazy" decoding="async" /></div>
          <div className="copy layer">
            <h2 className="big">{t('cm.title')}</h2>
            <p className="body">{t.rich('cm.body', { em })}</p>
          </div>
        </div>
      </section>

      <section className="ch" aria-label={t('ch.label')}>
        <div className="in gut">
          <h2 className="big layer">{t('ch.title')}</h2>
          <div className="ch3d">
            <div className="ch3stage" id="ch3stage" />
            <div className="ch3src" aria-hidden="true">
              <div className="phone flow" id="flowphone">
                <div className="pscreen">
                  <div className="pbar">
                    <span className="pbtn"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 6l12 12M18 6L6 18" stroke="#11181C" strokeWidth="2" strokeLinecap="round" /></svg></span>
                    <b>{t('ch.newMeal')}</b>
                    <span className="pbtn" />
                  </div>
                  <div className="fscr fpick">
                    <div className="gpreview"><img data-dish="0" src={mid(0)} alt="" width={384} height={384} loading="lazy" decoding="async" /></div>
                    <span className="psec">{t('ch.recent')}</span>
                    <div className="ggrid">
                      <span className="gtile cam">
                        <svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" fill="none" stroke="#11181C" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.6" fill="none" stroke="#11181C" strokeWidth="1.7" /></svg>
                      </span>
                      <span className="gtile pick" data-f="tile">
                        <img data-dish="0" src={thumb(0)} alt="" width={256} height={256} loading="lazy" decoding="async" />
                        <svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="11" fill="#FF9932" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      {[3, 7, 1, 16, 11, 6].map((i) => (
                        <span key={i} className="gtile" data-f=""><img data-dish={i} src={thumb(i)} alt="" width={256} height={256} loading="lazy" decoding="async" /></span>
                      ))}
                    </div>
                    <div className="pfoot"><div className="pbtnwrap"><span className="pprimary" data-f="cont">{t('ch.continue')}</span></div></div>
                  </div>
                  <div className="fscr fcomp">
                    <div className="pphoto"><img data-dish="0" src={mid(0)} alt="" width={384} height={384} loading="lazy" decoding="async" /></div>
                    <div className="pplace empty" data-f="place">
                      <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 5v14M5 12h14" stroke="#11181C" strokeWidth="2" strokeLinecap="round" /></svg>
                      <b>{t('ch.addPlace')}</b>
                      <Chevron />
                    </div>
                    <div className="pplace chosen">
                      <span className="pround"><img data-dish="0" src={thumb(0)} alt="" width={256} height={256} loading="lazy" decoding="async" /></span>
                      <span className="pmeta"><b>{t('ch.venue')}</b><span>{t('ch.venueDistance')}</span></span>
                      <Chevron />
                    </div>
                    <div className="pcap" data-f="cap">
                      <span className="ph">{t('ch.capPlaceholder')}</span>
                      <span className="typed"><mark /><span className="rest" /><i className="caret" /></span>
                    </div>
                    <div className="pfoot">
                      <div className="pbtnwrap"><span className="pprimary" data-f="save"><span className="sl">{t('ch.save')}</span></span></div>
                      <div className="pchips">
                        <span className="pchipwrap">
                          <span className="pchip" data-f="chip">
                            <span className="hcap">{chip.slice(0, 1)}<span className="pchipcrown" aria-hidden="true"><Crown className="crown" width={18} height={14} /></span></span>{chip.slice(1)}
                          </span>
                        </span>
                        <span className="pchip">{t('ch.chip2')}</span>
                        <span className="pchip">{t('ch.chip3')}</span>
                      </div>
                    </div>
                  </div>
                  <i className="fdim" />
                  <div className="psheet fsheet place">
                    <i className="grab" />
                    <b className="ptitle">{t('ch.sheetTitle')}</b>
                    <div className="psearch">
                      <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="11" cy="11" r="6.5" fill="none" stroke="#5B6B74" strokeWidth="2" /><path d="M16 16l4 4" stroke="#5B6B74" strokeWidth="2" strokeLinecap="round" /></svg>
                      <span className="q"><span className="qph">{t('ch.search')}</span><span className="qt" /><i className="caret" /></span>
                    </div>
                    <div className="plist">
                      <span className="psec">{t('ch.likely')}</span>
                      <div className="prow" data-f="ksk">
                        <span className="ptile"><img data-dish="0" src={thumb(0)} alt="" width={256} height={256} loading="lazy" decoding="async" /></span>
                        <span className="pmeta"><b>{t('ch.venue')}</b><span>{t('ch.venueDistance')}</span></span>
                      </div>
                      <div className="pmore">
                        <span className="psec">{t('ch.recentPlaces')}</span>
                        <div className="prow"><span className="ptile i"><Fork /></span><span className="pmeta"><b>{t('ch.place2')}</b><span>{t('ch.place2Distance')}</span></span></div>
                        <div className="prow"><span className="ptile i"><Fork /></span><span className="pmeta"><b>{t('ch.place3')}</b><span>{t('ch.place3Distance')}</span></span></div>
                        <span className="psec">{t('ch.nearby')}</span>
                        <div className="prow"><span className="ptile i"><Fork /></span><span className="pmeta"><b>{t('ch.place4')}</b><span>{t('ch.place4Distance')}</span></span></div>
                      </div>
                    </div>
                  </div>
                  <div className="psheet fsheet saved">
                    <i className="grab" />
                    <div className="svhead">
                      <span className="ptile"><img data-dish="0" src={thumb(0)} alt="" width={256} height={256} loading="lazy" decoding="async" /></span>
                      <span className="pmeta"><b>{t('ch.saved')}</b><span>{t('ch.savedMeal')}</span></span>
                    </div>
                    <div className="svbtns">
                      <span className="pprimary" data-f="eoy">{t('ch.eoy')}</span>
                      <span className="psecondary">{t('ch.viewDiary')}</span>
                      <span className="plink">{t('ch.done')}</span>
                    </div>
                  </div>
                  <i className="ftouch" />
                </div>
              </div>
            </div>
            <div className="ch3caps">
              <p className="ch3cap on">{t('ch.cap1')}</p>
              <p className="ch3cap">{t('ch.cap2')}</p>
              <p className="ch3cap">{t('ch.cap3')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="c7" id="c7" aria-label={t('c7.label')}>
        <div className="in7">
          <div className="mid gut">
            <span className="cap">{t('c7.cap')}</span>
            <h2 className="big">{t('c7.title')}</h2>
            <p>{t.rich('c7.body', { b })}</p>
            <p className="fact">{t('c7.fact')}</p>
            <p className="offer">{t('c7.offer')}</p>
            <Link className="obtn" href={localizePath(locale, '/partner')}>{t('c7.cta')}</Link>
          </div>
          {data.stickers.slice(0, STICKER_SPOTS.length).map((s, i) => (
            <div key={i} className={`sticker mdc ${STICKER_SPOTS[i].cls}`} style={STICKER_SPOTS[i].style}>
              <span className="mdv">{s.venue}</span>
              <div className="mdcard">
                <span className="mdcap">{t('c7.whatToOrder')}</span>
                <span className="mddish">{s.dish}</span>
                <div className="mdrow">
                  <span className="mdav"><Crown className="crown" width={18} height={14.04} /><i>{s.initial}</i></span>
                  <span className="mdwho"><b>{s.holder}</b><span>{t('c7.maitred')}</span></span>
                  <Info />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="end" id="get" aria-label={t('end.label')}>
        <div className="ask gut">
          <span className="echo cap">{t('end.echo')}</span>
          <h2 className="big">{t('end.title')}</h2>
          <p className="sub">{t('end.sub')}</p>
          <div className="stores">
            <a className="badge" href={APP_STORE_URL} target="_blank" rel="noopener"><img src="/redesign/app-store.svg" alt={t('end.appStore')} width={156} height={52} loading="lazy" /></a>
            <a className="badge" href={GOOGLE_PLAY_URL} target="_blank" rel="noopener"><img src="/mockup-assets/google-play-badge.png" alt={t('end.googlePlay')} width={134} height={52} loading="lazy" /></a>
          </div>
          <Link className="endqr" href={localizePath(locale, '/app')} aria-label={t('end.qrLabel')}>
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37" shapeRendering="crispEdges">
              <path fill="#FFFFFF" d="M0 0h37v37H0z" />
              <path stroke="#2B1503" d={QR_PATH} />
            </svg>
            <span>{t('end.qrScan')}</span>
          </Link>
        </div>
        <div className="arch" aria-hidden="true">
          <div className="disc" />
          <svg viewBox="0 0 1000 1000" id="ring2">
            <defs><path id="circ2" d={RING_PATH} /></defs>
            <text><textPath href="#circ2" textLength="2639" lengthAdjust="spacing">{t('end.ring')}</textPath></text>
          </svg>
        </div>
      </footer>

      <AgrRuntime data={client} />
    </main>
  )
}
