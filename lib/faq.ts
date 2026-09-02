// Single source of truth for the homepage FAQ — rendered by components/FAQ.tsx
// and emitted as FAQPage JSON-LD by components/FaqSchema.tsx. Edit Q&As here only.
//
// Questions are phrased as real search queries (People Also Ask / AI answer
// engines), and every answer leads with a direct, extractable first sentence.
// Product claims are verified against the app. Audience is a binary Public /
// Friends Only choice. The first post is locked to Friends Only; later composer
// sessions remember the user's last explicit choice. Do not describe Friends
// Only as the universal default, reintroduce a "Private (just you)" posting
// audience, or claim the whole app has no algorithm (only the Friends feed is
// chronological).
export interface FaqItem {
  q: string
  a: string
}

export const FAQS: FaqItem[] = [
  {
    q: 'What is Makan?',
    a: "Makan is a food diary you keep with friends. Snap a photo of your meal, tag the place if it matters, and it stays in your record — the kind that remembers what you'd otherwise forget.",
  },
  {
    q: 'Is Makan free?',
    a: "Yes. Makan is free on the App Store and built for iPhone. Android is in the works, and we don't have a release date to share yet.",
  },
  {
    q: 'What does “makan” mean?',
    a: "It means “eat” in Malay and Indonesian. Devon — our founder — is Indonesian, so naming a food app Makan made sense.",
  },
  {
    q: 'Who can see my meals? Is my food private?',
    a: "Your first post is Friends Only. After that, choose Public or Friends Only when you post. Makan remembers the audience you last chose for the next meal, and you can switch it before posting. Public means anyone on Makan can see it; Friends Only means only your friends can.",
  },
  {
    q: 'Does Makan count calories or track macros?',
    a: "No. No calories, no macros, no nutrition scores, no grading your dinner. Makan is a photo diary, not a tracker — it remembers what you ate, not what it “cost” you.",
  },
  {
    q: 'What is Eat or Yeet?',
    a: "Eat or Yeet puts two meals from your diary side by side and asks which you'd eat again first. Your choices build your Top 4 and a full ranking of your own meals. It's your taste, so only you get a vote.",
  },
  {
    q: 'How is Makan different from Yelp or Google reviews?',
    a: "Makan is built around meal posts, not restaurant reviews. It keeps your own diary, shows a chronological Friends feed and offers a separate Public feed for discovery.",
  },
  {
    q: 'Does Makan use AI?',
    a: "No. AI has never tasted food — it can't smell, can't chew, can't remember being hungry as a kid. So it doesn't write your captions, rank your meals, or guess what you ate from a photo. That part's yours.",
  },
  {
    q: 'What’s the difference between a like and a crave?',
    a: "A like is the quick “yum” you give a friend's meal. A crave is stronger — it saves that exact dish to your want-to-try list, for the moment a friend posts something and you need to eat it immediately.",
  },
  {
    q: 'Is there a streak?',
    a: "Yes. Post a meal a day to keep it. Miss one and it ends — no insurance, no make-ups. People get oddly attached.",
  },
]

