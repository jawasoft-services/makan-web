import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import { localizePath } from '@/i18n/paths'
import StoreLink from './StoreLink'

export default async function DownloadScene() {
  const locale = await getLocale()
  const t = await getTranslations('Redesign')
  return <section className="download download-scene" id="download" aria-labelledby="download-title">
    <div className="download-art download-bowl"><Image src="/redesign/food-noodles.svg" alt="" width={280} height={290} /></div>
    <div className="download-art download-plate"><Image src="/redesign/food-plate.svg" alt="" width={280} height={290} /></div>
    <div className="download-art download-fork"><Image src="/redesign/food-fork.svg" alt="" width={240} height={300} /></div>
    <div className="download-stamp" aria-hidden="true"><Image src="/redesign/maitred-crown.svg" alt="" width={94} height={76} /><span>Maître d’</span></div>
    <div className="download-word" aria-hidden="true"><Image src="/redesign/logo-orange.svg" alt="" width={240} height={56} /></div>
    <div className="download-content"><h2 id="download-title">{t('end')}</h2><div className="stores"><StoreLink location="home-final" size="compact"><Image src="/redesign/app-store.svg" alt={locale === 'id' ? 'Unduh di App Store' : 'Download on the App Store'} width={164} height={54} /></StoreLink></div><a className="qr" href={localizePath(locale, '/app')}><Image src="/redesign/app-qr.svg" alt={locale === 'id' ? 'Kode QR untuk mengunduh Makan' : 'Makan app download QR code'} width={104} height={104} /><span>{t('scan')}</span></a></div>
  </section>
}
