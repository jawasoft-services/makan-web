// Single source of truth for /support — the destination of the App Store Connect
// "Support URL" field. Rendered by app/support/page.tsx and emitted as FAQPage
// JSON-LD by components/FaqSchema.tsx.
//
// This is NOT lib/faq.ts. That file answers marketing search queries ("what does
// makan mean?"); this one answers "something is wrong and I need it fixed".
//
// EVERY answer below was verified against origin/main of jawasoft-services/munchies-rn
// by reading blobs with `git show origin/main:<path>` — never the iCloud working
// tree, where grep silently returns empty on dataless files. UI labels are quoted
// verbatim from source. Do not add or edit an answer without re-reading the app
// source: a wrong claim here is both a support failure and an App Store metadata
// inaccuracy (App Review Guideline 2.3).
//
// Standing constraints, each learned from a real code path:
//  - Deletion: no grace period, no undo, and NOT "all your data" — some business
//    and entitlement records are intentionally retained, and Storage cleanup is
//    best-effort.
//  - Display name: never state a cooldown duration. main has 5 minutes; the
//    settled product decision is 30 days and has not landed.
//  - Reports: never state a review turnaround. Nothing in code promises one.
//  - Android: never state a date. Both Android submit profiles are "draft".
//  - Privacy requests: never state a response deadline. The Privacy Policy says
//    only "within the time limits required by law".
//
// Full rationale + file:line citations: docs/superpowers/specs/2026-07-10-support-page-design.md

export const SUPPORT_EMAIL = 'support@makanofficial.com'

export interface SupportFaqItem {
  q: string
  a: string
}

export const SUPPORT_FAQS: SupportFaqItem[] = [
  {
    q: 'How do I delete my account?',
    a: `Open Settings, scroll to the bottom and tap Delete Account, then confirm on the Delete My Data prompt. You’ll be asked to verify it’s you first — how depends on how you signed in. Deletion is permanent and cannot be undone: your account, your meals and your photos are removed. If you can’t complete the verification step, email ${SUPPORT_EMAIL} and we’ll delete your account for you.`,
  },
  {
    q: 'How do I change my username or display name?',
    a: `You can change your display name from the Profile tab: tap Edit profile, edit your name and save. Your username is fixed when you create your account and can’t be changed in the app — on that screen it shows as USERNAME · LOCKED. If your username is a problem, for example it contains personal information, email ${SUPPORT_EMAIL}.`,
  },
  {
    q: 'I can’t sign in.',
    a: 'Makan supports Sign in with Apple, Google, and email with a password. Sign in the same way you signed up. If you use an email and password, tap Forgot Password? on the sign-in screen and we’ll email you a reset link.',
  },
  {
    q: 'My meal won’t upload.',
    a: `Makan retries automatically when you’re offline — you’ll see “You’re offline. Posts will retry when connected.” If an upload fails, the banner gives you Retry and Discard, so a failed post isn’t lost. If it keeps failing on a good connection, email ${SUPPORT_EMAIL}.`,
  },
  {
    q: 'How do I report a meal, or block someone?',
    a: 'Tap the three-dot menu on any meal. Report sends it to us for review. Block User stops them seeing your meals or finding you on Makan.',
  },
  {
    q: 'Is Makan on Android?',
    a: 'Not yet — Makan is iPhone-only today. Android is in the works, and we don’t have a release date to share.',
  },
  {
    q: 'How do I get a copy of my data?',
    a: `There’s no in-app export. Email ${SUPPORT_EMAIL} to request access to, correction of, deletion of, or a portable copy of your data. Our Privacy Policy explains what we hold and why.`,
  },
]

export const SUPPORT_FAQS_ID: SupportFaqItem[] = [
  {
    q: 'Bagaimana cara menghapus akun?',
    a: `Buka Settings, scroll ke bagian paling bawah, lalu ketuk Delete Account dan konfirmasi lewat Delete My Data. Kamu akan diminta memverifikasi identitas terlebih dahulu; caranya tergantung metode masuk yang kamu gunakan. Penghapusan bersifat permanen dan tidak bisa dibatalkan: akun, postingan makanan, dan fotomu akan dihapus. Kalau verifikasi tidak berhasil, email ${SUPPORT_EMAIL} dan kami akan membantu menghapus akunmu.`,
  },
  {
    q: 'Bagaimana cara mengganti username atau nama tampilan?',
    a: `Nama tampilan bisa diganti dari tab Profile: ketuk Edit profile, ubah nama, lalu simpan. Username ditetapkan saat akun dibuat dan tidak bisa diganti di aplikasi; di layar itu tertulis USERNAME · LOCKED. Kalau username-mu bermasalah, misalnya memuat informasi pribadi, email ${SUPPORT_EMAIL}.`,
  },
  {
    q: 'Saya tidak bisa masuk.',
    a: 'Makan mendukung Sign in with Apple, Google, dan email dengan kata sandi. Masuklah dengan cara yang sama seperti saat mendaftar. Kalau memakai email dan kata sandi, ketuk Forgot Password? di layar masuk dan kami akan mengirim tautan reset.',
  },
  {
    q: 'Postingan makananku tidak bisa diunggah.',
    a: `Makan akan mencoba lagi secara otomatis saat kamu offline. Kamu akan melihat pesan “You’re offline. Posts will retry when connected.” Kalau unggahan gagal, banner menyediakan pilihan Retry dan Discard sehingga postinganmu tidak langsung hilang. Kalau tetap gagal saat koneksi bagus, email ${SUPPORT_EMAIL}.`,
  },
  {
    q: 'Bagaimana cara melaporkan postingan atau memblokir seseorang?',
    a: 'Ketuk menu tiga titik di postingan makanan. Report mengirimkannya kepada kami untuk ditinjau. Block User mencegah orang itu melihat postinganmu atau menemukanmu di Makan.',
  },
  {
    q: 'Apakah Makan tersedia di Android?',
    a: 'Belum. Saat ini Makan hanya tersedia di iPhone. Versi Android sedang dikerjakan, tetapi kami belum punya tanggal rilis.',
  },
  {
    q: 'Bagaimana cara mendapatkan salinan dataku?',
    a: `Belum ada fitur ekspor di aplikasi. Email ${SUPPORT_EMAIL} untuk meminta akses, koreksi, penghapusan, atau salinan portabel datamu. Kebijakan Privasi kami menjelaskan data apa yang disimpan dan alasannya.`,
  },
]
