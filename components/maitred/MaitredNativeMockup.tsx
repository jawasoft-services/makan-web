import Image from 'next/image'
import { NATIVE_MAITRED_COPY } from './native-copy'
import styles from './maitred-native-mockup.module.css'

export type NativeMaitredState = 'regulars' | 'holder' | 'order'

// Exact glyphs from the app's @expo/vector-icons Ionicons font, not lookalikes.
const glyphs = { back: '\uf229', share: '\uf572', bookmark: '\uf1a9', info: '\uf399', location: '\uf3c5', add: '\uf103', globe: '\uf350', open: '\uf488' }
function Icon({ name, size = 20 }: { name: keyof typeof glyphs; size?: number }) {
  return <span className={styles.icon} style={{ fontSize: size }}>{glyphs[name]}</span>
}

function Crown({ size }: { size: number }) {
  return <svg width={size} height={size * .78} style={{ width: size, height: size * .78 }} viewBox="0 0 35 27" aria-hidden="true"><path d="M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z" fill="#FF9932" stroke="#FF9932" strokeWidth="2" strokeLinejoin="round" /></svg>
}

/** Source-matched illustration of restaurantPage + MaitredPresentation at
 * native origin/main 18d991a75. The viewport stays 390 × 844 and scales whole.
 * No live identity/counts, network readers or pretend app actions are mounted.
 * The visible Demo label belongs outside this native viewport. */
export default function MaitredNativeMockup({ locale, state = 'order', priority = false }: {
  locale: string
  state?: NativeMaitredState
  priority?: boolean
}) {
  const copy = NATIVE_MAITRED_COPY[locale === 'id' ? 'id' : 'en']
  const own = state !== 'regulars'
  const hasMenu = state !== 'holder'
  const name = own ? copy.you : copy.aRegular
  const venue = '[Kendal Street Kitchen]'
  const dish = '[Harissa prawns]'
  return <div className={styles.scaleBox} aria-hidden="true" data-native-mockup="18d991a75" data-native-state={state}>
    <svg className={styles.canvas} style={{ width: '100%', height: '100%' }} viewBox="0 0 390 844" aria-hidden="true">
      <foreignObject width="390" height="844">
    <div className={styles.viewport} data-native-viewport="390x844">
      <div className={styles.heroImage}><Image src="/redesign/prawns.jpg" alt="" width={2048} height={2048} sizes="390px" priority={priority} /></div>
      <div className={styles.scrollContent}>
        <div className={styles.heroSpacer} />
        <div className={styles.infoSheet}>
          <div className={styles.sheetHandle} />
          <p className={styles.restaurantName}>{venue}</p>
          <div className={styles.metaRow}><span className={styles.ratingChip}><span>EAT OR YEET</span><b>UNRANKED</b></span></div>
          <div className={styles.band}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.tabs}><span className={state !== 'order' ? styles.selectedTab : ''}>{copy.regularsTab}</span><span className={state === 'order' ? styles.selectedTab : ''}>{copy.orderTab}</span></div>
                <span className={styles.information}><Icon name="info" /></span>
              </div>
              <div className={styles.carousel}>
                <div className={`${styles.order} ${state !== 'order' ? styles.hiddenPage : ''} ${!hasMenu ? styles.unpublishedOrder : ''}`}>
                  <div className={styles.person}>
                    <div className={styles.orderAvatar}><Crown size={22} /><span>{name[0]}</span></div>
                    <div className={styles.personText}><p>{name}</p><strong>{copy.maitredAt.replace('{{placeName}}', venue)}</strong></div>
                  </div>
                  <div className={styles.orderText}>{hasMenu && <><p>{own ? copy.yourUsualOrder : copy.usualOrder.replace('{{name}}', name)}</p><strong>{dish}</strong></>}</div>
                </div><div className={`${styles.regulars} ${state === 'order' ? styles.hiddenPage : ''}`}>
                  <p className={styles.window}>{copy.countingWindow}</p>
                  <div className={`${styles.regularRow} ${own ? styles.ownRow : ''}`}>
                    <span className={styles.rank}>—</span>
                    <div className={styles.rowAvatar}><Crown size={16} /><span>{name[0]}</span></div>
                    <div className={styles.rowName}><strong>{name}</strong><span>{copy.role}</span></div>
                    <strong className={styles.days}>—</strong>
                  </div>
                </div>
              </div>
              {own && <div className={styles.ownerActions}><span>{hasMenu ? copy.editMenu : copy.addMenu}</span><span className={styles.shareAction} data-native-disabled={!hasMenu}><Icon name="share" />{copy.shareButton}</span></div>}
            </div>
          </div>
          <div className={styles.detailRow}><Icon name="location" size={15} /><span>[Kendal Street, London]</span></div>
          <div className={`${styles.detailRow} ${styles.website}`}><Icon name="globe" size={15} /><span>[Restaurant website]</span><Icon name="open" size={11} /></div>
        </div>
      </div>
      <div className={`${styles.floating} ${styles.back}`}><Icon name="back" size={22} /></div>
      <div className={`${styles.floating} ${styles.share}`}><Icon name="share" /></div>
      <div className={`${styles.floating} ${styles.bookmark}`}><Icon name="bookmark" /></div>
      <div className={styles.sticky}><span><Icon name="add" size={18} />Post a meal here</span></div>
    </div>
      </foreignObject>
    </svg>
  </div>
}
