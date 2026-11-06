const copy = {
  en: {
    title: 'Maître d’: your public title and usual order',
    intro: 'Maître d’ is a public title at a restaurant. While you take part and hold the title, anyone can see your Makan display name, profile photo if you have one, restaurant and title on our website without signing in. Your usual order and any accompanying notes appear only when you publish them. Holding a title does not publish an order for you.',
    meals: 'Friends-only meals can count towards your title. This does not change who can see those meals. The public holder card does not show your meal history, visit counts or dates, private progress, taste profile or contact details.',
    control: 'You can turn Maître d’ participation off in Makan. This withdraws your title and published order; your saved meals stay in your diary. Changes can take up to five minutes to appear on a freshly loaded website page. Pages already open, screenshots and copies shared by others may remain.',
    audiences: 'The setting that lets restaurant staff recognise you is separate. Turning staff visibility off does not hide your public title. In-app blocking does not prevent someone from viewing a public website page while signed out.',
    support: 'For help with these controls or to raise a privacy objection, contact',
  },
  id: {
    title: 'Maître d’: gelar publik dan pesanan andalanmu',
    intro: 'Maître d’ adalah gelar publik di sebuah restoran. Selama kamu ikut serta dan memegang gelar, siapa pun dapat melihat nama tampilan Makan, foto profil jika ada, restoran, dan gelarmu di situs kami tanpa masuk ke akun. Pesanan andalan dan catatan pendamping hanya muncul saat kamu menerbitkannya. Memegang gelar tidak otomatis menerbitkan pesanan.',
    meals: 'Makanan hanya-teman dapat dihitung untuk gelarmu. Ini tidak mengubah siapa yang dapat melihat makanan tersebut. Kartu pemegang gelar publik tidak menampilkan riwayat makanan, jumlah atau tanggal kunjungan, progres pribadi, profil selera, atau detail kontakmu.',
    control: 'Kamu dapat mematikan keikutsertaan Maître d’ di Makan. Ini menarik gelar dan pesanan yang telah diterbitkan; makanan tersimpan tetap ada di diarimu. Perubahan dapat memerlukan hingga lima menit untuk muncul pada halaman situs yang dimuat ulang. Halaman yang sudah terbuka, tangkapan layar, dan salinan yang dibagikan orang lain mungkin tetap ada.',
    audiences: 'Pengaturan yang mengizinkan staf restoran mengenalimu bersifat terpisah. Mematikan visibilitas staf tidak menyembunyikan gelar publikmu. Pemblokiran dalam aplikasi tidak mencegah seseorang melihat halaman situs publik tanpa masuk ke akun.',
    support: 'Untuk bantuan dengan pengaturan ini atau menyampaikan keberatan terkait privasi, hubungi',
  },
}

export default function MaitredPrivacyDisclosure({ locale }: { locale: string }) {
  const t = copy[locale === 'id' ? 'id' : 'en']
  return <div id="maitred-visibility" style={{ scrollMarginTop: 120 }}>
    <h3>{t.title}</h3>
    <p>{t.intro}</p>
    <p>{t.meals}</p>
    <p>{t.control}</p>
    <p>{t.audiences}</p>
    <p>{t.support} <a href="mailto:support@makanofficial.com">support@makanofficial.com</a>.</p>
  </div>
}
