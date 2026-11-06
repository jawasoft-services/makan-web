'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'

export default function ErrorPage({ reset }: { reset: () => void }) {
  const isId = useLocale() === 'id'
  return <main id="main-content" className="recovery-page">
    <Image className="brand-wordmark" src="/redesign/logo-orange.svg" alt="Makan" width={168} height={40} />
    <Image src="/redesign/food-noodles.svg" alt="" width={160} height={140} />
    <h1>{isId ? 'Halaman ini belum bisa dibuka.' : 'This page couldn’t load.'}</h1>
    <button type="button" className="button orange text-white" onClick={reset}>{isId ? 'Coba lagi' : 'Try again'}</button>
    <Link href={isId ? '/id' : '/'}>{isId ? 'Kembali ke Makan' : 'Back to Makan'}</Link>
  </main>
}
