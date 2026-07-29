import Link from "next/link"
import { Emphasis } from "@/components/Emphasis"

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
          Semuanya bermula karena kami tidak bisa{" "}
          <Emphasis variant="warm" trigger="load">
            makan&nbsp;bersama
          </Emphasis>
          .
        </h1>

        <div className="mt-14 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
          <p>
            Makan bermula saat COVID. Aku tidak bisa bertemu teman-teman, jadi
            beberapa dari kami membuat shared story di Snapchat untuk tetap
            terhubung. Kami memposting foto makan malam, sarapan, nasi bungkus, apa
            pun yang sedang dimakan. Tanpa direncanakan, anggotanya tumbuh
            menjadi lebih dari 300 orang. Saat kamu tidak bisa berbagi meja,
            foto makanan itu menjadi{" "}
            <Emphasis variant="warm">mejanya</Emphasis>.
          </p>
          <p>
            Itu enam tahun lalu. Sejak saat itu kami sudah saling mengirim
            ribuan makanan. Pada satu titik, semuanya berhenti terasa seperti
            story dan mulai terasa seperti catatan hidup. Jadi kami membuat
            aplikasi untuknya.
          </p>
          <p>
            Kebanyakan aplikasi makanan sibuk membantu memilih tempat berikutnya.
            Restoran diberi peringkat dan nilai. Pendapat seribu orang asing
            diringkas menjadi satu angka dari lima. Setahun berlalu, kamu punya
            daftar tempat yang pernah dikunjungi, tetapi sama sekali tidak bisa{" "}
            <Emphasis variant="underline">
              mengingat apa yang kamu makan
            </Emphasis>{" "}
            di sana.
          </p>
        </div>

        <p className="mt-14 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[34px]">
          Makan adalah kebalikannya. Ini catatan tentang apa yang kamu makan.
        </p>

        <div className="mt-10 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
          <p>
            Makananmu bukan sekadar konten. Pilih Public atau Friends Only saat
            memposting. Ini jurnal makanan yang mengingat apa yang biasanya akan{" "}
            <Emphasis variant="warm">terlupakan</Emphasis>.
          </p>
          <p>
            Makanan yang masih kamu ingat lima tahun lagi mungkin bukan tempat
            yang sedang ramai minggu ini. Mungkin makan malam buatanmu sendiri
            jam sebelas hari Selasa lalu. Mungkin restoran kecil yang tidak
            dikenal orang lain. Makanan yang{" "}
            <Emphasis variant="warm">berarti</Emphasis> mengalahkan makanan yang{" "}
            <Emphasis variant="cool">tren</Emphasis>. Makan dibuat untuk itu.
          </p>
        </div>

        <div className="mt-16">
          <p className="text-[15px] text-brand-ink/70">
            Ada beberapa hal yang tidak akan kami lakukan, karena itu akan
            menghilangkan inti dari Makan.
          </p>

          <div className="mt-8 space-y-7 border-l-2 border-brand-orange pl-5 sm:pl-7">
            <div>
              <p className="font-semibold text-brand-ink">
                Satu makanan bukan 4,2 dari 5.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Tidak ada bintang atau rata-rata yang menentukan mana yang
                enak. Satu-satunya peringkat di Makan adalah milikmu sendiri:
                makananmu dibandingkan satu sama lain sampai urutannya terasa
                benar. Nomor tiga sepanjang masamu mungkin masakan yang dibuat
                ibumu saat kamu kecil. Itu lebih berarti daripada nilai 4,6
                dari orang-orang yang tidak ada di sana.
              </p>
            </div>
            <div>
              <p className="font-semibold text-brand-ink">
                Feed-mu tidak diurutkan berdasarkan popularitas.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Temanmu muncul sesuai urutan mereka memposting. Ada feed Public
                jika kamu ingin melihat lebih jauh, dan urutannya tetap sama.
                Tidak ada yang memotong antrean karena punya lebih banyak like.
              </p>
            </div>
            <div>
              <p className="font-semibold text-brand-ink">
                Restoran tidak bisa membayar untuk masuk ke feed-mu.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Kalau kamu melihat sebuah tempat di Makan, itu karena seseorang
                makan di sana dan ingin mengingatnya.
              </p>
            </div>
            <div>
              <p className="font-semibold text-brand-ink">
                Catatanmu tetap milikmu.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Kami menyimpannya untukmu. Kamu bisa menghapusnya kapan saja.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <p className="text-[15px] text-brand-ink/70">
            Dan satu hal lagi, yang terasa makin penting setiap tahun.
          </p>
          <p className="mt-6 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[32px]">
            AI belum pernah <Emphasis variant="warm">mencicipi</Emphasis>{" "}
            makanan.
          </p>
          <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            AI tidak bisa mencium aroma, mengunyah, atau mengingat rasanya lapar
            saat kecil. Jadi AI tidak akan menulis makananmu, membuat resepmu,
            atau menebak isi piring dari foto. Alasan sebuah makanan pantas
            diingat adalah karena kamu yang mencicipinya. AI tidak pernah.
          </p>
        </div>

        <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
          <p>
            Makan membantumu mengingat bagaimana kamu menjalani hidup lewat
            makanan. Makan malam hari Selasa. Makan siang di warung tepi pantai
            yang berlangsung empat jam. Nasi goreng abang-abang jam dua pagi.
            Pertama kali seseorang benar-benar memasak untukmu. Sarapan sendirian
            keesokan paginya. Makanan pertama di tempat tinggal baru. Semuanya
            tersimpan bersama cerita di sekitarnya: apa yang kamu makan dan siapa yang{" "}
            <Emphasis variant="warm">bersamamu</Emphasis>.
          </p>
        </div>

        <p className="mt-14 text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[28px]">
          Kamu ingat siapa yang ada di meja. Kamu tidak pernah ingat apa yang
          sebenarnya dimakan.{" "}
          <span className="text-brand-orange">
            Itulah ruang yang diisi Makan.
          </span>
        </p>

        <p className="mt-10 text-[16px] italic leading-relaxed text-brand-ink/70">
          Kalau kamu pernah mencoba mengingat satu makanan dan tidak berhasil,
          kamu akan mengerti.
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
