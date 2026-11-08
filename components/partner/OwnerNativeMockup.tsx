import Image from 'next/image'
import { IllustrationPortrait } from '@/components/maitred/MaitredIllustration'
import { OWNER_NATIVE_PICKS } from './owner-native-data'
import styles from './owner-native-mockup.module.css'

const glyphs = { search: '\uf563', map: '\uf443', navigate: '\uf470', bookmark: '\uf1a9', forward: '\uf23b', arrow: '\uf133', home: '\uf383', calendar: '\uf1d6', profile: '\uf4aa', camera: '\uf1db', back: '\uf229', podium: '\uf4e4' }
function Icon({ name, size = 20 }: { name: keyof typeof glyphs; size?: number }) {
  return <span aria-hidden="true" className={styles.icon} style={{ fontSize: size }}>{glyphs[name]}</span>
}
function Flame({ size = 21 }: { size?: number }) {
  return <span className={styles.flame} style={{ width: size, height: size }} aria-hidden="true">{[1, 2, 3].map(frame => <Image key={frame} src={`/redesign/native/crave-flame-frame-${frame}.png`} width={size} height={size} alt="" />)}</span>
}

// App-owned translations at baabae579; names, dishes and hardcoded native copy stay unchanged.
const copy = {
  en: {
    search: 'Search places and dishes', nearby: 'Nearby', openMap: 'Open map', cravings: 'Cravings', savedMeals: '2 saved', wantToTry: 'Want to try', savedPlaces: '3 places',
    option: 'One good option', optionBody: 'Only when there is something useful nearby', source: 'In your Cravings', distance: '650 m away', viewPlace: 'View place',
    cravingsTitle: 'From your Cravings', cravingsBody: 'Turn something you saved into somewhere to go', seeAll: 'See all',
    mapTitle: 'Explore the map', mapBody: 'See the places behind meals on Makan', nearbyTitle: 'Find somewhere nearby', mapSources: 'Switch between public places and your friends',
    picksEyebrow: 'THE MAKAN SHORTLIST', picks: 'Makan picks', picksBody: 'Places worth sending someone to',
    liveRanking: 'Live ranking', publicEatOrYeet: 'Public Eat or Yeet', minimumMatchups: '10+ matchup minimum',
    discoverLabel: 'Illustrated Makan Discover screen. Scroll for Cravings, friends and the map.', dashboardLabel: 'Illustrated owner dashboard with example figures. Scroll for all owner tools.',
  },
  id: {
    search: 'Cari tempat dan hidangan', nearby: 'Di dekatmu', openMap: 'Buka peta', cravings: 'Cravings', savedMeals: '2 tersimpan', wantToTry: 'Ingin dicoba', savedPlaces: '3 tempat',
    option: 'Satu pilihan bagus', optionBody: 'Hanya saat ada pilihan berguna di dekatmu', source: 'Di Cravings-mu', distance: '650 m dari sini', viewPlace: 'Lihat tempat',
    cravingsTitle: 'Dari Cravings-mu', cravingsBody: 'Jadikan hidangan tersimpan sebagai tempat untuk dikunjungi', seeAll: 'Lihat semua',
    mapTitle: 'Jelajahi peta', mapBody: 'Lihat tempat di balik hidangan di Makan', nearbyTitle: 'Cari tempat di dekatmu', mapSources: 'Beralih antara tempat publik dan temanmu',
    picksEyebrow: 'PILIHAN TERBAIK MAKAN', picks: 'Makan Picks', picksBody: 'Tempat yang layak direkomendasikan',
    liveRanking: 'Peringkat langsung', publicEatOrYeet: 'Eat or Yeet publik', minimumMatchups: 'Minimum 10 duel',
    discoverLabel: 'Ilustrasi layar Discover Makan. Gulir untuk Cravings, teman, dan peta.', dashboardLabel: 'Ilustrasi dasbor pemilik dengan angka contoh. Gulir untuk semua alat pemilik.',
  },
}
type NativeCopy = typeof copy.en
function PicksCard({ text }: { text: NativeCopy }) {
  const list = OWNER_NATIVE_PICKS.ranked
  return <div className={styles.picksFeatured}><div className={styles.picksCard} data-native-picks-card={list.id}>
    <div className={styles.picksPhoto}><Image src={list.imageSrc} alt={list.leadingRating.restaurantName} fill sizes="362px" /><span className={styles.picksPhotoShade} /><div className={styles.picksTopRow}><span className={styles.picksChip}><Icon name="podium" size={12} />{text.liveRanking}</span><span className={styles.picksSeal}><b>{list.leadingRating.eatPercent}%</b><span>EAT</span></span></div></div>
    <div className={styles.picksCopy}><p className={styles.picksMarket}>{text.publicEatOrYeet}</p><p className={styles.picksTitle}>{list.title} <em>{list.titleItalicWord}</em></p><p className={styles.picksSubtitle}>{list.subtitle}</p><div className={styles.picksMeta}><span>{text.minimumMatchups}</span><Icon name="arrow" size={15} /></div></div>
  </div></div>
}
const cravings = [
  { image: '/redesign/prawns.jpg', caption: 'Harissa prawns' },
  { image: '/redesign/tiramisu.jpg', caption: 'Tiramisu' },
]

