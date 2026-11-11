// Copy for /press. The English is the kit's approved wording (strategy/press-2026-11-11/PRESS_KIT.md).
// The Indonesian is written fresh, not machine-translated, and must be read by Reza or Fani before it is published.
// Placeholders are filled from lib/press.ts so facts live in one place: {launched} {ios} {count}.
export type PressCopy = {
  eyebrow: string
  title: string
  intro: string
  contactLabel: string
  downloadAssets: string
  shortLabel: string
  short: string
  longLabel: string
  long: readonly string[]
  factsTitle: string
  facts: { price: string; priceValue: string; platform: string; platformValue: string; languages: string; languagesValue: string; launched: string; launchedValue: string; version: string; versionValue: string; meals: string; mealsValue: string; company: string; companyValue: string; getIt: string; googlePlay: string }
  anglesTitle: string
  angles: readonly { title: string; body: string; link: string; href: string }[]
  peopleTitle: string
  founderRole: string
  coFounderRole: string
  photoCredit: string
  founderBio: string
  ewanBio: string
  julianBio: string
  quotesTitle: string
  quotesLang: string
  assetsTitle: string
  assets: { icon: string; wordmarkOrange: string; wordmarkWhite: string; founderPhoto: string; forLight: string; forDark: string; download: string }
  alt: { icon: string; wordmarkOrange: string; wordmarkWhite: string; founder: string }
}

