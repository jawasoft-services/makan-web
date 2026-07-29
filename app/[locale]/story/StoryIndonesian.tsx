import Link from "next/link"
import { APP_STORE_URL } from "@/lib/links"
import { PRESS_EMAIL } from "@/lib/press"

export default function StoryIndonesian({
  mealCount,
}: {
  mealCount: number
}) {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-2xl px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-32"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
        Cerita Makan
      </p>
      <h1
        className="mt-4 text-3xl font-bold text-brand-ink sm:text-4xl lg:text-5xl"
        style={{ letterSpacing: "-0.02em" }}
      >
        Hari berjalan
        <br />
        mengelilingi waktu makan.
      </h1>

      <div className="mt-8 space-y-5 text-[15px] leading-[1.75] text-brand-muted sm:text-base">
        <p>
          Aku anak third culture. Rasanya seperti warga dari mana-mana, sekaligus
          bukan dari mana pun. Lahir di Jakarta, besar di Singapura dan Bali,
          sekarang tinggal di Durham. Nama aplikasinya pun datang dari sana:
          <em> makan</em> berarti “to eat” dalam bahasa Indonesia. Perasaan hidup
          di banyak tempat itulah akar dari semuanya.
        </p>
        <p>
          Saat COVID datang, teman-teman terdekatku tersebar di berbagai negara
          dan kami semua terjebak di rumah masing-masing. Entah kenapa semua orang
          jadi serius soal makanan. Aku membuat satu shared story di Snapchat dan
          mengajak mereka memposting apa pun yang sedang dimakan. Itu menjadi satu
          tempat di mana kami masih bisa duduk di meja yang sama.
        </p>
        <p>
          Story itu tidak pernah benar-benar berhenti. Ia menemani masa COVID,
          GCSE, A level, sampai kuliah. Teman mengajak teman, dan makanan muncul
          setiap hari. Saat tahun kedua kuliah aku mengunjungi seorang teman di
          NYU, aku duduk di New York sambil makan sepotong pizza dan mempostingnya
          ke story yang sama. Baru saat itu aku sadar: tanpa sengaja aku sudah
          membuat catatan fotografis tentang hidupku, satu makanan setiap kali.
          Dari situlah Makan lahir.
        </p>
        <p>
          Di tengah perjalanan itu aku juga sadar kita sering melihat makanan dari
          sisi yang salah. Semua orang mengejar tempat yang sedang ramai, rating
          4 koma sekian, dan antrean yang viral tiga hari lalu. Sementara itu,
          makanan di ulang tahun ayahmu yang ke-50 bisa hilang begitu saja dari
          ingatan. Makanan bukan catatan kaki dari sebuah hari. Justru hari itu
          berjalan mengelilingi waktu makan. Makan dibuat agar momen-momen itu tidak
          ikut hilang.
        </p>
        <p>
          Caranya sederhana: foto makanan langsung di aplikasi, tambahkan caption,
          tandai siapa yang ada bersamamu, beri lokasi kalau sedang di luar, lalu
          posting. Lama-kelamaan semuanya menjadi jurnalmu. Setiap makanan duduk
          berdampingan dengan momen yang hanya kamu pahami. Jurnalmu menjadi
          ceritamu.
        </p>
        <p>
          Tidak ada hitung kalori dan tidak ada bintang. Aku memeriksa sekitar 150
          restoran di Durham di Google; hampir separuh punya rating 4,5 atau lebih.
          Kalau hampir semuanya mendapat angka setinggi itu, angkanya berhenti
          membantu. Makan punya Eat or Yeet. Dua makananmu bertemu satu lawan satu:
          rendang buatan nenek melawan nasi goreng abang-abang jam dua pagi.
          Pilihanmu membentuk peringkat pribadi dari waktu ke waktu. Seperti Top 4
          di Letterboxd, tetapi untuk makanan. Makan malammu bukan 4 koma sekian
          dari 5. Ia bisa jadi nomor satu sepanjang masa, dan orang lain tidak
          punya hak suara.
        </p>
        <p>
          Aku memimpin produk dan desain, bekerja bersama tim developer
          berpengalaman di Jawasoft, Jakarta. Ayahku menghabiskan kariernya di
          dunia software di sana dan mencintai makanan sebesar aku. Akhirnya ini
          menjadi proyek ayah dan anak yang sungguhan. Dalam sedikit lebih dari
          setahun, idenya sudah hadir di App Store.
        </p>
        <p>
          Kami meluncur pada Juni 2026. Sekarang sudah ada beberapa ratus orang di
          Makan, dengan lebih dari {mealCount.toLocaleString("id-ID")} momen makan
          tersimpan.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-brand-line bg-brand-card p-6">
        <p className="text-sm leading-relaxed text-brand-muted">
          Lihat bagaimana orang memakai Makan lewat ulasan langsung tentang
          tempat-tempat yang benar-benar mereka ingat.
        </p>
        <Link
          href="/blog"
          className="mt-3 inline-block text-sm font-semibold text-brand-orange hover:underline"
        >
          Baca ulasannya dalam bahasa Inggris →
        </Link>
      </div>

      <div className="mt-12 border-t border-brand-line pt-10">
        <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">
          Untuk media
        </h2>
        <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
          Makan adalah jurnal makanan sosial untuk iPhone yang membantu orang
          menyimpan apa yang mereka makan, di mana, dan bersama siapa. Dibuat
          oleh Devon Makepeace, pendiri berdarah Indonesia, Makan menggabungkan
          jurnal pribadi, feed Friends yang kronologis, dan pilihan berbagi
          Public atau Friends Only.
        </p>
        <p className="mt-6 text-[15px] text-brand-muted">
          Kontak media:{" "}
          <a
            href={`mailto:${PRESS_EMAIL}`}
            className="text-brand-orange hover:underline"
          >
            {PRESS_EMAIL}
          </a>
        </p>
        <a
          href={APP_STORE_URL}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand-orange px-7 text-sm font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
        >
          Unduh di App Store
        </a>
      </div>
    </main>
  )
}