function Discover({ text, mapImage }: { text: NativeCopy; mapImage: string }) {
  return <>
    <div className={styles.discoverContent}>
      <div className={styles.shortcuts}>
        {([{ title: text.nearby, subtitle: text.openMap, icon: 'navigate' }, { title: text.cravings, subtitle: text.savedMeals, icon: null }, { title: text.wantToTry, subtitle: text.savedPlaces, icon: 'bookmark' }] as const).map(item => <div className={styles.shortcut} key={item.title}><span className={styles.shortcutIcon}>{item.icon ? <Icon name={item.icon} size={19} /> : <Flame />}</span><strong>{item.title}</strong><small>{item.subtitle}</small></div>)}
      </div>
      <section className={styles.decisionSection} data-native-owner-section="decision">
        <div className={styles.sectionHeading}><p className={styles.sectionTitle}>{text.option}</p><p className={styles.secondary}>{text.optionBody}</p></div>
        <div className={styles.decisionRail}><div className={styles.decisionCard}><Image src="/redesign/prawns.jpg" alt="Harissa prawns at Kendal Street Kitchen" width={2048} height={2048} sizes="334px" /><span className={styles.decisionGradient} /><span className={styles.sourcePill}><Flame size={17} />{text.source}</span><span className={styles.distance}><Icon name="navigate" size={14} />{text.distance}</span><div className={styles.decisionCopy}><strong>Kendal Street Kitchen</strong><p>London · Harissa prawns</p><span>{text.viewPlace}<Icon name="arrow" size={17} /></span></div></div></div>
      </section>
      <section className={styles.cravingsSection} data-native-owner-section="cravings">
        <div className={styles.sectionHeading}><div className={styles.headingRow}><p className={styles.sectionTitle}><Flame />{text.cravingsTitle}</p><span className={styles.seeAll}>{text.seeAll}<Icon name="forward" size={16} /></span></div><p className={styles.secondary}>{text.cravingsBody}</p></div>
        <div className={styles.cravingsRail}>{cravings.map(meal => <div className={styles.cravingCard} key={meal.caption}><div className={styles.cravingImage}><Image src={meal.image} alt={meal.caption} width={2048} height={2048} sizes="164px" /><span className={styles.flameBadge}><Flame size={18} /></span></div><strong>Kendal Street Kitchen</strong><p>{meal.caption}</p></div>)}</div>
      </section>
      <section className={styles.friendsSection} data-native-owner-section="friends">
        <div className={styles.friendsHeading}><p className={styles.sectionTitle}>Where your friends ate lately</p><p className={styles.secondary}>Places shared in your circle&apos;s meals</p></div>
        <div className={styles.friendsRail}>{[{ image: '/redesign/dining.jpg', name: 'Jamie & Alex', portrait: 1 }, { image: '/redesign/prawns.jpg', name: 'Priya', portrait: 2 }].map(place => <div className={styles.friendCard} key={place.name}><Image src={place.image} alt="Meal at Kendal Street Kitchen" width={2048} height={2048} sizes="150px" /><div className={styles.friendInfo}><strong>Kendal Street Kitchen</strong><div className={styles.friendProof}><span><IllustrationPortrait portrait={place.portrait} /></span><p>{place.name}</p></div></div></div>)}</div>
      </section>
      <section className={styles.aroundSection} data-native-owner-section="map">
        <div className={styles.aroundHeading}><div><p className={styles.sectionTitle}>{text.mapTitle}</p><p className={styles.secondary}>{text.mapBody}</p></div><span className={styles.openMap}>{text.openMap}<Icon name="forward" size={15} /></span></div>
        <div className={styles.mapCanvas} data-native-map-capture><Image src={mapImage} alt={`${text.nearbyTitle}. ${text.mapSources}`} fill sizes="358px" /></div>
      </section>
      <section className={styles.picksSection} data-native-owner-section="picks">
        <div className={styles.picksHeading}><Image src="/redesign/native/makan-mark.png" width={42} height={42} alt="" /><div><small>{text.picksEyebrow}</small><p>{text.picks}</p><span className={styles.secondary}>{text.picksBody}</span></div><span className={styles.confetti} aria-hidden="true"><i /><i /><i /></span></div>
        <PicksCard text={text} />
      </section>
    </div>
  </>
}

