import { APP_STORE_URL } from '@/lib/links'

export default function RatingCarousel({ rating, locale, className = '' }: { rating: number; locale: string; className?: string }) {
  const isId = locale === 'id'
  return <aside className={`store-proof rating-carousel ${className}`} aria-label={isId ? 'Penilaian App Store' : 'App Store rating'}>
    <label className="rating-pause">
      <input type="checkbox" aria-label={isId ? 'Jeda animasi bintang' : 'Pause star animation'} />
      <svg viewBox="0 0 24 24" aria-hidden="true"><path className="rating-pause-icon" d="M8 5v14M16 5v14" /><path className="rating-play-icon" d="m8 5 11 7-11 7Z" /></svg>
    </label>
    <a className="rating-loop" href={APP_STORE_URL.replace('/app/', '/gb/app/')} aria-label={isId ? `${rating.toFixed(1)} bintang di App Store` : `${rating.toFixed(1)} stars on the App Store`}>
      <span className="rating-track" aria-hidden="true">
        {[0, 1].map(set => <span className="rating-set" key={set}>
          {[0, 1, 2].map(copy => <span className="rating-copy" key={copy}>
            <span className="proof-stars">{Array.from({ length: Math.round(rating) }, (_, i) => <span key={i}>★</span>)}</span>
            <strong className="rating-number">{rating.toFixed(1)}</strong>
          </span>)}
        </span>)}
      </span>
    </a>
  </aside>
}
