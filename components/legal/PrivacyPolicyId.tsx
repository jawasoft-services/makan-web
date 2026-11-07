// RM20320 — Bahasa Indonesia version of app/[locale]/privacy-policy/page.tsx (N8, Devon, 4 Nov 2026: translate
// the whole policy and publish both languages together). The English page is the reference text: change them
// together. PUBLISH ONLY after counsel's check of the wording, and together with the English page (the native read was
// accepted by Devon without one, 4 Nov 2026). Recheck the "Terakhir diperbarui" date at publication.
// Visibilitas web Maître d’: aturan produk 6 Nov; beri tahu pengguna lama dan tinjau dasar hukumnya sebelum publikasi.
import PlayfulArrow from '@/components/PlayfulArrow'
import styles from '@/components/utility.module.css'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import MaitredPrivacyDisclosure from '@/components/legal/MaitredPrivacyDisclosure'

const strong = 'font-semibold text-brand-ink'

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h2 id={`legal-section-${title.split(".")[0]}`}>{title}</h2>
    <div className="mt-4 space-y-3">{children}</div>
  </section>
)
const Sub = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h3 className="font-medium text-brand-ink">{title}</h3>
    <div className="mt-2 space-y-2">{children}</div>
  </div>
)
const Bullets = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-5 space-y-1">{children}</ul>
)
const Mail = () => (
  <a href="mailto:support@makanofficial.com" className="text-brand-orange font-semibold">
    support@makanofficial.com
  </a>
)

const sections = [
  "1. Siapa Kami",
  "2. Data Pribadi yang Kami Kumpulkan",
  "3. Bagaimana Kami Memakai Data Pribadi",
  "4. Dasar Hukum Pemrosesan",
  "5. Kontrol Berbagi dan Visibilitas",
  "6. Penyedia Layanan dan Penerima Lain",
  "7. Cookie dan Teknologi Serupa",
  "8. Transfer Data Internasional",
  "9. Keamanan",
  "10. Penyimpanan Data",
  "11. Hakmu",
  "12. Anak-Anak",
  "13. Pengambilan Keputusan Otomatis dan Pemrofilan",
  "14. Perubahan pada Kebijakan Ini"
]

