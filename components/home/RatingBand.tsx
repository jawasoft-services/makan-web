import styles from "./RatingBand.module.css"

// Enough repeats per group to cover a 4K-wide screen before the loop restarts.
const REPEATS = 8

/** Five stars, filled to the rounded rating, so the band stays true if the average moves. */
function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="tracking-[0.12em] text-brand-orange">
      {"★".repeat(filled)}
      <span className="text-white/25">{"★".repeat(5 - filled)}</span>
    </span>
  )
}

/** The live App Store rating as a full-width band travelling across the screen. */
export default function RatingBand({ text, rating }: { text: string; rating: number }) {
  return (
    <div className={`${styles.band} bg-brand-espresso py-4 text-white`}>
      <p className="sr-only">{text}</p>
      <div className={styles.track} aria-hidden="true">
        {[0, 1].map((group) => (
          <div key={group} className={styles.group}>
            {Array.from({ length: REPEATS }, (_, i) => (
              <span key={i} className={`${styles.item} text-sm font-bold uppercase tracking-[0.08em] sm:text-base`}>
                <Stars rating={rating} />
                <span>{text}</span>
                <Stars rating={rating} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
