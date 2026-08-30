import Link from "next/link"
import { Emphasis } from "@/components/Emphasis"

// Indonesian manifesto. Not a translation — the same argument told in
// Indonesian, with local substitutions (nasi bungkus, warung, tanya mas-nya)
// where the English has its own references.
//
// Register decisions, deliberate: "kamu" throughout, never "Anda" (Anda reads
// like a bank or a government form and kills the warmth). "kami" wherever the
// team speaks — exclusive we, because the reader did not build this. "kita"
// appears exactly ONCE, on the shared human problem, where including the reader
// is the whole point. Category loanwords (menu, review, feed) stay English
// because translating them reads stiff; abstract marketing English does not
// appear at all.
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
          Kamu pegang menunya dan{" "}
          <Emphasis variant="warm" trigger="load">
            bingung&nbsp;mau&nbsp;makan&nbsp;apa
          </Emphasis>
          .
        </h1>

        <div className="mt-12 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
          <p className="text-[19px] font-medium text-brand-ink sm:text-xl">
            Makan adalah aplikasi yang kamu buka saat itu. Cuma itu idenya.
            Semua hal lain yang dilakukan Makan hanya untuk sembilan puluh detik
            antara kamu duduk dan kamu bilang mau pesan apa.
          </p>
          <p>
            Semua aplikasi makanan jago di satu hal: bantu kamu pilih tempat.
            Bintang bisa melakukan itu. Empat setengah, dua ribu review, kamu
            langsung gas ke sana. Lalu kamu duduk, menunya datang, dan tidak ada
            satu pun yang menolong. Tidak ada yang menilai rendangnya dibanding
            ayam bakarnya. Tidak ada yang tahu kamu kurang suka daun ketumbar.
            Aplikasinya berhasil membawa kamu sampai pintu, lalu berhenti di
            meja — padahal di meja itulah keputusannya benar-benar terjadi.
          </p>
          <p>
            Jadi kamu melakukan apa yang semua orang lakukan. Pesan{" "}
            <span className="italic">yang aman aja</span>. Atau ikut pesanan
            orang yang duduk paling cepat. Dan kadang makanannya datang, satu
            suap, dan kamu langsung tahu kamu salah pilih — dan kesempatan makan
            itu sudah habis. <span className="italic">Kita</span> semua pernah
            di posisi itu.
          </p>
          <p className="text-[19px] font-medium text-brand-ink sm:text-xl">
            Makan mulai di titik{" "}
            <Emphasis variant="warm">mereka&nbsp;berhenti</Emphasis>.
          </p>
        </div>

        <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
          <p>
            Cara kerjanya dari apa yang sudah pernah kamu makan. Setiap makanan
            yang kamu simpan menambah satu hal nyata yang Makan tahu tentang
            kamu — bukan pendapat yang kamu tulis, tapi makanan yang benar-benar
            kamu pilih hari Selasa itu dan kamu habiskan.
          </p>
          <p>
            Lalu Makan menanyakan satu hal yang jawabannya selalu jujur. Dua
            makananmu sendiri, berdampingan:{" "}
            <Emphasis variant="warm">
              mana yang akan kamu pesan lagi lebih dulu?
            </Emphasis>{" "}
            Bukan nilai dari lima. Sebuah pilihan — bentuknya sama persis dengan
            pilihan yang nanti kamu buat di meja. Jawab beberapa puluh kali, dan
            Makan tahu sesuatu yang tidak bisa diketahui situs review mana pun:
            bukan apa yang disukai orang banyak, tapi apa yang kamu sendiri
            pesan lagi.
          </p>
          <p>
            Seringnya kamu ada di tempat yang{" "}
            <Emphasis variant="warm">
              belum&nbsp;pernah&nbsp;kamu&nbsp;datangi
            </Emphasis>
            , dan justru itu yang Makan dirancang untuk mengatasi — bukan kasus
            pinggiran yang sekadar ditoleransi. Makan melihat apa yang pernah
            kamu pilih, mencari yang paling dekat di menu ini, lalu memberi tahu
            yang mana dan kenapa: karena kamu pilih yang dibakar daripada yang
            digoreng, empat dari lima kali. Kamu boleh tidak setuju dengan
            alasannya — itu justru gunanya alasan itu ditampilkan.
          </p>
        </div>

        <div className="mt-16 rounded-2xl border border-brand-line bg-white/40 p-6 sm:p-8">
          <p className="text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[26px]">
            Dan kadang Makan memang tidak tahu.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            Belum cukup orang yang makan di sini, atau tidak ada yang kamu
            simpan yang cukup dekat dengan menu di depanmu. Kalau itu terjadi,
            Makan akan <Emphasis variant="warm">mengatakannya</Emphasis>, dan
            menyebut yang mana dari keduanya — supaya kamu tahu harus tanya
            mas-nya atau tinggal pesan apa pun yang kamu mau. Makan tidak akan
            mengemas tebakan sebagai jawaban. Rekomendasi yang tidak bisa
            dipercaya lebih buruk daripada tidak ada rekomendasi, karena kamu
            baru tahu setelah makanannya sampai di meja.
          </p>
        </div>

        <div className="mt-16">
          <p className="text-[15px] text-brand-ink/70">
            Empat hal yang tidak akan kami lakukan, karena masing-masing
            diam-diam akan merusak janji di atas.
          </p>

          <div className="mt-8 space-y-7 border-l-2 border-brand-orange pl-5 sm:pl-7">
            <div>
              <p className="font-semibold text-brand-ink">
                Tidak ada makanan yang akan diberi nilai dari lima.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Angka 4,6 adalah seribu orang asing dengan seribu selera
                berbeda, diratakan jadi satu angka yang tidak mewakili siapa
                pun. Satu-satunya peringkat di Makan adalah milikmu: makananmu
                dibandingkan satu sama lain sampai urutannya benar-benar kamu
                percaya. Makanan nomor tiga sepanjang hidupmu bisa jadi masakan
                ibumu waktu kamu sembilan tahun. Tidak ada rata-rata yang bisa
                menemukan itu.
              </p>
            </div>

            <div>
              <p className="font-semibold text-brand-ink">
                Kami selalu menyebut sebuah saran datang dari mana.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Pilihanmu sendiri, pilihan temanmu, atau keterangan dari
                restorannya — diberi label, tidak pernah dilebur jadi satu kata
                &ldquo;direkomendasikan&rdquo;. Kalau kami tidak bisa
                menunjukkan dasarnya, berarti saran itu belum layak diberikan —
                dan kami lebih memilih menunjukkan alasan yang tipis daripada
                menyembunyikannya.
              </p>
            </div>

            <div>
              <p className="font-semibold text-brand-ink">
                Tidak ada restoran yang bisa membayar untuk masuk ke pesananmu.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Tidak ke sarannya, tidak ke feed-mu, tidak jadi
                &ldquo;pilihan&nbsp;utama&rdquo;. Begitu sebuah dapur bisa
                membayar untuk mengubah apa yang kami sarankan kamu makan, tidak
                ada lagi yang pantas dibaca di halaman ini.
              </p>
            </div>

            <div>
              <p className="font-semibold text-brand-ink">
                Kalau kamu berubah pikiran, sarannya ikut berubah.
              </p>
              <p className="mt-2 text-[17px] leading-relaxed text-brand-ink/80">
                Setiap makanan yang kamu simpan adalah milikmu. Hapus satu, dan
                itu berhenti dihitung dalam saran kami. Hapus semuanya, dan
                Makan melupakan apa yang sudah disimpulkannya tentang kamu —
                karena catatan yang tidak bisa kamu tarik kembali sebenarnya
                bukan milikmu.
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
            AI tidak bisa mencium aroma, mengunyah, atau mengingat rasanya lapar
            waktu kecil. Jadi kami menarik garisnya di tempat yang jujur: AI
            tidak akan pernah bilang sebuah makanan itu enak, tidak akan
            menuliskan ingatanmu, tidak akan mengarang pendapat yang bukan
            milikmu. Rasa adalah satu hal di sini yang memang harus manusia —
            dan itu milikmu.
          </p>
          <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            Ada satu hal sempit yang sedang kami bangun, dan hanya kalau kamu
            menyalakannya: mengenali bahwa dua fotomu sendiri adalah makanan yang
            sama, supaya Makan bisa bilang kamu pernah memakannya dan apa
            pendapatmu waktu itu. Mengenali, bukan menilai. Fotomu sendiri, bukan
            foto orang lain. Matikan, dan semua yang sudah disimpulkannya ikut
            hilang.
          </p>
        </div>

        <div className="mt-16 border-t border-brand-line pt-12">
          <p className="text-[15px] text-brand-ink/70">
            Semua ini bukan hasil rapat strategi.
          </p>

          <div className="mt-6 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              Makan bermula saat COVID. Aku tidak bisa bertemu teman-teman, jadi
              beberapa dari kami membuka satu shared story di Snapchat dan
              memposting apa yang sedang kami makan — makan malam, sarapan, nasi
              bungkus di jalan pulang. Tanpa direncanakan, anggotanya lewat dari
              300 orang. Saat kamu tidak bisa berbagi meja, foto makanan itu
              menjadi mejanya.
            </p>
            <p>
              Itu <Emphasis variant="warm">enam&nbsp;tahun</Emphasis> dan ribuan
              makanan yang lalu, dan dari situ kami belajar hal yang menjadi
              dasar seluruh aplikasi ini. Catatannya ada. Kami bisa scroll ke
              belakang dan melihat tepat apa yang masing-masing dari kami pesan
              lagi. Tapi setiap kali salah satu dari kami duduk di restoran yang
              belum pernah didatangi, semua catatan itu cuma diam di sana, tidak
              terpakai, sementara kami menatap menu dan tetap pesan yang aman.
            </p>
            <p>
              Catatannya sendiri bukan tujuannya. Catatan itu bahan mentah untuk
              sebuah keputusan yang tidak ada yang membantu kami buat.
            </p>
            <p>
              Jadi kalau kamu sudah pakai Makan untuk mengingat makanan: tidak
              ada yang diambil. Catatanmu tetap milikmu, tetap pribadi kecuali
              kamu membagikannya, tetap foto dan caption yang sama. Catatan itu
              baru saja diberi pekerjaan yang selama ini memang jadi buktinya.
            </p>
          </div>
        </div>

        <p className="mt-14 text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[28px]">
          Mungkin kamu masih punya dua puluh ribu kali makan lagi seumur hidup.{" "}
          <span className="text-brand-orange">
            Pesan sesuatu yang akan kamu{" "}
            <Emphasis variant="warm">ingat</Emphasis>.
          </span>
        </p>

        <p className="mt-10 text-[16px] italic leading-relaxed text-brand-ink/70">
          Kalau kamu pernah membaca satu menu dua kali dan akhirnya tetap pesan
          yang aman, kamu sudah tahu ini untuk apa.
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