export default function PrivacyPolicyId() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <main id="main-content" className={styles.legalPage}>
        <header className={styles.legalHeading}>
        <p>Hukum</p>
        <h1>Kebijakan Privasi</h1>
        <p>Terakhir diperbarui: 6 November 2026</p>

        </header>
        <div className={styles.legalLayout}>
          <aside className={styles.contents}><details><summary>Di halaman ini</summary><nav aria-label="Di halaman ini">{sections.map((title, index) => <a key={title} href={`#legal-section-${index + 1}`}>{title}</a>)}</nav></details></aside>
          <article className={styles.legalProse} data-policy-copy>

          <p>
            MAKAN APP LTD (&ldquo;kami&rdquo;) mengoperasikan aplikasi seluler Makan (&ldquo;Aplikasi&rdquo;)
            dan situs web di makanofficial.com (&ldquo;Situs&rdquo;), yang bersama-sama kami sebut
            &ldquo;Layanan&rdquo;.
          </p>
          <p>
            <strong className={strong}>Makan dibuat untuk menentukan makan apa.</strong>{' '}
            Kamu memakainya saat melihat menu dan belum tahu mau pesan apa. Hampir semua yang dilakukan
            Aplikasi dengan informasimu bertujuan menjawab satu pertanyaan itu: Aplikasi mengingat
            makanan yang pernah kamu santap, mempelajari mana yang akan kamu pilih lagi, lalu memakainya
            untuk memberi tahu apa yang mungkin kamu sukai. Kebijakan ini menjelaskan apa yang kami
            kumpulkan dan apa yang kami lakukan dengannya, dan bila sesuatu yang kami simpan ada untuk
            membantumu memutuskan, kami menyebutkannya.
          </p>
          <p>
            Kami mematuhi UK General Data Protection Regulation (UK GDPR) dan Data Protection Act 2018.
          </p>

          <Section title="1. Siapa Kami">
            <div>
              <p>Pengendali data: MAKAN APP LTD</p>
              <p>Alamat terdaftar: 86–90 Paul Street, London, EC2A 4NE, Britania Raya</p>
              <p>Email kontak: <Mail /></p>
              <p>
                MAKAN APP LTD bertanggung jawab menentukan bagaimana dan mengapa data pribadi diproses
                menurut Kebijakan Privasi ini. Kami belum menunjuk Petugas Pelindungan Data karena tidak
                diwajibkan; pertanyaan tentang pelindungan data dapat dikirim ke email kontak di atas.
              </p>
            </div>
          </Section>

          <Section title="2. Data Pribadi yang Kami Kumpulkan">
            <div>
              <Sub title="2.1 Data akun (Aplikasi)">
                <Bullets>
                  <li>Nama atau nama tampilan (jika kamu isi)</li>
                  <li>Alamat email</li>
                  <li>Nama pengguna dan pengenal pengguna yang unik</li>
                  <li>Status akun</li>
                  <li>Waktu pembuatan akun dan aktivitas</li>
                </Bullets>
              </Sub>
              <Sub title="2.2 Konten makanan dan data sosial (Aplikasi)">
                <p>Tergantung cara kamu memakai Aplikasi, kami memproses:</p>
                <Bullets>
                  <li>Foto makanan yang kamu unggah</li>
                  <li>Keterangan atau catatan pada makanan</li>
                  <li>Penanda restoran atau lokasi pada makanan</li>
                  <li>Audiens yang kamu pilih untuk setiap makanan — hanya teman atau publik (lihat bagian 5)</li>
                  <li>Hubungan pertemanan dan permintaan pertemanan (Makan memakai pertemanan timbal balik)</li>
                  <li>Suka, ngidam, dan komentar</li>
                  <li>Jawabanmu saat Aplikasi memintamu membandingkan dua makananmu sendiri dan memilih yang akan kamu pilih lagi</li>
                  <li>Urutan yang kamu susun untuk makananmu sendiri (&ldquo;Urutanmu&rdquo;), termasuk makanan yang kamu geser naik atau turun</li>
                </Bullets>
              </Sub>
              <Sub title="2.3 Data teknis, penggunaan, dan keamanan (Aplikasi dan Situs)">
                <Bullets>
                  <li>Informasi perangkat dan aplikasi yang diperlukan untuk menjalankan Layanan, seperti jenis perangkat, sistem operasi, dan versi aplikasi</li>
                  <li>Peristiwa penggunaan dan analitik, dikumpulkan untuk memahami dan meningkatkan Layanan. Peristiwa ini mencatat layar mana yang dibuka dan fitur mana yang dipakai. Bila suatu tindakan melibatkan orang lain — misalnya menyukai atau mengomentari makanan orang lain — peristiwa hanya mencatat jenis interaksinya, tidak pernah siapa orang itu</li>
                  <li>Diagnostik kerusakan dan kinerja, termasuk informasi aplikasi dan perangkat, konteks diagnostik, dan pengenal akunmu saat masuk, dipakai untuk menemukan dan memperbaiki gangguan</li>
                  <li>Perkiraan lokasi yang diturunkan dari alamat IP-mu, dipakai untuk analitik agregat</li>
                  <li>Log keamanan, pencegahan penyalahgunaan, dan diagnostik yang dipakai untuk melindungi pengguna dan Layanan</li>
                </Bullets>
              </Sub>
              <Sub title="2.4 Data lokasi (Aplikasi)">
                <p>
                  Dengan izinmu, Aplikasi mengakses lokasi perangkatmu untuk menampilkan tempat di
                  sekitar dan menghitung jarak ke restoran. Kamu dapat memberi atau mencabut izin ini
                  kapan saja di pengaturan perangkat. Jika kamu menolak, fitur penemuan berbasis lokasi
                  menjadi terbatas, tetapi bagian Aplikasi lainnya berjalan normal. Kami memakai
                  lokasimu untuk menyediakan fitur ini pada saat kamu menggunakannya dan tidak
                  menyusun riwayat perjalananmu.
                </p>
              </Sub>
              <Sub title="2.5 Data pertanyaan (Situs)">
                <p>
                  Jika kamu menghubungi kami lewat Situs, kami memproses nama dan alamat email yang kamu
                  kirim, serta waktu pengirimannya, agar kami dapat membalasmu.
                </p>
              </Sub>
              <Sub title="2.6 Apa yang wajib kamu berikan, dan apa yang tidak">
                <p>
                  Untuk membuat dan memakai akun Makan, kami membutuhkan alamat emailmu; tanpanya kami
                  tidak dapat menyediakan Aplikasi. Selebihnya adalah pilihanmu. Kamu tidak wajib
                  menambahkan nama tampilan, mengunggah makanan, menandai restoran, menambah keterangan,
                  menambah teman, atau mengizinkan akses lokasi. Jika kamu memilih tidak, fitur terkait
                  tidak tersedia tetapi bagian Aplikasi lainnya berjalan normal.
                </p>
                <p>
                  Kami tidak dengan sengaja mengumpulkan data pribadi kategori khusus. Namun, konten
                  buatan pengguna dapat mengungkap informasi sensitif. Hindari mengunggah data pribadi
                  yang tidak ingin kamu proses.
                </p>
              </Sub>
              <Sub title="2.7 Bagaimana kami mengetahui apa yang kamu suka">
                <p>
                  Inilah bagian Makan yang menjawab pertanyaan yang membawamu ke sini, jadi layak dibaca.
                </p>
                <p>
                  Saat Aplikasi menampilkan dua makananmu yang tersimpan dan bertanya mana yang akan kamu
                  pilih lagi, kami menyimpan jawabanmu. Kami juga menyimpan urutan yang kamu susun untuk
                  makananmu sendiri. Dari semua itu kami menyusun gambaran seleramu sendiri: urutan
                  makanan dan hidanganmu, gambaran restoran mana yang cocok untukmu, dan alasan tertulis
                  singkat untuk apa yang disarankan Makan. Gambaran inilah yang memungkinkan Makan
                  memberi tahu apa yang mungkin kamu sukai di restoran yang belum pernah kamu kunjungi.
                </p>
                <p>
                  Ini adalah data pribadi tentangmu, dan wajar disebut profil preferensimu, jadi kamu
                  perlu tahu persis apa itu dan apa yang bukan:
                </p>
                <Bullets>
                  <li>Disusun <strong className={strong}>hanya dari pilihan yang kamu buat dengan sengaja</strong> — perbandingan yang kamu jawab dan urutan yang kamu tetapkan. Kami tidak menyusunnya dengan memantau apa yang kamu lihat, ketuk, atau lama kamu tatap.</li>
                  <li><strong className={strong}>Disimpan secara privat pada akunmu.</strong> Kami tidak menampilkannya kepada pengguna lain. Ada dua hal yang dapat dilihat orang lain yang berasal darinya, dan hanya dua ini. Pertama, <strong className={strong}>kecocokan selera dengan temanmu</strong>: bila kamu dan teman yang berteman timbal balik sama-sama telah meranking hidangan yang sama, masing-masing melihat berapa hidangan yang sama-sama kalian ranking dan berapa di antaranya yang berada di separuh yang sama pada urutan kalian masing-masing — misalnya &ldquo;Kalian sepakat soal 4 dari 6 hidangan&rdquo;. Ini hanya menghitung makananmu yang publik dan yang hanya-teman, yang memang sudah bisa dilihat masing-masing, dan tidak pernah draf, makanan yang ditahan, dihapus, atau uji coba; minuman tidak ikut, karena yang dibandingkan adalah hidangan; ini tidak menampilkan urutan privatmu maupun hidangannya. Orang yang bukan lagi temanmu, atau yang kamu blokir atau laporkan, tidak melihat apa pun. Kedua, <strong className={strong}>peringkat publik</strong>: jawabanmu dihitung bersama jawaban semua orang untuk peringkat publik seperti persentase Eat sebuah restoran. Tidak ada jawaban individu yang ditampilkan atau dikaitkan denganmu.</li>
                  <li>Dipakai <strong className={strong}>hanya untuk membantumu memutuskan makan apa</strong> — saranmu, kecocokan selera dengan temanmu, dan peringkat gabungan itu. Tidak pernah untuk mengiklankan sesuatu kepadamu, tidak pernah untuk mengadu peringkatmu dengan orang lain, tidak pernah untuk membuat keputusan yang memengaruhimu di luar Aplikasi.</li>
                  <li>Kalah dalam perbandingan tidak berarti kamu tidak suka. Itu hanya mencatat dari dua makanan mana yang akan lebih dulu kamu pilih lagi.</li>
                  <li>Ini <strong className={strong}>bagian dari cara kerja Makan</strong>, jadi tidak ada pengaturan untuk mematikannya; untuk ini kami mengandalkan kontrak (bagian 4.1). Versi Aplikasi sebelumnya punya pengaturan &ldquo;Bagikan seleraku&rdquo;. Pengaturan itu telah dihapus, dan jika kamu pernah mematikannya, Aplikasi memberi tahumu satu kali. Jawaban yang kamu berikan saat pengaturan itu mati tidak pernah dihitung untuk peringkat publik, tetapi urutanmu tetap diperbarui, sehingga kecocokan selera dengan teman memakainya.</li>
                  <li>Kamu dapat meminta salinannya (bagian 11), dan ini <strong className={strong}>dihapus saat kamu menghapus akunmu.</strong></li>
                </Bullets>
              </Sub>
            </div>
          </Section>

          <Section title="3. Bagaimana Kami Memakai Data Pribadi">
            <p>Kami memakai data pribadi untuk:</p>
            <Bullets>
              <li><strong className={strong}>Membantumu memutuskan makan apa</strong> — dengan mengingat makanan yang telah kamu simpan, menyimpan perbandingan yang telah kamu jawab, dan menyusun gambaran seleramu seperti dijelaskan di bagian 2.7</li>
              <li>Menunjukkan kepadamu dan temanmu seberapa cocok selera kalian, seperti dijelaskan di bagian 2.7</li>
              <li>Membuat dan mengelola akun pengguna</li>
              <li>Menyediakan fungsi inti Aplikasi, termasuk menyimpan makanan dan menampilkan beranda sesuai audiens yang kamu pilih</li>
              <li>Menjalankan graf pertemanan, termasuk permintaan pertemanan dan pertemanan timbal balik</li>
              <li>Menampilkan pemegang gelar Maître d’ secara publik beserta pesanan andalan yang mereka pilih untuk diterbitkan, dengan pengaturan yang dijelaskan di bagian 5</li>
              <li>Menyinkronkan konten di semua perangkatmu</li>
              <li>Menampilkan tempat di sekitar dan menghitung jarak, memakai lokasi perangkatmu bila kamu telah memberi izin</li>
              <li>Menemukan dan memperbaiki gangguan, memakai laporan kerusakan dan data diagnostik</li>
              <li>Menjaga keamanan, mencegah penyalahgunaan, dan melindungi integritas Layanan</li>
              <li>Menanggapi pertanyaan dukungan</li>
              <li>Menampilkan konten yang kamu posting untuk audiens publik dalam pemasaran kami sendiri, bila diizinkan (lihat bagian 5)</li>
              <li>Memahami penggunaan dan meningkatkan keandalan, kinerja, dan desain Layanan</li>
            </Bullets>
            <p>Kami tidak menjual data pribadi, dan kami tidak memakai data pribadi untuk iklan pihak ketiga.</p>
            <p>
              <strong className={strong}>Pengenalan hidangan — fitur yang sedang kami bangun.</strong>{' '}
              Versi tersulit dari pertanyaan yang menjadi alasan Makan ada adalah menu di restoran yang
              belum pernah kamu kunjungi. Untuk membantu di sana, kami sedang membangun fitur yang
              mengenali kapan dua makananmu adalah hidangan yang sama — agar Aplikasi dapat memberi tahu
              bahwa kamu pernah menyantapnya, dan menunjuk hidangan di tempat baru yang mirip dengan
              yang pernah kamu pilih untuk dipesan lagi.
            </p>
            <p>
              <strong className={strong}>Fitur ini belum tersedia, dan saat ini tidak ada yang menganalisis fotomu.</strong>{' '}
              Kami akan menjelaskan fitur ini di Kebijakan ini, dan menyebut penyedia layanan yang
              terlibat, sebelum fitur dimulai. Foto yang kamu unggah sebelum fitur ini ada tidak akan
              pernah dianalisis kecuali kamu mengikutsertakannya secara terpisah — bila kamu tidak
              berbuat apa-apa, foto itu tidak pernah disentuh. Itu janji kami saat kamu menyimpannya,
              dan tidak berubah.
            </p>
            <p>
              <strong className={strong}>Saat tiba, fitur ini menjadi bagian dari cara kerja Aplikasi.</strong>{' '}
              Mengenali hidanganmu sendiri bukan tambahan di pinggir; itulah cara Makan menjawab
              pertanyaan yang membuatmu membukanya. Jadi kami tidak akan memintamu menyalakannya, dan
              tidak akan ada pengaturan untuk mematikannya. Untuk ini kami mengandalkan kepentingan
              yang sah, bukan persetujuanmu, dan kami menjelaskan pilihan itu di bagian 4.2.
            </p>
            <p>
              <strong className={strong}>Kamu tetap bisa meminta kami berhenti.</strong>{' '}
              Kamu berhak menolak pemrosesan yang kami dasarkan pada kepentingan yang sah. Jika kamu
              lebih suka kami tidak melakukannya pada fotomu, tulis kepada kami di
              support@makanofficial.com dan kami akan berhenti untuk akunmu. Panduanmu kemudian akan
              berasal dari bukti lain yang kami miliki, yang mungkin kurang berguna bagimu. Kami tidak
              akan terus memintamu mengubah pikiran.
            </p>
            <p>
              Saat kami memperkenalkannya: kami hanya akan membandingkan fotomu dengan fotomu sendiri.
              Kami hanya akan memakainya untuk mengenali dan membandingkan hidangan. Kami tidak akan
              memakainya untuk mengidentifikasi orang, wajah, atau tempat, untuk menyimpulkan kebiasaan
              makan, kesehatan, atau keyakinanmu, untuk iklan, atau untuk membuat keputusan tentangmu
              yang berdampak hukum atau signifikan serupa.
            </p>
          </Section>

          <Section title="4. Dasar Hukum Pemrosesan">
            <div>
              <p>
                Menurut UK GDPR, kami mengandalkan dasar hukum berikut. Singkatnya:{' '}
                <strong className={strong}>kontrak</strong> mencakup akunmu, fitur inti, serta gambaran
                seleramu dan kecocokan selera yang disusun darinya;{' '}
                <strong className={strong}>kepentingan yang sah</strong> mencakup pengenalan hidangan,
                pengukuran penggunaan, keamanan, perbaikan gangguan, peningkatan Layanan, dan menampilkan
                makanan yang kamu jadikan publik dalam pemasaran kami, serta kartu publik Maître d’
                yang dijelaskan di bagian 5; dan{' '}
                <strong className={strong}>persetujuan</strong> mencakup pertanyaan dan analisis apa pun
                atas foto yang kamu simpan sebelum pengenalan hidangan ada.
              </p>
              <Sub title="4.1 Kontrak">
                <p>
                  Pemrosesan diperlukan untuk menyediakan Aplikasi dan fitur intinya setelah kamu
                  membuat akun — pengelolaan akun, menyimpan dan menampilkan makanan sesuai audiens
                  pilihanmu, graf pertemanan, dan sinkronisasi di semua perangkatmu.
                </p>
                <p>
                  <strong className={strong}>Gambaran seleramu dan kecocokan selera (bagian 2.7).</strong>{' '}
                  Makan ada untuk membantumu memutuskan apa yang dipesan, dan gambaran ini adalah sarana
                  untuk itu. Saranmu, kecocokan selera dengan temanmu, dan peringkat gabungan adalah
                  layanan yang kamu minta dari kami, jadi kami memproses data di baliknya untuk
                  menyediakannya, dan tidak ada pengaturan terpisah untuk mematikannya. Kami
                  membatasinya pada yang dibutuhkan layanan: disusun hanya dari pilihan yang kamu buat
                  dengan sengaja, tidak pernah dipakai untuk mengiklankan sesuatu kepadamu atau menilaimu,
                  dan apa yang dapat dilihat orang lain darinya terbatas pada kecocokan selera dengan
                  teman dan peringkat gabungan yang dijelaskan di bagian 2.7.
                </p>
              </Sub>
              <Sub title="4.2 Kepentingan yang sah">
                <p>
                  <strong className={strong}>Pengenalan hidangan (bagian 3).</strong>{' '}
                  Kami mengandalkan kepentingan yang sah di sini dengan alasan yang sama. Makan adalah
                  aplikasi yang kamu buka saat tidak tahu mau pesan apa, dan mengetahui bahwa dua fotomu
                  adalah hidangan yang sama membuat jawaban menjadi mungkin — jadi fitur ini adalah
                  layanannya, bukan tambahan. Kami menganggap kepentingannya bersama: perbandingan hanya
                  terjadi antara fotomu sendiri, hasilnya adalah fakta tentang makanan, bukan penilaian
                  tentangmu, tidak ada yang dipakai untuk mengiklankan sesuatu kepadamu atau menilaimu,
                  dan tidak ada yang keluar dari Aplikasi. Setelah ditimbang terhadap hak dan harapan
                  wajarmu, kami menilai orang yang bertanya kepada aplikasi mau pesan apa mengharapkannya
                  mengenali makanan yang sudah ia tunjukkan. Dua batas menjaga keseimbangan ini tetap
                  jujur. Foto yang kamu simpan sebelum fitur ini ada tidak diikutkan kecuali kamu
                  mengikutsertakannya. Dan kamu dapat menolak kapan saja lewat kontak di atas, setelah
                  itu kami berhenti untuk akunmu.
                </p>
                <p>
                  <strong className={strong}>Kartu publik Maître d’ (bagian 5).</strong>{' '}
                  Kami mengandalkan kepentingan yang sah untuk membantu pengunjung menemukan pelanggan
                  tetap restoran dan rekomendasi yang mereka terbitkan. Kartu dibatasi pada nama,
                  foto profil opsional, gelar di restoran, dan catatan yang kamu terbitkan. Kamu dapat
                  berhenti ikut serta melalui pengaturan keikutsertaan Maître d’, atau menghubungi kami
                  untuk menyampaikan keberatan. Makanan tersimpan tetap mengikuti audiens pilihanmu.
                </p>
                <p>
                  <strong className={strong}>Menampilkan makanan publik dalam pemasaran kami (bagian 5).</strong>{' '}
                  Kami mengandalkan kepentingan yang sah untuk menampilkan makanan yang kamu setel ke
                  audiens publik, termasuk foto, keterangan, dan nama pengguna atau nama tampilanmu,
                  dalam materi promosi dan kanal kami sendiri, seperti Instagram dan TikTok. Kamu yang
                  memilih menjadikan makanan itu publik; kami hanya memakai konten publik, tidak pernah
                  yang hanya-teman; kami mencantumkan namamu; dan kami tidak menampilkan foto yang
                  memperlihatkan jelas orang lain, atau konten dari pengguna yang kami ketahui berusia di
                  bawah 18 tahun. Kamu dapat menolak, atau meminta kami menghapus sesuatu yang telah kami
                  tampilkan, kapan saja lewat kontak di atas, dan kami akan melakukannya.
                </p>
                <p>
                  <strong className={strong}>Mengoperasikan dan meningkatkan Layanan.</strong>{' '}
                  Kami juga mengandalkan kepentingan yang sah untuk operasi internal: mengukur
                  penggunaan Aplikasi, keamanan, pencegahan penyalahgunaan, diagnosis kerusakan dan
                  gangguan, serta peningkatan keandalan dan desain. Kami menimbangnya terhadap hak dan
                  harapanmu, kami tidak memakai data ini untuk iklan, dan kamu dapat menolak seperti
                  dijelaskan di bagian 11.
                </p>
              </Sub>
              <Sub title="4.3 Persetujuan">
                <p>
                  Kami mengandalkan persetujuanmu saat kamu mengirim pertanyaan lewat Situs, dan sebelum
                  kami menganalisis foto apa pun yang kamu simpan sebelum pengenalan hidangan ada
                  (bagian 3). Kami tidak mengandalkan persetujuan untuk pengenalan hidangan itu sendiri;
                  itu dijelaskan di bagian 4.2.
                </p>
                <p>
                  Kamu dapat menarik persetujuan kapan saja dengan menghubungi kami atau berhenti
                  berlangganan. Menarik persetujuan tidak memengaruhi keabsahan pemrosesan yang kami
                  lakukan sebelum kamu menariknya.
                </p>
              </Sub>
            </div>
          </Section>

          <Section title="5. Kontrol Berbagi dan Visibilitas">
            <p>
              Setiap makanan yang kamu simpan punya salah satu dari dua audiens. Apa yang dapat dilihat
              orang lain bergantung pada pilihanmu.
            </p>
            <Bullets>
              <li><strong className={strong}>Publik</strong> — terlihat oleh pengguna lain, dan dapat muncul di fitur penemuan dalam Aplikasi</li>
              <li><strong className={strong}>Hanya teman</strong> — terlihat oleh temanmu yang berteman timbal balik</li>
            </Bullets>
            <p>Makanan pertama yang kamu bagikan selalu hanya-teman. Setelah itu kamu memilih untuk setiap makanan.</p>
            <p>
              Agar jelas apa arti &ldquo;hanya teman&rdquo;: makanan yang tidak publik dapat dilihat
              orang-orang yang sama-sama kamu dan mereka tambahkan sebagai teman. Itu tidak hanya
              terlihat olehmu. Jika kamu tidak ingin makanan dilihat siapa pun, jangan simpan ke Makan.
            </p>
            <p>
              Kamu memilih audiens makanan saat menyimpannya, dan saat ini tidak ada cara mengubah
              pilihan itu setelahnya. Jika kamu ingin makanan punya audiens lain, hapus dan simpan lagi.
            </p>
            <p>
              Menghapus makanan menghapusnya dari Aplikasi. Salinan dapat tertinggal sementara di cache
              perangkat atau cadangan sistem untuk jangka waktu terbatas, seperti dijelaskan di bagian
              penyimpanan data.
            </p>
            <MaitredPrivacyDisclosure locale="id" />
            <div>
              <h3>Menampilkan konten publikmu dalam pemasaran kami</h3>
              <p>
                Bila kamu memposting konten untuk audiens publik, kami dapat menampilkannya dalam materi
                promosi dan kanal kami sendiri, termasuk platform pihak ketiga seperti Instagram dan
                TikTok — misalnya &ldquo;Makan of the Week&rdquo; pilihan kami. Ini dapat mencakup foto
                makanan, keterangan, dan nama pengguna atau nama tampilanmu.
              </p>
              <ul>
                <li>Hanya konten publik. Kami tidak pernah memakai konten yang kamu setel hanya-teman.</li>
                <li>Dasar hukum. Kami mengandalkan kepentingan sah kami dalam mempromosikan Makan, ditimbang terhadap hakmu (bagian 4.2). Kami tidak meminta izin sebelum setiap penampilan; kamu dapat menolak, atau meminta kami menghapus konten yang ditampilkan, kapan saja.</li>
                <li>Orang lain dalam fotomu. Sebelum menampilkan apa pun ke luar, kami melihatnya dulu, dan kami tidak menerbitkan foto yang memperlihatkan jelas orang lain. Jika kamu muncul di konten yang kami tampilkan dan tidak setuju, hubungi kami dan kami akan menghapusnya dari kanal yang kami kendalikan.</li>
                <li>Di bawah 18 tahun. Kami tidak dengan sengaja menampilkan konten pengguna di bawah 18 tahun dalam pemasaran eksternal. Kami tidak dapat memverifikasi usia, jadi jika ini berlaku bagimu, hubungi kami dan kami akan menghapusnya.</li>
                <li>Kontrolmu. Kamu dapat menolak, meminta penghapusan konten yang ditampilkan dari kanal yang kami kendalikan, atau keberatan, dengan menghubungi <Mail />. Konten yang sudah dibagikan ulang oleh orang lain mungkin tetap berada di luar kendali kami.</li>
                <li>Platform pihak ketiga. Saat kontenmu muncul di platform pihak ketiga, platform itu memprosesnya menurut kebijakan privasinya sendiri.</li>
              </ul>
            </div>
          </Section>

          <Section title="6. Penyedia Layanan dan Penerima Lain">
            <p>
              Kami memakai penyedia berikut untuk menjalankan Layanan. Bila mereka memproses data pribadi
              atas nama kami, mereka melakukannya berdasarkan ketentuan kontrak yang mewajibkan keamanan
              dan kerahasiaan yang memadai. Sebagian layanan di bawah dihubungi langsung oleh
              perangkatmu, yang berarti mereka melihat alamat IP-mu bahkan bila kami tidak mengirimkan
              apa pun tentangmu kepada mereka; layanan itu juga dicantumkan di sini agar gambarannya
              lengkap.
            </p>
            <Sub title="Penyedia yang memproses data atas nama kami">
              <Bullets>
                <li>Google LLC (Firebase) — backend Aplikasi. Kami memakai Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions, dan Firebase Analytics untuk menyimpan dan menyinkronkan data akun dan makanan, menjalankan fitur inti, dan memahami penggunaan.</li>
                <li>Functional Software, Inc. (Sentry) — pelaporan kerusakan dan kesalahan Aplikasi. Menerima data diagnostik tentang gangguan, termasuk pengenal pengguna dan urutan tindakan sebelum kerusakan, agar kami dapat menemukan dan memperbaikinya.</li>
                <li>Vercel Inc. — hosting Situs, dan Vercel Web Analytics, yang mengukur penggunaan Situs secara agregat.</li>
                <li>Google LLC (Google Sheets) — penyimpanan aman untuk kiriman formulir kontak dan pertanyaan.</li>
                <li>Resend — pengiriman email transaksional, seperti notifikasi formulir kontak.</li>
                <li>Apple Inc. — distribusi Aplikasi lewat App Store.</li>
              </Bullets>
            </Sub>
            <Sub title="Layanan yang dihubungi langsung oleh perangkatmu">
              <Bullets>
                <li>Google LLC (Places dan Maps) — pencarian restoran dan tempat di sekitar. Saat kamu mencari restoran atau meminta Aplikasi menampilkan tempat di dekatmu, teks pencarian dan perkiraan lokasimu dikirim ke Google.</li>
                <li>KLIPY — pemilih GIF di komentar. Saat kamu mengetik di kotak pencarian GIF, apa yang kamu ketik dikirim ke Klipy, dan karena permintaan datang dari ponselmu, Klipy juga melihat alamat IP-mu. Klipy tidak menerima pengenal akun Makan atau pengenal perangkat apa pun. Klipy juga melihat alamat IP siapa pun yang perangkatnya memuat GIF di komentar.</li>
                <li>Unsplash — menyediakan foto untuk koleksi editorial kami sendiri di dalam Aplikasi. Perangkatmu memuat gambar itu langsung dari Unsplash, sehingga Unsplash melihat alamat IP-mu. Tidak ada informasi tentangmu atau makananmu yang dikirim.</li>
              </Bullets>
            </Sub>
            <p>
              Kami tidak memakai SDK iklan pihak ketiga atau teknologi pelacakan lintas aplikasi. Kami
              menjaga daftar ini tetap mutakhir. Bila kami mengganti atau menambah penyedia untuk fungsi
              yang sudah dijelaskan di Kebijakan ini, kami memperbarui daftar ini sebelum penyedia baru
              mulai memproses data pribadi. Bila suatu perubahan memperkenalkan tujuan baru, kami
              menjelaskannya di Kebijakan ini dan menetapkan dasar hukumnya lebih dulu.
            </p>
          </Section>

          <Section title="7. Cookie dan Teknologi Serupa">
            <p>
              <strong className={strong}>Situs.</strong> Situs memakai Vercel Web Analytics, yang ramah
              privasi dan tanpa cookie: ia mengenali kunjungan dengan hash yang diatur ulang setiap hari
              dan tidak dapat melacakmu lintas hari atau lintas situs lain. Vercel Web Analytics tidak
              memakai cookie dan tidak mengumpulkan pengenal pribadi. Font di Situs disajikan dari domain
              kami sendiri, sehingga memuat halaman tidak mengirim datamu ke penyedia font.
            </p>
            <p>
              <strong className={strong}>Analitik penggunaan Aplikasi.</strong>{' '}
              Kami memakai Firebase Analytics dari Google untuk memahami bagaimana layar dan fitur
              Aplikasi dipakai agar dapat meningkatkannya. Ia memakai pengenal instans aplikasi.
              Analitik penggunaan menyala secara bawaan di perangkat ini setelah kamu masuk dan
              preferensi tersimpanmu diperiksa. Kamu dapat mematikannya di Pengaturan › Privasi ›{' '}
              <strong className={strong}>Analitik penggunaan Aplikasi</strong>. Sakelar ini menghentikan
              pengukuran penggunaan berikutnya di perangkat ini. Pilihanmu tetap tersimpan saat kamu
              keluar atau menghapus akun; atur secara terpisah di perangkat lain. Penolakan yang sudah
              ada tetap mati. Mematikan pengumpulan tidak dengan sendirinya menghapus data yang sudah
              dikumpulkan.
            </p>
            <p>
              Peristiwa penggunaan tidak mencakup ID akunmu, ID akun orang lain, isi makanan, nama
              tempat, keterangan, atau lokasi presisi. Penyimpanan iklan dan personalisasi dinonaktifkan.
              Kami memakai analitik penggunaan semata-mata untuk meningkatkan Aplikasi, bukan untuk
              iklan, pelacakan lintas aplikasi, atau gambaran selera pribadi yang dijelaskan di bagian
              2.7. Penyedia analitik kami wajib memproses informasi ini hanya untuk membantu kami
              meningkatkan Aplikasi, bukan untuk tujuannya sendiri.
            </p>
            <p>
              <strong className={strong}>Diagnostik kerusakan dan kinerja.</strong>{' '}
              Kami memakai Sentry untuk mengidentifikasi kerusakan dan gangguan kinerja. Laporan dapat
              mencakup pengenal akunmu saat masuk, informasi aplikasi dan perangkat, dan konteks
              diagnostik. Sakelar analitik penggunaan Aplikasi mengendalikan Firebase Analytics; ia
              tidak mematikan diagnostik Sentry. Kami tidak memakai diagnostik ini untuk iklan,
              pelacakan lintas aplikasi, atau gambaran selera pribadi.
            </p>
            <p>
              Kami mengandalkan kepentingan yang sah untuk tujuan ini seperti dijelaskan di bagian 4.2.
              Untuk menolak pemrosesan berdasarkan kepentingan yang sah, hubungi <Mail />. Kami akan
              menilai pemrosesan yang terdampak, menjelaskan tindakan yang diambil, dan menegaskan
              cakupannya. Sakelar analitik perangkat bukan kontrol di seluruh akun. Hakmu, termasuk cara
              meminta kami menghapus informasi yang sudah kami simpan, dijelaskan di bagian 11.
            </p>
          </Section>

          <Section title="8. Transfer Data Internasional">
            <p>
              Sebagian layanan yang tercantum di bagian 6 — termasuk Google, Sentry, Vercel, Resend,
              Apple, Klipy, dan Unsplash — menerima atau memproses data pribadi di luar Britania Raya,
              termasuk di Amerika Serikat.
            </p>
            <p>
              Bila terjadi transfer internasional, kami mengandalkan perlindungan yang sesuai dan diakui
              menurut hukum Inggris, seperti UK International Data Transfer Agreement atau Addendum,
              perluasan Inggris atas Klausul Kontrak Standar UE, atau transfer ke penyedia yang
              tersertifikasi di bawah kerangka pelindungan data yang berlaku. Kamu dapat meminta
              informasi lebih lanjut tentang perlindungan ini lewat kontak di atas.
            </p>
            <p>
              Jika kamu memakai Layanan di Indonesia, hak dan perlindungan tambahan berlaku bagimu
              menurut Undang-Undang Pelindungan Data Pribadi Indonesia (UU PDP No. 27/2022). Kami sedang
              memperluas Kebijakan ini dan praktik kami untuk memenuhi persyaratan tersebut. Untuk
              pertanyaan tentang datamu sebagai pengguna di Indonesia, hubungi <Mail />.
            </p>
          </Section>

          <Section title="9. Keamanan">
            <p>
              Kami menerapkan langkah teknis dan organisasi yang dirancang untuk melindungi data pribadi,
              termasuk enkripsi saat transit, kontrol akses, dan aturan keamanan di sisi server.
            </p>
            <p>
              Tidak ada sistem yang sepenuhnya aman, tetapi kami mengambil langkah wajar untuk
              melindungi data dari akses tanpa izin, kehilangan, atau penyalahgunaan. Jika terjadi
              pelanggaran data pribadi yang kemungkinan menimbulkan risiko bagi hakmu, kami akan
              memberi tahu Information Commissioner&apos;s Office, dan pengguna yang terdampak bila
              diwajibkan, dalam jangka waktu yang ditetapkan hukum.
            </p>
          </Section>

          <Section title="10. Penyimpanan Data">
            <div>
              <p>
                Kami menyimpan data pribadi hanya selama diperlukan untuk tujuan yang dijelaskan dalam
                Kebijakan Privasi ini.
              </p>
              <Sub title="10.1 Akun aktif">
                <p>Data akun dan konten makanan disimpan selama akun masih aktif.</p>
              </Sub>
              <Sub title="10.2 Akun yang dihapus">
                <p>
                  Saat akun dihapus, data pribadi dihapus atau dianonimkan dalam 30 hari, kecuali
                  jangka penyimpanan lebih lama diwajibkan hukum atau diperlukan demi keamanan, seperti
                  mencegah penyalahgunaan. Kami menyimpan catatan permanen bahwa suatu akun telah
                  dihapus, dalam bentuk yang tidak mengidentifikasimu, agar penghapusan tidak dapat
                  terbatalkan secara tidak sengaja.
                </p>
              </Sub>
              <Sub title="10.3 Data pertanyaan">
                <p>
                  Data pertanyaan disimpan sampai kamu meminta kami menghapusnya, atau sampai tidak
                  lagi diperlukan untuk tujuan pengirimannya.
                </p>
              </Sub>
              <Sub title="10.4 Cadangan dan log keamanan">
                <Bullets>
                  <li>Cadangan menyimpan data untuk jangka waktu terbatas sebagai bagian dari ketahanan dan pemulihan sistem</li>
                  <li>Log keamanan dan pencegahan penyalahgunaan disimpan untuk jangka waktu terbatas yang sesuai untuk mendeteksi dan menyelidiki penyalahgunaan</li>
                </Bullets>
              </Sub>
            </div>
          </Section>

          <Section title="11. Hakmu">
            <p>Menurut UK GDPR, kamu berhak untuk:</p>
            <Bullets>
              <li>Mengakses data pribadimu</li>
              <li>Meminta perbaikan data yang tidak akurat</li>
              <li>Meminta penghapusan data pribadi</li>
              <li>Meminta pembatasan pemrosesan dalam keadaan tertentu</li>
              <li>Meminta portabilitas data bila berlaku</li>
              <li>Menolak pemrosesan yang kami lakukan berdasarkan kepentingan yang sah, seperti pengukuran penggunaan dan pelaporan kerusakan yang dijelaskan di bagian 7</li>
              <li>Menarik persetujuan bila kami mengandalkannya. Menarik persetujuan tidak memengaruhi keabsahan pemrosesan yang kami lakukan sebelum kamu menariknya</li>
            </Bullets>
            <p>
              Gambaran seleramu (bagian 2.7) adalah bagian dari layanan berdasarkan kontrak, jadi hak
              menolak pemrosesan berdasarkan kepentingan yang sah tidak berlaku untuknya, dan tidak ada
              pengaturan untuk mematikannya. Kamu tetap dapat meminta salinannya, meminta kami
              memperbaikinya, dan menghapusnya dengan menghapus akunmu. Jika kamu merasa gambaran itu
              dipakai dengan cara yang tidak dijelaskan Kebijakan ini, beri tahu kami.
            </p>
            <p>
              Kamu dapat menghapus akunmu kapan saja dari dalam Aplikasi, yang memulai proses
              penghapusan yang dijelaskan di atas. Untuk menjalankan hak lain, hubungi kami di <Mail />.
              Kami dapat meminta informasi untuk memverifikasi identitasmu, dan kami menangani permintaan
              dalam batas waktu yang diwajibkan hukum.
            </p>
            <p>
              Kamu juga berhak mengajukan keluhan ke Information Commissioner&apos;s Office (ICO) Inggris
              di ico.org.uk.
            </p>
          </Section>

          <Section title="12. Anak-Anak">
            <p>Kamu harus berusia minimal 13 tahun untuk membuat akun.</p>
            <p>
              Aplikasi tidak memverifikasi usia. Karena layanan seperti kami dapat dipakai anak-anak dan
              kami tidak dapat memastikan mana pengguna yang anak-anak, kami menerapkan perlindungan yang
              diharapkan oleh UK Age Appropriate Design Code (Children&apos;s Code) kepada{' '}
              <strong className={strong}>setiap</strong> pengguna, bukan hanya mereka yang kami anggap
              muda. Dalam praktik, artinya:
            </p>
            <Bullets>
              <li>Makanan pertama yang kamu bagikan selalu hanya-teman; setelah itu, kamu memilih hanya-teman atau publik untuk setiap makanan</li>
              <li>Akses lokasi mati secara bawaan dan hanya dipakai, dengan izin, saat kamu memakai fitur lokasi</li>
              <li>Kami mengumpulkan data seminimal yang diperlukan, dan tidak pernah memakai datamu untuk iklan bertarget</li>
              <li>Kami menyusun gambaran seleramu sendiri dari perbandingan yang kamu jawab dan urutan yang kamu tetapkan, seperti dijelaskan di bagian 2.7. Gambaran itu ada untuk membantumu memilih makan apa, bersifat privat bagimu kecuali kecocokan selera dengan teman dan peringkat gabungan yang dijelaskan di sana, dan tidak pernah dipakai untuk mengiklankan sesuatu kepadamu, menilaimu, atau memutuskan apa pun tentangmu</li>
              <li>Kami tidak memakai desain manipulatif atau dorongan untuk membuatmu berbagi lebih dari yang kamu maksudkan</li>
              <li>Kami tidak memakai streak, lencana, poin, atau papan peringkat untuk membuatmu terus memakai Aplikasi</li>
            </Bullets>
            <p>
              Jika kami mengetahui data pribadi telah dikumpulkan dari anak di bawah 13 tahun, kami akan
              mengambil langkah untuk menghapus data itu. Jika kamu yakin seorang anak telah memberi kami
              data pribadi, silakan hubungi kami.
            </p>
          </Section>

          <Section title="13. Pengambilan Keputusan Otomatis dan Pemrofilan">
            <p>
              Kami tidak memakai pengambilan keputusan otomatis atau pemrofilan yang menghasilkan
              dampak hukum atau dampak signifikan serupa bagimu.
            </p>
            <p>
              Makan memang menyusun gambaran seleramu yang dijelaskan di bagian 2.7, dan wajar menyebutnya
              profil preferensimu. Kami lebih memilih mengatakannya terus terang daripada bersembunyi di
              balik kata-kata. Yang penting adalah untuk apa ia dipakai dan apa yang tidak bisa
              dilakukannya: ia ada untuk menjawab &ldquo;apa yang sebaiknya kupesan&rdquo;, disusun dari
              perbandingan yang kamu pilih untuk dijawab dan urutan yang kamu tetapkan, satu-satunya
              yang dilihat orang lain darinya adalah kecocokan selera dengan teman dan peringkat gabungan
              yang dijelaskan di bagian 2.7, dan ia tidak pernah dipakai untuk menilaimu, menentukan
              apakah kamu boleh memakai bagian Layanan mana pun, atau mengiklankan sesuatu kepadamu.
            </p>
            <p>
              Kami tidak menganalisis isi foto makananmu. Yang kami maksud dengan &ldquo;menganalisis&rdquo;
              adalah mengetahui apa yang diperlihatkan sebuah foto. Penanganan teknis biasa — mengubah
              ukuran, mengompres, menyimpan, dan mengirim fotomu agar Aplikasi dapat menampilkannya —
              bukan analisis, dan kami melakukannya untuk setiap makanan yang kamu simpan.
            </p>
            <p>
              Saat kami memperkenalkan fitur pengenalan hidangan yang dijelaskan di bagian 3, fitur itu
              bekerja dengan mengukur seberapa mirip makanan di dua foto. Ia hanya memengaruhi apa yang
              ditampilkan Aplikasi tentang makananmu sendiri, tidak menghasilkan penilaian tentangmu, dan
              tidak membuat keputusan berdampak hukum atau signifikan serupa. Kamu akan dapat
              memperbaiki pengelompokan yang salah, dan kamu dapat menolak pemrosesan sama sekali
              seperti dijelaskan di bagian 3 dan 11.
            </p>
          </Section>

          <Section title="14. Perubahan pada Kebijakan Ini">
            <p>Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu.</p>
            <p>
              Versi yang diperbarui akan diterbitkan dengan tanggal &ldquo;Terakhir diperbarui&rdquo; yang
              baru. Bila perubahannya signifikan, kami akan mengambil langkah wajar untuk memberi tahumu,
              misalnya di dalam Aplikasi atau lewat email.
            </p>
            <p>
              Pembaruan tertanggal 4 November 2026 menjadikan gambaran seleramu bagian dari layanan,
              bukan pengaturan. Pembaruan ini menjelaskan kecocokan selera dengan teman dan peringkat
              publik gabungan di bagian 2.7, memindahkan gambaran itu dari kepentingan yang sah ke
              kontrak di bagian 4, menghapus kalimat hak menolak yang berlaku untuknya di bagian 11 dan
              13, dan menjelaskan bahwa pengaturan &ldquo;Bagikan seleraku&rdquo; telah dihapus.
            </p>
            <p>
              Pembaruan sebelumnya, pada 30 Agustus 2026, menulis ulang bagian pengenalan hidangan di
              bagian 3, 4, dan 13. Fitur itu kini dijelaskan sebagai bagian dari cara kerja Aplikasi,
              bukan sesuatu yang kamu nyalakan, dan kepentingan yang sah menggantikan persetujuan sebagai
              dasar hukumnya. Hakmu untuk menolak dijelaskan di bagian 3 dan 11. Foto yang kamu simpan
              sebelum fitur itu ada tetap tidak diikutkan kecuali kamu mengikutsertakannya.
            </p>
            <p>
              Pembaruan tertanggal 6 September 2026 menjelaskan sakelar analitik penggunaan Aplikasi di
              tingkat perangkat di bagian 7, membedakannya dari diagnostik kerusakan dan kinerja Sentry,
              dan memperjelas cara menolak. Bagian 2.3 menjelaskan bahwa peristiwa interaksi penggunaan
              tidak lagi mencatat pengenal akun orang lain. Pembaruan ini juga memperjelas bahwa
              mematikan pengumpulan di masa depan tidak dengan sendirinya menghapus informasi yang sudah
              kami simpan.
            </p>
          </Section>

          <div>
            <Link href="/id">
              <PlayfulArrow direction="left" /> Kembali ke beranda
            </Link>
          </div>

          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