function MetricRow({ values }: { values: readonly (readonly [number, string])[] }) {
  return <div className={styles.metricsRow}>{values.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
}
function Dashboard() {
  return <div className={styles.dashboard}>
    <div className={styles.dashboardHeader}><span><Icon name="back" size={24} /></span><p>Business Dashboard</p><b>Pro</b></div>
    <div className={styles.dashboardCards}>
      <section className={styles.dashboardCard} data-native-owner-section="month"><p className={styles.cardTitle}>This month</p><MetricRow values={[[20, 'Visitors'], [52, 'Posts'], [0, 'Almost regulars']]} /></section>
      <section className={styles.dashboardCard} data-native-owner-section="visits"><p className={styles.cardTitle}>Visit breakdown</p><MetricRow values={[[12, '1st visit'], [0, '2nd visit'], [8, 'Regulars (3+)']]} /></section>
      <section className={styles.dashboardCard} data-native-owner-section="meal-types"><p className={styles.cardTitle}>Most posted</p><div className={styles.postedList}>{[['Dinner', 24], ['Lunch', 18], ['Snack', 7], ['Breakfast', 3]].map(([label, value], index) => <div key={label}><span>{index + 1}. {label}</span><span>{value} posts</span></div>)}</div></section>
      <section className={styles.dashboardCard} data-native-owner-section="reward"><div className={styles.rewardContent}><p className={styles.cardTitle}>Reward your almost-regulars</p><p className={styles.cardBody}>Send a thank-you offer to people who came back twice.</p><span className={styles.cardArrow}><Icon name="forward" size={18} /></span></div></section>
      <section className={`${styles.dashboardCard} ${styles.publicPosts}`} data-native-owner-section="posts"><p className={styles.cardTitle}>What people are posting</p><p className={styles.cardBody}>See real photos and posts from your restaurant.</p><span className={styles.cardArrow}><Icon name="forward" size={18} /></span></section>
      <section className={`${styles.dashboardCard} ${styles.businessCard}`} data-native-owner-section="business"><p className={styles.cardTitle}>Your business</p><p className={styles.businessName}>Kendal Street Kitchen • Verified ✓</p><p className={styles.businessPlan}>Plan: Pro</p></section>
    </div>
  </div>
}

/** Exact native source layout, local authored data; provenance in NATIVE-MOCKUP-SOURCE.md. */
export default function OwnerNativeMockup({ screen, locale }: { screen: 'discover' | 'dashboard'; locale: string }) {
  const language = locale === 'id' ? 'id' : 'en'
  const text = copy[language]
  return <div className={styles.scaleBox} data-owner-native-mockup={screen} data-native-source="baabae57929cadd5f2f3e1fa3331a1b9deacff3c">
    <svg className={styles.canvas} style={{ width: '100%', height: '100%' }} viewBox="0 0 390 844" role="presentation"><foreignObject width="390" height="844"><div className={styles.viewport} data-native-viewport="390x844">
      {screen === 'discover' && <div className={styles.searchHeader} aria-hidden="true"><span className={styles.search}><Icon name="search" /><span>{text.search}</span></span><span className={styles.mapToggle}><Icon name="map" size={22} /></span></div>}
      <div key={screen} className={`${styles.scroll} ${screen === 'discover' ? styles.discoverScroll : ''}`} role="region" aria-label={screen === 'discover' ? text.discoverLabel : text.dashboardLabel} tabIndex={0} data-lenis-prevent>
        {screen === 'discover' ? <Discover text={text} mapImage={`/redesign/native/reference-map-${language}.png`} /> : <Dashboard />}
      </div>
      <Image className={styles.statusBar} src="/redesign/native/reference-status-white.png" width={1170} height={141} sizes="390px" alt="" aria-hidden="true" />
      {screen === 'discover' && <div className={styles.tabBar} aria-hidden="true"><Icon name="home" size={24} /><span className={styles.compass}>{'\uf15a'}</span><span className={styles.camera}><Icon name="camera" size={22} /></span><Icon name="calendar" size={24} /><Icon name="profile" size={28} /></div>}
    </div></foreignObject></svg>
  </div>
}
