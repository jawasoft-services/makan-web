/**
 * RM20773 (Devon, 27 Nov 2026: "lets make a founder story"): the founder story at /story and /id/story.
 * DRAFT: every line here waits for Devon's word-for-word approval before it ships. Claims and their sources:
 * side-session-notes/…/founder-story/CLAIM-LEDGER.md. The retired article (story-copy.ts) is raw material only;
 * nothing here repeats a home page line. {mealCount} is the live count; its sentence hides without one.
 */
export interface FounderStory {
  meta: { title: string; description: string }
  title: string
  dek: string
  byline: string
  chapters: { h: string; p: string[] }[]
}

export const founderStory: Record<'en' | 'id', FounderStory> = {
  en: {
    meta: { title: 'Our story — Makan', description: 'Makan started as a lockdown habit between friends. It took me a long time to see what the habit was for.' },
    title: 'We’d been ordering off each other’s plates for years.',
    dek: 'Makan started as a lockdown habit between friends. It took me a long time to see what the habit was for.',
    byline: 'Devon Makepeace · Founder, Makan',
    chapters: [
      { h: 'One rule', p: [
        'In March 2020, lockdown left my friends spread between Jakarta, Durham and London. The group chat went quiet, the way group chats do, so we started a shared story with one rule: post what you’re eating.',
        'Nobody could eat out, so for about a year every plate was home cooking. The first post was a pan of shakshuka, made in a flat by someone with nowhere to go. Nobody was trying to take a good photo. A plate a day meant you were still there, and it gave us one table we could all sit at.',
      ] },
      { h: 'Then the plates had addresses', p: [
        'When places reopened, the photos started coming from restaurants. Someone would post a dish and someone else would ask where it was, because they wanted to go. When they went, they ordered that same dish.',
        'That kept happening for years. Nobody asked the group what to order. They didn’t need to: they’d already seen what a friend ate and liked.',
      ] },
      { h: 'I built the wrong thing first', p: [
        'I didn’t see what that was. I thought we’d made a food diary, so I built one: a calendar and a photo grid for looking back at meals.',
        'What changed my mind was a dinner in Canggu with three friends. One of them read the restaurant’s rating out loud, hoping it would choose for him. It couldn’t. He was already sitting in the restaurant, and none of those reviews mentioned the dishes in front of him. They asked each other twice and ordered more or less at random.',
        'I knew what to get. That wasn’t taste. My friends had shown me years before, and none of us had noticed.',
      ] },
      { h: 'What Makan does with it', p: [
        'Makan keeps that habit and drops the guessing. You save what you eat and tag the restaurant. Eat or Yeet asks which of two of your own meals you’d eat again, and those picks add up to standings nobody can buy. Where a regular has earned the Maître d’ title, their usual is the first dish a new guest sees.',
        'All of it answers one question: what should I order here?',
      ] },
      { h: 'Where it is now', p: [
        'Makan went live on 19 June 2026. People have saved {mealCount} meals on it so far.',
        'Some of the friends from that first story still post on it, doing what they did in 2020: putting up a plate so someone else knows what to order.',
      ] },
    ],
  },
  id: {
    meta: { title: 'Cerita kami — Makan', description: 'Makan berawal dari kebiasaan kecil antarteman saat lockdown. Butuh waktu lama sampai aku paham kebiasaan itu sebenarnya untuk apa.' },
    title: 'Bertahun-tahun, kami saling contek pesanan.',
    dek: 'Makan berawal dari kebiasaan kecil antarteman saat lockdown. Butuh waktu lama sampai aku paham kebiasaan itu sebenarnya untuk apa.',
    byline: 'Devon Makepeace · Pendiri Makan',
    chapters: [
      { h: 'Satu aturan', p: [
        'Maret 2020, lockdown membuat teman-temanku terpencar di Jakarta, Durham, dan London. Grup chat makin sepi, seperti grup chat pada umumnya. Jadi kami bikin satu story bersama dengan satu aturan: unggah apa yang sedang kamu makan.',
        'Tidak ada yang bisa makan di luar, jadi selama kira-kira setahun semua piring di sana masakan rumah. Unggahan pertama: satu wajan shakshuka, dimasak di sebuah flat oleh orang yang tidak bisa ke mana-mana. Tidak ada yang berusaha bikin foto bagus. Satu piring sehari sudah cukup jadi tanda kamu masih ada, dan story itu jadi satu meja tempat kami semua bisa duduk bersama.',
      ] },
      { h: 'Lalu piringnya punya alamat', p: [
        'Begitu tempat makan buka lagi, fotonya mulai datang dari restoran. Seseorang mengunggah satu hidangan, lalu yang lain bertanya di mana tempatnya, karena mereka ingin ke sana. Saat datang, mereka memesan hidangan yang sama.',
        'Itu terus terjadi selama bertahun-tahun. Tidak ada yang bertanya ke grup mau pesan apa. Tidak perlu: mereka sudah lihat apa yang dimakan dan disukai temannya.',
      ] },
      { h: 'Awalnya aku membangun hal yang salah', p: [
        'Aku tidak sadar apa artinya. Kupikir kami sedang membuat buku harian makanan, jadi aku membangun itu: kalender dan galeri foto untuk melihat lagi makanan yang sudah lewat.',
        'Yang mengubah pikiranku adalah makan malam di Canggu bersama tiga teman. Salah satunya membacakan rating restoran itu keras-keras, berharap angka itu yang memilihkan untuknya. Tidak bisa. Dia sudah duduk di restoran itu, dan tidak satu pun ulasannya menyebut hidangan di depannya. Mereka saling tanya dua putaran, lalu akhirnya pesan asal saja.',
        'Aku tahu harus pesan apa. Itu bukan soal selera. Teman-temanku sudah menunjukkannya bertahun-tahun sebelumnya, tanpa ada yang sadar.',
      ] },
      { h: 'Apa yang Makan lakukan dengan itu', p: [
        'Makan menjaga kebiasaan itu dan membuang tebak-tebakannya. Kamu simpan apa yang kamu makan dan tandai restorannya. Eat or Yeet bertanya mana dari dua makananmu sendiri yang ingin kamu makan lagi, dan pilihan itu terkumpul jadi peringkat yang tidak bisa dibeli siapa pun. Di restoran yang punya Maître d’, pesanan andalan pelanggan tetap itu jadi hidangan pertama yang dilihat tamu baru.',
        'Semuanya menjawab satu pertanyaan: di sini enaknya pesan apa?',
      ] },
      { h: 'Sekarang', p: [
        'Makan rilis pada 19 Juni 2026. Sejauh ini sudah {mealCount} makanan disimpan di sana.',
        'Beberapa teman dari story pertama itu masih mengunggah di sana, melakukan hal yang sama seperti tahun 2020: mengunggah satu piring supaya orang lain tahu mau pesan apa.',
      ] },
    ],
  },
}