export const pressCopy: { en: PressCopy; id: PressCopy } = {
  en: {
    eyebrow: "Press",
    title: "What to know about Makan",
    intro: "Makan is a free app for deciding what to order. This page has what you need to write about it, and who to ask for the rest.",
    contactLabel: "Press contact",
    downloadAssets: "Download assets",
    shortLabel: "In short",
    short: "Makan is a free app that helps you decide what to order. You save the meals you eat, and Makan asks which of two of your own meals you’d eat again first. Restaurants can’t pay to change what it shows. Makan launched on the App Store on {launched} and is available in English and Bahasa Indonesia.",
    longLabel: "The longer version",
    long: [
      "Makan is a free app for the minute at a restaurant when the menu is open and you have no idea what to order.",
      "You save the meals you eat. Once you have a few, Makan puts two of your own meals side by side and asks which you’d eat again first. That is how it learns your taste.",
      "Every restaurant on Makan has a Maître d’: the diner who has eaten there on the most days, with at least two visits in 60 days. The title is earned by eating and can’t be bought. The Maître d’ can leave a short guide to the place: what to always get, what to try, what’s good to know.",
    ],
    factsTitle: "Fact sheet",
    facts: {
      price: "Price", priceValue: "Free",
      platform: "Platform", platformValue: "iPhone, iOS {ios} or later. Android is in open testing.",
      languages: "Languages", languagesValue: "English, Bahasa Indonesia",
      launched: "Launched", launchedValue: "{launched}, App Store",
      version: "Current version", versionValue: "{version}, released {versionDate}",
      meals: "Meals saved", mealsValue: "{count} so far",
      company: "Company", companyValue: "{legalName}, registered in England and Wales, no. {registration}",
      getIt: "Get Makan", googlePlay: "Google Play (open testing)",
    },
    anglesTitle: "Three ways to tell it",
    angles: [
      { title: "Every restaurant has a Maître d’.", body: "A named, earned local regular, with their own guide to the place.", link: "See how Maître d’ works", href: "/maitre-d" },
      { title: "Nobody can pay to rank.", body: "Restaurants can’t buy a place in what Makan shows.", link: "For restaurants", href: "/partner" },
      { title: "Built from the table.", body: "A founder watched four friends at a table in Canggu read a star rating out loud to decide what to order.", link: "Read the story", href: "/story" },
    ],
    peopleTitle: "The people",
    founderRole: "Founder",
    coFounderRole: "Co-founder",
    photoCredit: "Photo",
    // Must equal FOUNDER.bio in lib/press.ts (checked by press.test.mjs).
    founderBio: "Born in Jakarta and raised across Singapore and Bali, now based in London. He wrote most of Makan himself and is studying for an MSc in Bioscience Futures at Imperial College London.",
    ewanBio: "Devon’s father. He runs PT Jawasoft, a Jakarta software house working since 2000, whose team provides development and QA for Makan.",
    julianBio: "A close friend of Devon’s and a student at NYU. He leads finance and would lead any US work.",
    quotesTitle: "In Devon’s words",
    quotesLang: "",
    assetsTitle: "Assets",
    assets: { icon: "App icon", wordmarkOrange: "Wordmark, orange", wordmarkWhite: "Wordmark, white", founderPhoto: "Founder photo", forLight: "for light backgrounds", forDark: "for orange or dark backgrounds", download: "Download" },
    alt: { icon: "Makan app icon", wordmarkOrange: "Makan wordmark in orange", wordmarkWhite: "Makan wordmark in white", founder: "Devon Makepeace, founder" },
  },
  id: {
    eyebrow: "Untuk media",
    title: "Yang perlu kamu tahu tentang Makan",
    intro: "Makan adalah aplikasi gratis untuk memutuskan mau pesan apa. Halaman ini berisi bahan untuk menulis tentang Makan, dan siapa yang bisa ditanya untuk sisanya.",
    contactLabel: "Kontak media",
    downloadAssets: "Unduh materi",
    shortLabel: "Singkatnya",
    short: "Makan adalah aplikasi gratis yang membantumu memutuskan mau pesan apa. Kamu menyimpan makanan yang kamu santap, lalu Makan bertanya mana dari dua makananmu yang ingin kamu pesan lagi lebih dulu. Restoran tidak bisa membayar untuk mengubah apa yang ditampilkan Makan. Makan diluncurkan di App Store pada {launched} dan tersedia dalam bahasa Inggris dan Bahasa Indonesia.",
    longLabel: "Versi lengkapnya",
    long: [
      "Makan adalah aplikasi gratis untuk saat di restoran ketika menu sudah terbuka dan kamu tidak tahu mau pesan apa.",
      "Kamu menyimpan makanan yang kamu santap. Setelah punya beberapa, Makan menaruh dua makananmu berdampingan dan bertanya mana yang ingin kamu pesan lagi lebih dulu. Begitulah Makan belajar seleramu.",
      "Setiap restoran di Makan punya Maître d’: pengunjung yang paling banyak makan di sana, dengan sedikitnya dua kunjungan dalam 60 hari. Gelar ini didapat dengan makan dan tidak bisa dibeli. Maître d’ bisa meninggalkan panduan singkat tentang tempat itu: apa yang selalu dipesan, apa yang layak dicoba, dan apa yang perlu diketahui.",
    ],
    factsTitle: "Lembar fakta",
    facts: {
      price: "Harga", priceValue: "Gratis",
      platform: "Platform", platformValue: "iPhone, iOS {ios} atau lebih baru. Android sedang dalam uji coba terbuka.",
      languages: "Bahasa", languagesValue: "Inggris, Bahasa Indonesia",
      launched: "Diluncurkan", launchedValue: "{launched}, App Store",
      version: "Versi saat ini", versionValue: "{version}, dirilis {versionDate}",
      meals: "Makanan tersimpan", mealsValue: "{count} sejauh ini",
      company: "Perusahaan", companyValue: "{legalName}, terdaftar di Inggris dan Wales, no. {registration}",
      getIt: "Unduh Makan", googlePlay: "Google Play (uji coba terbuka)",
    },
    anglesTitle: "Tiga cara menceritakannya",
    angles: [
      { title: "Setiap restoran punya Maître d’.", body: "Pengunjung tetap setempat yang didapat lewat kunjungan, dengan panduannya sendiri untuk tempat itu.", link: "Lihat cara kerja Maître d’", href: "/maitre-d" },
      { title: "Tidak ada yang bisa membayar untuk peringkat.", body: "Restoran tidak bisa membeli tempat dalam apa yang ditampilkan Makan.", link: "Untuk restoran", href: "/partner" },
      { title: "Dibangun dari meja makan.", body: "Seorang pendiri melihat empat temannya di sebuah meja di Canggu membacakan rating bintang untuk memutuskan mau pesan apa.", link: "Baca ceritanya", href: "/story" },
    ],
    peopleTitle: "Orang-orangnya",
    founderRole: "Pendiri",
    coFounderRole: "Salah satu pendiri",
    photoCredit: "Foto",
    founderBio: "Lahir di Jakarta dan besar di Singapura dan Bali, kini tinggal di London. Ia menulis sebagian besar Makan sendiri dan sedang menempuh MSc Bioscience Futures di Imperial College London.",
    ewanBio: "Ayah Devon. Ia menjalankan PT Jawasoft, perusahaan perangkat lunak di Jakarta yang berdiri sejak 2000, yang timnya menyediakan pengembangan dan QA untuk Makan.",
    julianBio: "Sahabat dekat Devon dan mahasiswa NYU. Ia memimpin urusan keuangan dan akan memimpin pekerjaan di AS.",
    quotesTitle: "Kata Devon",
    quotesLang: "en",
    assetsTitle: "Materi",
    assets: { icon: "Ikon aplikasi", wordmarkOrange: "Logotipe, oranye", wordmarkWhite: "Logotipe, putih", founderPhoto: "Foto pendiri", forLight: "untuk latar terang", forDark: "untuk latar oranye atau gelap", download: "Unduh" },
    alt: { icon: "Ikon aplikasi Makan", wordmarkOrange: "Logotipe Makan berwarna oranye", wordmarkWhite: "Logotipe Makan berwarna putih", founder: "Devon Makepeace, pendiri" },
  },
}
