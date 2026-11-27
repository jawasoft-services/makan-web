import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { em } from '@/components/site/text'
import { localPhoto } from '@/lib/local-photo'
import { localizePath } from '@/i18n/paths'

/**
 * The directory's hero (RM20773, places.html): "Find your next meal." beside one meal photo. The photo is
 * the harissa prawns from Devon's own visit (public/redesign/prawns.jpg), so it links to that place's live
 * page, and is left out when that place is not in the live index.
 */
export default async function PlacesHero({ locale, featured }: { locale: string; featured: { slug: string; name: string; city: string | null } | null }) {
  const t = await getTranslations({ locale, namespace: 'PlaceDirectory' })
  return <section className="ch pl-hero" aria-label={t('title')}>
    <div className="wrap split mid">
      <div>
        <h1 className="big xl" data-rise="">{t.rich('titleRich', { em })}</h1>
        <p className="lede" data-rise="" style={{ '--d': '.12s' } as React.CSSProperties}>{t('intro')}</p>
      </div>
      {featured ? <figure className="pl-feat meal" data-pop="" style={{ '--d': '.2s' } as React.CSSProperties}><Link href={localizePath(locale, `/places/${featured.slug}`)}>
        <Image className="ph" src={localPhoto('/redesign/prawns.jpg', 380)} alt={t('featuredAlt', { name: featured.name })} width={1280} height={1280} priority />
        <figcaption>{featured.name}{featured.city ? <small>{featured.city}</small> : null}</figcaption>
      </Link></figure> : null}
    </div>
  </section>
}
