import Link from "next/link"
import { Emphasis } from "@/components/Emphasis"

// Indonesian manifesto. Same story, told in Indonesian — not translated.
// It travels through one meal: kamu duduk -> menunya datang -> harus pilih ->
// Makan menjawab -> dari mana jawabannya -> kalau tidak tahu -> makanannya
// datang -> kamu makan -> yang tidak akan kami lakukan -> awalnya ->
// kamu pulang -> lain kali kamu duduk di tempat baru.
//
// Register: "kamu" throughout, never "Anda". "kami" whenever the team speaks,
// because the reader did not build this. Short sentences, everyday words, no
// strategy language. Category loanwords (menu, review) stay English.
export default function ManifestoIndonesian() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-brand-cream text-brand-ink"
    >
      <article className="mx-auto max-w-[680px] px-5 pb-24 pt-32 sm:px-8 sm:pb-32 sm:pt-40">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">
          Manifesto
        </p>

        <h1 className="mt-6 text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-brand-ink sm:text-[52px] lg:text-[64px]">
          Kamu duduk. Menunya datang. Kamu{" "}
          <Emphasis variant="warm" trigger="load">
            bingung&nbsp;mau&nbsp;makan&nbsp;apa
          </Emphasis>
          .
        </h1>

        <div className="mt-12 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
          <p className="text-[19px] font-medium text-brand-ink sm:text-xl">
            Makan itu buat saat itu.
          </p>
          <p>
            Aplikasi makanan yang lain sudah membantu kamu sampai sini. Mereka
            memberi peringkat tempat. Empat setengah, dua ribu review, jadi kamu
            datang. Bagus. Tapi sekarang kamu sudah duduk, ada dua puluh menu di
            depanmu, dan tidak ada satu bintang pun yang memberi tahu kamu harus
            makan yang mana.
          </p>
          <p>
            Jadi kamu melakukan apa yang semua orang lakukan. Pesan yang aman.
            Atau ikut pesanan temanmu. Dan kadang makanannya datang dan kamu
            langsung tahu: seharusnya kamu pesan yang dia pesan.
          </p>
          <p className="text-[19px] font-medium text-brand-ink sm:text-xl">
            Makan mulai di sini.{" "}
            <Emphasis variant="warm">Di&nbsp;meja</Emphasis>, dengan menu yang
            terbuka.
          </p>
        </div>

        <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
          <p>
            Makan melihat apa yang pernah kamu makan. Bukan apa yang kamu tulis
            soal makanan itu. Tapi apa yang benar-benar kamu pilih, kamu makan,
            dan kamu habiskan.
          </p>
          <p>
            Lalu Makan melihat menu ini dan mencari yang paling dekat dengan apa
            yang sudah kamu suka. Dan Makan bilang alasannya. Kamu pilih yang
            dibakar daripada yang digoreng, empat dari lima kali. Kamu boleh
            tidak setuju. Memang harus bisa.
          </p>
        </div>

        <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
          <p>
            Semua itu datang dari satu hal kecil. Setiap kali kamu makan
            sesuatu, kamu simpan. Satu foto. Kamu di mana. Sudah, itu saja.
          </p>
          <p>
            Nanti, Makan menunjukkan dua makananmu sendiri dan bertanya satu
            hal:{" "}
            <Emphasis variant="warm">
              mana yang akan kamu pesan lagi lebih dulu?
            </Emphasis>
          </p>
          <p>
            Tidak ada bintang. Tidak ada nilai. Cuma pilih satu. Lakukan
            beberapa kali, dan Makan tahu sesuatu yang tidak akan pernah
            diketahui situs review mana pun. Bukan apa yang disukai orang
            banyak. Tapi apa yang kamu pesan lagi.
          </p>
        </div>

        <div className="mt-16 rounded-2xl border border-brand-line bg-white/40 p-6 sm:p-8">
          <p className="text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[26px]">
            Kadang Makan memang tidak tahu.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            Mungkin belum ada yang makan di sini. Mungkin tidak ada yang kamu
            simpan yang mirip dengan menu ini. Kalau itu terjadi, Makan akan{" "}
            <Emphasis variant="warm">mengatakannya</Emphasis>, dan menyebut yang
            mana dari keduanya. Lalu kamu bisa tanya mas-nya, atau pesan apa pun
            yang kamu mau.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            Makan tidak akan pura-pura tahu. Tebakan yang dikemas jadi jawaban
            itu lebih buruk daripada tidak ada jawaban, karena kamu baru sadar
            waktu makanannya sudah ada di depanmu.
          </p>
        </div>

        <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
          <p>Lalu makanannya datang, dan kamu makan.</p>
          <p>
            Itu bagian yang paling enak, dan bukan cuma karena kamu lapar. Kamu
            baru saja belajar sesuatu. Simpan, dan minggu depan Makan bisa
            membandingkannya dengan yang lain dan bertanya mana yang akan kamu
            pesan lagi. Makan malam hari ini adalah{" "}
            <Emphasis variant="warm">jawaban&nbsp;besok</Emphasis>.
          </p>
        </div>

        <div className="mt-16">
          <p className="text-[15px] text-brand-ink/70">
            Empat hal yang tidak akan pernah kami lakukan ke kamu.
          </p>

          <div className="mt-8 space-y-7 border-l-2 border-brand-orange pl-5 sm:pl-7">
            <div>
              <p className="font-semibold text-brand-ink">
                Tidak ada makanan yang akan diberi nilai dari lima.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Angka 4,6 itu seribu orang asing dengan seribu selera berbeda,
                dipadatkan jadi satu angka yang tidak pas untuk siapa pun.
                Satu-satunya urutan di Makan adalah urutanmu. Makanan nomor tiga
                sepanjang hidupmu bisa jadi masakan ibumu waktu kamu sembilan
                tahun. Tidak ada rata-rata yang bisa menemukan itu.
              </p>
            </div>

            <div>
              <p className="font-semibold text-brand-ink">
                Kami selalu bilang sebuah jawaban datang dari mana.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Dari kamu, dari temanmu, atau dari restorannya sendiri.
                Disebutkan, setiap kali. Tidak pernah dilebur jadi satu kata
                &ldquo;direkomendasikan&rdquo;.
              </p>
            </div>

            <div>
              <p className="font-semibold text-brand-ink">
                Tidak ada restoran yang bisa bayar untuk mengubah pesananmu.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Sepeser pun tidak, selamanya. Begitu sebuah dapur bisa membeli
                tempatnya di makan malammu, tidak ada lagi yang pantas dibaca di
                halaman ini.
              </p>
            </div>

            <div>
              <p className="font-semibold text-brand-ink">
                Kamu bisa menghapus semuanya, kapan saja.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Hapus satu makanan, dan itu berhenti dihitung. Hapus semuanya,
                dan Makan melupakan apa yang sudah disimpulkannya tentang kamu.
                Catatan yang tidak bisa kamu tarik kembali itu bukan benar-benar
                milikmu.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <p className="mt-6 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[32px]">
            AI belum pernah <Emphasis variant="warm">mencicipi</Emphasis>{" "}
            makanan.
          </p>

          <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            AI tidak bisa mencium. Tidak bisa mengunyah. Tidak ingat rasanya
            lapar waktu kecil. Jadi AI tidak akan pernah bilang sebuah makanan
            itu enak, tidak akan menuliskan ingatanmu, tidak akan mengarang
            pendapat yang bukan milikmu. Mencicipi itu bagian manusianya, dan
            itu tetap milikmu.
          </p>
          <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            Ada satu pekerjaan kecil yang sedang kami bangun, dan hanya kalau
            kamu menyalakannya. AI bisa mengenali kalau dua fotomu sendiri itu
            makanan yang sama. Lalu Makan bisa bilang: kamu pernah makan ini,
            dan ini pendapatmu waktu itu. Mengenali, bukan menilai. Fotomu
            sendiri, bukan foto orang lain. Matikan, dan Makan lupa.
          </p>
        </div>

        <div className="mt-16 border-t border-brand-line pt-12">
          <p className="text-[15px] text-brand-ink/70">
            Semua ini bukan hasil rapat.
          </p>

          <div className="mt-6 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              Ini mulai waktu COVID. Aku tidak bisa bertemu teman-teman, jadi
              beberapa dari kami membuat shared story di Snapchat dan memposting
              makan malam kami. Sarapan. Nasi bungkus di jalan pulang. Tiga
              ratus orang ikut tanpa kami minta.
            </p>
            <p>
              Enam tahun. Ribuan makanan. Dan ini yang kami pelajari dari situ.
            </p>
            <p>
              Semuanya tersimpan. Kami bisa scroll ke belakang dan melihat tepat
              apa yang masing-masing dari kami pesan lagi. Tapi setiap kali
              salah satu dari kami duduk di tempat baru, tidak ada satu pun yang
              menolong. Kami menatap menu dan tetap pesan yang aman.
            </p>
            <p>
              Menyimpan makanannya bukan tujuannya. Makanan itu tersimpan{" "}
              <Emphasis variant="warm">untuk&nbsp;ini</Emphasis>.
            </p>
            <p>
              Jadi kalau kamu sudah pakai Makan untuk mengingat makananmu, tidak
              ada yang diambil. Makananmu tetap milikmu, tetap pribadi kecuali
              kamu membagikannya. Sekarang cuma ada gunanya.
            </p>
          </div>
        </div>

        <p className="mt-14 text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[28px]">
          Kamu selesai. Kamu bayar. Kamu pulang. Dan lain kali kamu duduk di
          tempat baru dan ada yang menyerahkan menu ke kamu,{" "}
          <span className="text-brand-orange">
            kamu tidak akan{" "}
            <Emphasis variant="warm">mulai&nbsp;dari&nbsp;nol</Emphasis>.
          </span>
        </p>

        <p className="mt-10 text-[16px] italic leading-relaxed text-brand-ink/70">
          Kalau kamu pernah membaca satu menu dua kali dan akhirnya tetap pesan
          yang aman, ini buat kamu.
        </p>

        <div className="mt-16 flex items-center justify-between border-t border-white/15 pt-8">
          <p className="text-[15px] text-brand-ink/70">— Devon</p>
          <Link
            href="/id"
            className="text-[13px] text-brand-ink/60 underline-offset-4 transition-colors hover:text-brand-orange hover:underline"
          >
            Kembali ke Makan →
          </Link>
        </div>
      </article>
    </main>
  )
}
