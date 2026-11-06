import PlayfulArrow from '@/components/PlayfulArrow'
import Image from 'next/image'
import Link from 'next/link'
import { localizePath } from '@/i18n/paths'
import styles from './editorial.module.css'

export default function EditorialCta({ locale = 'en' }: { locale?: string }) {
  const isId = locale === 'id'
  return (
    <section className={styles.cta}>
      <Image className={styles.ctaArt} src="/redesign/food-noodles.svg" alt="" width={150} height={150} aria-hidden />
      <h2>{isId ? 'Mulai dari makanan berikutnya.' : 'Start with your next meal.'}</h2>
      <Link className={styles.button} href={localizePath(locale, '/app')}>
        {isId ? 'Unduh Makan' : 'Get Makan'} <PlayfulArrow />
      </Link>
    </section>
  )
}
