'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import localFont from 'next/font/local'
import styles from './not-found.module.css'

const jakarta = localFont({ src: '../public/fonts/PlusJakartaSans-Latin-Variable.woff2', weight: '400 800', display: 'swap' })

export default function NotFound() {
  const isId = usePathname()?.startsWith('/id/')
  return <main id="main-content" className={`${styles.page} ${jakarta.className}`}>
    <Image className={styles.logo} src="/redesign/logo-orange.svg" alt="Makan" width={168} height={40} />
    <Image src="/redesign/food-noodles.svg" alt="" width={160} height={140} />
    <p>404</p>
    <h1>{isId ? 'Halaman tidak ditemukan.' : 'Page not found.'}</h1>
    <Link href={isId ? '/id' : '/'} className={styles.button}>{isId ? 'Kembali ke Makan' : 'Back to Makan'}</Link>
  </main>
}
