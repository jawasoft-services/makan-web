"use client"

import StoreLink from "@/components/home/StoreLink"
import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import { APP_STORE_URL } from "@/lib/links"
import { localizePath } from "@/i18n/paths"
import styles from "./AppLanding.module.css"

// Printed business-card QR URLs keep their existing iOS App Store handoff.
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

export default function AppLanding({ rating }: { rating: { rating: number; count: number } | null }) {
  const t = useTranslations("AppPage")
  const locale = useLocale()
  const isId = locale === 'id'
  useEffect(() => { if (isIOS()) window.location.href = APP_STORE_URL }, [])

  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.intro}>
        <div className={styles.copy}>
          <Image className="brand-wordmark brand-wordmark-mobile-center" src="/redesign/logo-orange.svg" alt="Makan" width={132} height={31} />
          <h1>{isId ? 'Buat pesanan berikutnya lebih berkesan.' : 'Make the next order a good one.'}</h1>
          <p className={styles.dek}>{isId ? 'Makanan nyata. Pilihan lebih baik. Diari makananmu sendiri.' : 'Real meals. Better picks. Your own food diary.'}</p>
          <div className={styles.stores}>
            <StoreLink location="app-page" size="large" className={styles.storeLink}>
              <Image src="/app-store-badge.svg" alt={t('cta')} width={180} height={60} />
            </StoreLink>
          </div>
          <a className={styles.qr} href="https://www.makanofficial.com/app">
            <Image src="/app-download-qr.svg" alt={isId ? 'Kode QR untuk mengunduh Makan' : 'Makan app download QR code'} width={104} height={104} />
            <span>{isId ? 'Pindai dengan ponselmu' : 'Scan with your phone'}</span>
          </a>
          <Link className={styles.support} href={localizePath(locale, '/support')}>{isId ? 'Butuh bantuan?' : 'Need a hand?'}</Link>
        </div>
        <div className={styles.phoneScene}>
          <Image className={styles.phone} src="/redesign/feed-seafood-risotto.webp" alt={isId ? 'Seafood risotto di Kendal Street Kitchen dalam aplikasi Makan' : 'Seafood risotto at Kendal Street Kitchen in Makan'} width={1066} height={2198} preload />
          <Image className={styles.fork} src="/redesign/food-fork.svg" alt="" width={130} height={210} aria-hidden />
          <Image className={styles.plate} src="/redesign/food-plate.svg" alt="" width={180} height={180} aria-hidden />
        </div>
      </section>
      {rating ? <aside className={styles.proof} aria-label={isId ? 'Penilaian App Store' : 'App Store rating'}>
        <a href={APP_STORE_URL.replace('/app/', '/gb/app/')}>
          <span className={styles.stars} aria-hidden>{'★'.repeat(Math.round(rating.rating))}</span>
          <strong className="rating-number">{rating.rating.toFixed(1)} <span>/ 5</span></strong>
          <span>{isId ? `Dari ${rating.count} penilaian di App Store Inggris` : `From ${rating.count} ratings on the UK App Store`}</span>
          <span aria-hidden>↗</span>
        </a>
      </aside> : null}
    </main>
  )
}
