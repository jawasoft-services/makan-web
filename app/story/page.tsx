import type { Metadata } from "next"
import Link from "next/link"
import Footer from "@/components/Footer"
import StorySchema from "@/components/story/StorySchema"
import { getMealCount } from "@/lib/makan-stats"
import { APP_STORE_URL } from "@/lib/links"
import { BOILERPLATE_LONG, BOILERPLATE_SHORT, PRESS_EMAIL } from "@/lib/press"

// Regenerate hourly so the live meal count stays fresh (same cadence as the homepage).
export const revalidate = 3600

export const metadata: Metadata = {
  title: "The Makan story — how and why Makan was built",
  description: BOILERPLATE_SHORT,
  alternates: { canonical: "https://www.makanofficial.com/story" },
  openGraph: {
    title: "The Makan story",
    description: BOILERPLATE_SHORT,
    url: "https://www.makanofficial.com/story",
    siteName: "Makan",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Makan story",
    description: BOILERPLATE_SHORT,
    site: "@app_makan",
  },
}

export default async function StoryPage() {
  const mealCount = await getMealCount()

  return (
    <div className="min-h-screen bg-brand-cream">
      <StorySchema />
      <main id="main-content" className="mx-auto max-w-2xl px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange-ink">The Makan story</p>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-ink" style={{ letterSpacing: "-0.02em" }}>
          The day revolves<br />around the meal.
        </h1>

        <div className="mt-8 space-y-5 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          <p>
            I&apos;m a third culture kid. Citizens of everywhere and nowhere. Born in Jakarta, raised across Singapore
            and Bali, now Durham. The app&apos;s even named for it: <em>makan</em>{' '}means &ldquo;to eat&rdquo;
            in Indonesian. That everywhere-and-nowhere feeling is the root of the whole thing.
          </p>
          <p>
            When COVID hit, my closest mates were scattered across the world, all of us suddenly stuck inside the same
            four walls. Everyone went weirdly deep on food that year, so on a whim I set up a shared Snapchat story with
            me as admin and got everyone posting whatever they were eating. It was the one place we could all still sit
            at the same table.
          </p>
          <p>
            It never stopped. That story ran through COVID, then my GCSEs, then A levels, then into uni, friends adding
            friends, meals every single day. Then in second year I flew out to see a mate at NYU, and I&apos;m sat in
            New York eating a slice, posting to the same story I&apos;d started five years before, and it clicked:
            I&apos;d accidentally built a photographic record of my whole life, one meal at a time. That was where Makan
            came from.
          </p>
          <p>
            Somewhere in there I also realised we look at food the wrong way. Everyone&apos;s chasing the next
            &lsquo;it&rsquo; place, the 4-point-something spot with the queue round the block that went viral three days
            ago. But you&apos;ll have completely forgotten the meal at your dad&apos;s 50th. The meal isn&apos;t a side
            note to the day. The day revolves around the meal. Makan&apos;s a food diary built to stop those slipping
            away.
          </p>
          <p>
            Here&apos;s how it works: you photograph what you&apos;re eating right there in the app, like BeReal, add a
            caption, tag who you&apos;re with, drop the location if you&apos;re out, and post. Over time it becomes your
            diary, every meal sitting beside the moment around it that only you know about. Your diary becomes your
            story.
          </p>
          <p>
            No calorie counting, and no stars, which is my real beef. I went through around 150 Durham restaurants on
            Google myself, and nearly half are rated 4.5 out of 5 or higher, the average about 4.4. When that many
            places score that high, the number stops telling you anything. So instead of a stranger&apos;s rating, Makan
            has Eat or Yeet (I heard 2026 is the new 2016). It pits two of your own meals head to head, your nan&apos;s
            roast against a 2am kebab, and you pick the winner, building your personal ranking over time. Letterboxd&apos;s
            top four, but for food. Your dinner isn&apos;t a four-point-something out of five. It&apos;s your number one
            of all time, and no one else gets a vote.
          </p>
          <p>
            On the build: I drive the product and the design, working alongside an experienced dev team at Jawasoft in
            Jakarta. My dad&apos;s spent his whole career in software out there and loves food as much as I do (I clearly
            get it from him), so it&apos;s become a proper father-son project. That&apos;s what took us from idea to live
            on the App Store in just over a year.
          </p>
          <p>
            We launched in June 2026, and there are already a few hundred of us on it, with{" "}
            {mealCount.toLocaleString()}+ meals logged.
          </p>
        </div>

        {/* Proof — reviews */}
        <div className="mt-10 rounded-2xl border border-brand-line bg-brand-card p-6">
          <p className="text-sm leading-relaxed text-brand-muted">
            See how it&apos;s used — real first-person reviews of the places people actually remember.
          </p>
          <Link href="/blog" className="mt-3 inline-block text-sm font-semibold text-brand-orange-ink hover:underline">
            Read the reviews →
          </Link>
        </div>

        {/* Press essentials */}
        <div className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">For press</h2>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-brand-muted">About Makan (copy-paste)</p>
          <p className="mt-2 text-[15px] leading-[1.75] text-brand-muted">{BOILERPLATE_LONG}</p>

          <p className="mt-6 text-[15px] text-brand-muted">
            Press contact:{" "}
            <a href={`mailto:${PRESS_EMAIL}`} className="text-brand-orange-ink hover:underline">
              {PRESS_EMAIL}
            </a>
          </p>

          <a
            href={APP_STORE_URL}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand-orange px-7 text-sm font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
          >
            Download on the App Store
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
