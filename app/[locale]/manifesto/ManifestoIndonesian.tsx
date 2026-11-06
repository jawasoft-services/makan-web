import PlayfulArrow from '@/components/PlayfulArrow'
import Image from 'next/image'
import EditorialCta from '@/components/story/EditorialCta'
import styles from '@/components/story/editorial.module.css'
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
    <main id="main-content" className={styles.page}>
        <header className={styles.manifestoHero}>
          <p className={styles.kicker}>Manifesto</p>
          <h1>
          Kamu duduk. Menunya datang. Kamu{" "}
          <Emphasis variant="warm" trigger="load">
            bingung&nbsp;mau&nbsp;makan&nbsp;apa
          </Emphasis>
          .
        </h1>
          <Image className={styles.manifestoArt} src="/redesign/food-fork.svg" alt="" width={100} height={160} aria-hidden />
        </header>
        <article className={`${styles.prose} ${styles.manifestoProse}`}>


        <div>
          <p>
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
          <p>
            Makan mulai di sini.{" "}
            <Emphasis variant="warm">Di&nbsp;meja</Emphasis>, dengan menu yang
            terbuka.
          </p>
        </div>

        <div>
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

        <div>
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

        <div>
          <p className={styles.pullout}>
            Kadang Makan memang tidak tahu.
          </p>
          <p>
            Mungkin belum ada yang makan di sini. Mungkin tidak ada yang kamu
            simpan yang mirip dengan menu ini. Kalau itu terjadi, Makan akan{" "}
            <Emphasis variant="warm">mengatakannya</Emphasis>, dan menyebut yang
            mana dari keduanya. Lalu kamu bisa tanya mas-nya, atau pesan apa pun
            yang kamu mau.
          </p>
          <p>
            Makan tidak akan pura-pura tahu. Tebakan yang dikemas jadi jawaban
            itu lebih buruk daripada tidak ada jawaban, karena kamu baru sadar
            waktu makanannya sudah ada di depanmu.
          </p>
        </div>

        <div>
          <p>Lalu makanannya datang, dan kamu makan.</p>
          <p>
            Itu bagian yang paling enak, dan bukan cuma karena kamu lapar. Kamu
            baru saja belajar sesuatu. Simpan, dan lain kali Makan bisa
            membandingkannya dengan yang lain dan bertanya mana yang akan kamu
            pesan lagi.
          </p>
        </div>

        <div>
          <p className={styles.pullout}>
            AI belum pernah <Emphasis variant="warm">mencicipi</Emphasis>{" "}
            makanan.
          </p>

          <p>
            AI tidak bisa mencium. Tidak bisa mengunyah. Tidak ingat rasanya
            lapar waktu kecil. Jadi AI tidak akan pernah bilang sebuah makanan
            itu enak, tidak akan menuliskan ingatanmu, tidak akan mengarang
            pendapat yang bukan milikmu. Mencicipi itu bagian manusianya, dan
            itu tetap milikmu.
          </p>
          <p>
            Yang AI lakukan adalah mengenali. AI bisa melihat kalau dua fotomu
            sendiri itu makanan yang sama, jadi Makan bisa bilang: kamu pernah
            makan ini, dan ini pendapatmu waktu itu. Fotomu sendiri, bukan foto
            orang lain. Mengenali, bukan menilai.
          </p>
        </div>

        <div>
          <p>
            Semua ini bukan hasil rapat.
          </p>

          <div>
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

        <p>
          Kamu selesai. Kamu bayar. Kamu pulang. Dan lain kali kamu duduk di
          tempat baru dan ada yang menyerahkan menu ke kamu,{" "}
          <span>
            kamu tidak akan{" "}
            <Emphasis variant="warm">mulai&nbsp;dari&nbsp;nol</Emphasis>.
          </span>
        </p>

        <p>
          Kalau kamu pernah membaca satu menu dua kali dan akhirnya tetap pesan
          yang aman, ini buat kamu.
        </p>

        <div className={styles.manifestoSignature}>
          <p>— Devon</p>
          <Link
            href="/id"
          >
            Kembali ke Makan <PlayfulArrow direction="right" />
          </Link>
        </div>

        </article>
        <EditorialCta locale="id" />
      </main>
  )
}
