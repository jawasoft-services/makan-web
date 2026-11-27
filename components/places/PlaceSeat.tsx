import { getTranslations } from 'next-intl/server'
import StoreButtons from '@/components/site/StoreButtons'
import { siteHref } from '@/components/site/routes'
import type { MaitredPlaceState } from '@/lib/maitred'
import { getVerifiedMenuPrice } from '@/lib/verified-menu-price'

const crown = (className?: string) => <svg className={className} viewBox="0 0 35 27" width="18" height="14" aria-hidden="true"><path d="M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z" fill="#FF9932" stroke="#FF9932" strokeWidth="2" strokeLinejoin="round" /></svg>
const CROWN = crown()

/**
 * A place page's Maître d’ (RM20773, after the prototype's place page and the app's DishMaitredCard).
 * `usual`: the holder's published usual order, as a card inside "What to order". `seat`: the dark chapter
 * for every other proven state (open seat, a holder with no usual yet, undecided, paused); nothing when the
 * state is unknown. Public web rule (Devon, RM20711): the holder is "A regular", never a name.
 */
export default async function PlaceSeat({ locale, placeName, state, variant }: { locale: string; placeName: string; state: MaitredPlaceState; variant: 'usual' | 'seat' }) {
  const t = await getTranslations({ locale, namespace: 'Places' })
  const regular = t('maitredRegular')
  const held = state.status === 'held' ? state.venue : null
  const usual = held && held.notes.always ? held : null

  if (variant === 'usual') {
    if (!usual) return null
    const menuPrice = getVerifiedMenuPrice(usual.slug, usual.notes.always)
    const extras = [
      { label: t('maitredAnother'), body: usual.notes.another },
      { label: t('maitredWhy'), body: usual.notes.why },
      { label: t('maitredTip'), body: usual.notes.tip },
    ].filter(e => e.body)
    return <div className="mdcard pk-usual" data-pop="">
      <span className="mdcap">{t('maitredOrderEyebrow')}</span>
      <span className="mddish">{usual.notes.always}</span>
      {menuPrice ? <a className="tlink" href={menuPrice.menuUrl}>{t('menuPriceLabel', { price: menuPrice.price })}</a> : null}
      <div className="mdrow"><span className="mdav">{crown('crown')}<i aria-hidden="true">{regular.charAt(0)}</i></span><span className="mdwho"><b>{regular}</b><span>Maître d’</span></span></div>
      {extras.length ? <dl>{extras.map(e => <div key={e.label}><dt>{e.label}</dt><dd>{e.body}</dd></div>)}</dl> : null}
    </div>
  }

  if (usual || state.status === 'unavailable') return null
  return <section className="ch dark pk-seat" aria-labelledby="seat">
    <div className="wrap split mid">
      {state.status === 'vacant' ? <div className="mdcard" data-pop="" data-stop="">
        <span className="mdcap">{CROWN}{t('maitredEyebrow')}</span>
        <h2 className="mddish" id="seat">{t('maitredEmptyHead', { name: placeName })}</h2>
        <div className="mdrow"><span className="mdav"><i className="open" aria-hidden="true">?</i></span><span className="mdwho"><span>{t('maitredEmptyBody', { name: placeName })}</span></span></div>
      </div> : held ? <div className="mdcard" data-pop="" data-stop="">
        <span className="mdcap">{CROWN}{t('maitredHeldEyebrow')}</span>
        <h2 className="mddish" id="seat">{regular}</h2>
        <div className="mdrow"><span className="mdav"><i aria-hidden="true">{regular.charAt(0)}</i></span><span className="mdwho"><span>{t('maitredNoNote')}</span></span></div>
      </div> : <div className="mdcard" data-pop="" data-stop="">
        <span className="mdcap">{CROWN}Maître d’</span>
        <h2 className="mddish" id="seat">{t(state.status === 'disabled' ? 'maitredDisabled' : 'maitredUnresolved')}</h2>
      </div>}
      <div>
        <p className="lede" data-rise="">{t('maitredExplain')}</p>
        <a className="tlink" href={siteHref(locale, '/maitre-d')} data-rise="" style={{ '--d': '.08s' } as React.CSSProperties}>{t('maitredHow')} →</a>
        {state.status === 'vacant' ? <div className="btns" data-rise="" style={{ '--d': '.14s' } as React.CSSProperties}><StoreButtons location="place-maitred">{t('maitredCta')}</StoreButtons></div> : null}
      </div>
    </div>
  </section>
}
