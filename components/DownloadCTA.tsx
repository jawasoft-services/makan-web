export default function DownloadCTA() {
  return (
    <section id="download" className="bg-brand-orange py-20 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-white lg:text-5xl">
          Ready to share your next meal?
        </h2>
        <p className="mt-4 text-lg text-white/80">
          Download Makan for free on iOS and Android.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#"
            className="rounded-full bg-white px-8 py-3 font-semibold text-brand-orange transition-transform hover:scale-105"
          >
            App Store
          </a>
          <a
            href="#"
            className="rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition-transform hover:scale-105"
          >
            Google Play
          </a>
        </div>
      </div>
    </section>
  )
}
