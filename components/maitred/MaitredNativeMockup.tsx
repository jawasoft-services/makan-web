import Image from 'next/image'
import { NATIVE_MAITRED_COPY, NATIVE_RESTAURANT_COPY } from './native-copy'
import { ILLUSTRATION_DINERS, ILLUSTRATION_EOY, ILLUSTRATION_MEALS, IllustrationPortrait, MaitredCardContent, illustrationTable, illustrationViewerMeals, type NativeMaitredState } from './MaitredIllustration'
import styles from './maitred-native-mockup.module.css'

export type { NativeMaitredState } from './MaitredIllustration'

// Exact glyphs from the app's @expo/vector-icons Ionicons font.
const glyphs = { back: '\uf229', share: '\uf572', bookmark: '\uf1a9', info: '\uf399', location: '\uf3c5', add: '\uf103', globe: '\uf350', open: '\uf488', star: '\uf595', call: '\uf1d9', navigate: '\uf470', restaurant: '\uf536', storefront: '\uf5a8', ribbon: '\uf544' }
function Icon({ name, size = 20 }: { name: keyof typeof glyphs; size?: number }) {
  return <span aria-hidden="true" className={styles.icon} style={{ fontSize: size }}>{glyphs[name]}</span>
}

function MealThumbs({ meals }: { meals: readonly { image: string; caption: string }[] }) {
  return <div className={styles.thumbs}>{meals.slice(0, 4).map((meal, index) => <Image key={`${meal.image}-${index}`} src={meal.image} alt={meal.caption} width={160} height={160} sizes="85px" />)}</div>
}

/** Native restaurantPage + MaitredPresentation at main18d991a75, with an
 * explicitly authored fictional story. Source/provenance: NATIVE-MOCKUP-SOURCE.md. */