export const FAQS_ID: FaqItem[] = [
  {
    q: 'Apa itu Makan?',
    a: 'Makan adalah jurnal makanan yang kamu isi bersama teman. Foto makananmu, tandai tempatnya kalau penting, lalu semuanya tetap tersimpan — termasuk detail yang biasanya pelan-pelan terlupakan.',
  },
  {
    q: 'Apakah Makan gratis?',
    a: 'Ya. Makan gratis di App Store dan dibuat untuk iPhone. Versi Android sedang dikerjakan, tetapi kami belum punya tanggal rilis.',
  },
  {
    q: 'Apa arti kata “makan”?',
    a: 'Artinya ya, “makan” dalam bahasa Indonesia dan Melayu. Devon, pendiri kami, orang Indonesia. Jadi nama ini terasa paling pas untuk aplikasi tentang makanan.',
  },
  {
    q: 'Siapa yang bisa melihat postingan makananku?',
    a: 'Postingan pertamamu adalah Friends Only. Setelah itu, kamu bisa memilih Public atau Friends Only setiap kali memposting. Makan mengingat pilihan audiens terakhirmu, dan kamu tetap bisa menggantinya sebelum posting. Public berarti semua orang di Makan bisa melihatnya; Friends Only hanya untuk temanmu.',
  },
  {
    q: 'Apakah Makan menghitung kalori atau makro?',
    a: 'Tidak. Tidak ada hitung kalori, makro, skor nutrisi, atau penilaian untuk makan malammu. Makan adalah jurnal foto, bukan aplikasi pelacak — yang disimpan adalah apa yang kamu makan, bukan berapa “harganya” bagi tubuhmu.',
  },
  {
    q: 'Apa itu Eat or Yeet?',
    a: 'Eat or Yeet menaruh dua makanan dari jurnalmu berdampingan, lalu menanyakan mana yang paling ingin kamu makan lagi. Pilihanmu membentuk Top 4 dan peringkat lengkap makananmu sendiri. Ini seleramu, jadi hanya kamu yang punya hak suara.',
  },
  {
    q: 'Apa bedanya Makan dengan Yelp atau ulasan Google?',
    a: 'Makan dibuat untuk postingan makanan, bukan ulasan restoran. Makan menyimpan jurnalmu sendiri, menampilkan feed Friends secara kronologis, dan punya feed Public terpisah untuk mencari inspirasi.',
  },
  {
    q: 'Apakah Makan memakai AI?',
    a: 'Tidak. AI belum pernah mencicipi makanan — tidak bisa mencium aromanya, mengunyah, atau mengingat rasanya lapar saat kecil. Jadi AI tidak menulis caption, memberi peringkat, atau menebak makananmu dari foto. Bagian itu tetap milikmu.',
  },
  {
    q: 'Apa bedanya like dan crave?',
    a: 'Like adalah reaksi cepat untuk makanan temanmu. Crave lebih serius — makanan itu masuk ke daftar yang ingin kamu coba, untuk momen ketika teman memposting sesuatu dan kamu langsung ingin ikut makan.',
  },
  {
    q: 'Apakah ada streak?',
    a: 'Ada. Posting satu makanan setiap hari untuk menjaganya. Lewat satu hari dan streak berakhir — tanpa asuransi atau kesempatan susulan. Anehnya, orang-orang cepat sayang pada streak mereka.',
  },
]

export function getFaqs(locale: string) {
  return locale === 'id' ? FAQS_ID : FAQS
}

// The decision-first homepage asks fewer questions, and leads with the one
// the whole page is about. Curated from the list above (same truths, same
// wording) plus one new entry; the live FAQ is untouched.
const DECISION_FAQ_EN: FaqItem = {
  q: 'How does Makan know what to order?',
  a: "From real meals. Your Eat or Yeet picks tell Makan what you like. Other people's picks tell it which dishes get ordered again at each place, as totals, never as names. If a place has too few meals, Makan says so instead of guessing.",
}
const DECISION_FAQ_ID: FaqItem = {
  q: 'Dari mana Makan tahu apa yang harus dipesan?',
  a: 'Dari makanan sungguhan. Pilihanmu di Eat or Yeet memberi tahu Makan apa yang kamu suka. Pilihan orang lain memberi tahu Makan hidangan mana yang dipesan lagi di tiap tempat, sebagai jumlah total, bukan nama. Kalau makanan di suatu tempat masih terlalu sedikit, Makan bilang begitu daripada menebak.',
}
// Indexes into FAQS / FAQS_ID (both lists share an order): free, Eat or Yeet,
// who can see, AI.
const DECISION_PICKS = [1, 5, 3, 7]

export function getDecisionFaqs(locale: string) {
  const [lead, source] = locale === 'id' ? [DECISION_FAQ_ID, FAQS_ID] : [DECISION_FAQ_EN, FAQS]
  return [lead, ...DECISION_PICKS.map((i) => source[i])]
}