export default function MaitredNativeMockup({ locale, state = 'order', priority = false }: {
  locale: string
  state?: NativeMaitredState
  priority?: boolean
}) {
  const language = locale === 'id' ? 'id' : 'en'
  const copy = NATIVE_MAITRED_COPY[language]
  const restaurantCopy = NATIVE_RESTAURANT_COPY[language]
  const { own, rows, holder } = illustrationTable(state)
  const visits = rows.find(person => person.isYou)!.days
  const ownMeals = illustrationViewerMeals(state)
  const canCompare = new Set(ownMeals.map(meal => meal.dishId)).size >= 2
  const hasMenu = state !== 'holder'
  const score = ILLUSTRATION_EOY
  const scrollLabel = language === 'id' ? 'Layar restoran Kendal Street Kitchen. Gulir untuk detail restoran.' : 'Kendal Street Kitchen restaurant screen. Scroll for restaurant details.'
  return <div className={styles.scaleBox} data-native-mockup="18d991a75" data-native-state={state}>
    <svg className={styles.canvas} style={{ width: '100%', height: '100%' }} viewBox="0 0 390 844" role="presentation">
      <foreignObject width="390" height="844">
        <div className={styles.viewport} data-native-viewport="390x844">
          <div className={styles.heroImage}><Image src="/redesign/prawns.jpg" alt="" width={2048} height={2048} sizes="390px" priority={priority} /></div>
          <div className={styles.scrollContent} data-lenis-prevent role="region" aria-label={scrollLabel} tabIndex={0}>
            <div className={styles.heroSpacer} />
            <div className={styles.restaurantContent}>
              <div className={styles.infoSheet}>
                <div className={styles.sheetHandle} />
                <p className={styles.restaurantName}>Kendal Street Kitchen</p>
                <div className={styles.metaRow} data-native-section="restaurant-meta">
                  <span className={styles.googleRating}><Icon name="star" size={13} /><b>4.8</b></span>
                  <span className={styles.ratingChip}><span>EAT OR YEET</span><b>{score.percent}%</b></span>
                  <span className={styles.metaLabel}>££</span>
                  <span className={styles.openStatus}><i />Closes at 9:30 PM</span>
                  <span className={styles.metaLabel}><Icon name="restaurant" size={12} />{36 + visits} meals</span>
                </div>
                <div className={styles.band} data-native-section="maitred">
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div className={styles.tabs}><span className={hasMenu && state !== 'order' ? styles.selectedTab : ''}>{copy.regularsTab}</span>{hasMenu && <span className={state === 'order' ? styles.selectedTab : ''}>{copy.orderTab}</span>}</div>
                      <span className={styles.information}><Icon name="info" /></span>
                    </div>
                    <MaitredCardContent locale={locale} stage={state} tab={state === 'order' ? 'order' : 'regulars'} />
                    {own && <div className={styles.ownerActions}><span>{hasMenu ? copy.editMenu : copy.addMenu}</span><span className={styles.shareAction} data-native-disabled={!hasMenu}><Icon name="share" />{copy.shareButton}</span></div>}
                  </div>
                </div>
                <div className={styles.detailRow} data-native-section="address"><Icon name="location" size={15} /><span>17–20 Kendal Street, London W2 2AW</span><Icon name="navigate" size={14} /></div>
                <div className={`${styles.detailRow} ${styles.website}`} data-native-section="phone"><Icon name="call" size={15} /><span>020 3973 1903</span></div>
                <div className={`${styles.detailRow} ${styles.website}`} data-native-section="website"><Icon name="globe" size={15} /><span>kendalstreetkitchen.com</span><Icon name="open" size={11} /></div>
                <div className={`${styles.detailRow} ${styles.website}`} data-native-section="claim"><Icon name="storefront" size={15} /><span>{restaurantCopy.ownThisPlace}</span></div>
              </div>
              <div className={styles.restaurantBand} data-native-section="your-meals">
                <p className={styles.bandEyebrow}>YOU</p>
                <p className={styles.bandTitle}>You&apos;ve eaten here {visits === 1 ? 'once' : `${visits} times`}</p>
                <p className={styles.visitSpan}>{visits < 3 ? 'Visited Nov 2026' : 'First visit Oct 2026 · last Nov 2026'}</p>
                <MealThumbs meals={ownMeals} />
              </div>
              <div className={`${styles.restaurantBand} ${styles.decision}`} data-native-section="dish-guidance">
                <p className={styles.decisionHeading}>{restaurantCopy.decisionHeading}</p>
                {hasMenu ? <div className={styles.evidence}><span className={styles.evidenceIcon}><Icon name="ribbon" size={18} /></span><div><strong>{restaurantCopy.maitredEvidence.replace('{{name}}', holder.name)}</strong><p>Harissa prawns</p></div></div> : <div className={styles.memoryCard}><p>{restaurantCopy.memory}</p><Image src={ownMeals[0].image} alt="" width={318} height={199} sizes="318px" /><strong>{ownMeals[0].caption}</strong></div>}
                <span className={styles.decisionAction}>{canCompare ? restaurantCopy.eatOrYeet : restaurantCopy.saveMeal}</span>
              </div>
              <div className={styles.restaurantBand} data-native-section="cravings">
                <div className={styles.signalHeading}><p className={styles.bandEyebrow}><span className={styles.craveFlame} aria-hidden="true">{[1, 2, 3].map(frame => <Image key={frame} src={`/redesign/native/crave-flame-frame-${frame}.png`} alt="" width={18} height={18} />)}</span>IN YOUR CRAVINGS</p><span>2 meals</span></div>
                <MealThumbs meals={ILLUSTRATION_MEALS.slice(0, 2)} />
              </div>
              <div className={styles.restaurantBand} data-native-section="eat-or-yeet">
                <div className={styles.signalHeading}><p className={styles.bandEyebrow}>EAT OR YEET</p></div>
                <div className={styles.scoreCard}>
                  <div className={styles.scoreLead}><strong>{score.percent}%</strong><div><b>{restaurantCopy.publicEatHeadline.replace('{{percent}}', String(score.percent))}</b><p>{restaurantCopy.publicEatHeadCount_other.replace('{{count}}', String(score.comparisons))}</p></div></div>
                  <div className={styles.ratioTrack}><span style={{ flex: score.eat }} /><span style={{ flex: score.yeet }} /></div>
                  <div className={styles.ratioLabels}><span>{score.percent}% Eat</span><span>{100 - score.percent}% Yeet</span></div>
                  <p className={styles.signalFootnote}>{restaurantCopy.publicEatFootHigh}</p>
                </div>
              </div>
              <div className={styles.restaurantBand} data-native-section="friends">
                <p className={styles.bandEyebrow}>FRIENDS</p>
                <div className={styles.friendAvatars}>{ILLUSTRATION_DINERS.slice(1).map(person => <span key={person.id}><IllustrationPortrait portrait={person.portrait} /></span>)}</div>
                <p className={styles.friendNames}>Jamie Morgan, Sam Rivera &amp; 3 others have eaten here</p>
              </div>
              <div className={styles.recentHeader} data-native-section="recent-meals"><div className={styles.recentRow}><p>RECENT MEALS</p><div className={styles.segments}><span>Everyone</span><span>Friends</span></div></div></div>
              <div className={styles.mealGrid}>{ILLUSTRATION_MEALS.map(meal => <div key={meal.image} className={styles.mealTile}><Image src={meal.image} alt={meal.caption} width={360} height={440} sizes="180px" /><div><strong>{meal.name}</strong><p>{meal.caption}</p></div></div>)}</div>
            </div>
          </div>
          <div className={`${styles.floating} ${styles.back}`} aria-hidden="true"><Icon name="back" size={22} /></div>
          <div className={`${styles.floating} ${styles.share}`} aria-hidden="true"><Icon name="share" /></div>
          <div className={`${styles.floating} ${styles.bookmark}`} aria-hidden="true"><Icon name="bookmark" /></div>
          <div className={styles.sticky} aria-hidden="true"><span><Icon name="add" size={18} />Post a meal here</span></div>
        </div>
      </foreignObject>
    </svg>
  </div>
}
