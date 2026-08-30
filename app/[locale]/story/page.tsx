import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import Footer from "@/components/Footer"
import StorySchema from "@/components/story/StorySchema"
import { getMealCount } from "@/lib/makan-stats"
import { APP_STORE_URL } from "@/lib/links"
import { BOILERPLATE_LONG, BOILERPLATE_SHORT, PRESS_EMAIL } from "@/lib/press"
import { createPageMetadata } from "@/lib/site-metadata"
import StoryIndonesian from "./StoryIndonesian"

// Regenerate hourly so the live meal count stays fresh (same cadence as the homepage).
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isIndonesian = locale === "id"
  return createPageMetadata({
    title: isIndonesian
      ? "Cerita Makan: kenapa Makan dibuat"
      : "The Makan story: how and why Makan was built",
    description: isIndonesian
      ? "Dari shared story saat COVID menjadi cara memutuskan mau pesan apa. Ini cerita bagaimana dan kenapa Makan dibuat."
      : BOILERPLATE_SHORT,
    path: isIndonesian ? "/id/story" : "/story",
    type: "article",
    locale,
  })
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const mealCount = await getMealCount()

  return (
    <div className="min-h-screen bg-brand-cream">
      <StorySchema locale={locale} />
      {locale === "id" ? (
        <StoryIndonesian mealCount={mealCount} />
      ) : (
      <main id="main-content" className="mx-auto max-w-2xl px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">The Makan story</p>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-ink" style={{ letterSpacing: "-0.02em" }}>
          Nobody knows<br />what to order.
        </h1>
        <p className="mt-4 text-base sm:text-lg italic text-brand-muted">
          My friends solved it for me by accident. It took me five years to notice.
        </p>

        <div className="mt-8 space-y-5 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          <p>You sit down. You open the menu. And it starts.</p>

          <p className="italic">
            Chicken&apos;s safe. Chicken&apos;s always safe. But if I&apos;m having chicken, why did I come here.
            Everyone else is looking at the fish. Is the fish a lot? That&apos;s a lot. What was that thing on the board
            outside. Is that what this place is famous for, or is that just what they&apos;ve got too much of. Fourteen
            things on here. Fifteen if you count the one with the little chilli next to it, and I don&apos;t know how hot
            their chilli means. I had noodles yesterday. Do I want noodles two days running. He&apos;s coming back over.
            He&apos;s coming back over.
          </p>

          <p>&ldquo;Chicken, please.&rdquo;</p>

          <p>
            Nobody talks about that minute, but everybody has it. And it never gets solved. It just gets ended, by the
            waiter arriving.
          </p>

          <p>
            I watched it from the outside at a table in Canggu. Four of us. One of them read the rating out loud, hoping
            it would decide for him. Four point four, hundreds of reviews, everyone says it&apos;s great.
          </p>

          <p>It changed nothing. He&apos;d already chosen the restaurant. He was sitting in it.</p>

          <p>
            Every one of those hundreds of reviews was about the building, or the decor, or the service. Not one of them
            was about the fourteen things on the menu in front of him.
          </p>

          <p>
            That&apos;s the gap. There is an entire internet for working out where to eat, and almost nothing for the
            decision you actually make when you get there.
          </p>

          <p>They went round the table twice and ordered more or less at random.</p>

          <p>
            Easy to blame that on two of them having just landed in Indonesia for the first time. But the loudest version
            of that minute I&apos;ve ever had was in a place I&apos;d eaten in twenty times. Knowing the menu isn&apos;t
            the problem. Knowing which of the fourteen is the one. That&apos;s the problem.
          </p>

          <p>
            I knew what to get that night. I&apos;d like to tell you that was taste. It wasn&apos;t. My friends had been
            telling me for years, and none of us had noticed.
          </p>
        </div>

        <h2 className="mt-12 text-xl sm:text-2xl font-bold text-brand-ink">March 2020</h2>
        <div className="mt-6 space-y-5 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          <p>
            Everyone I knew scattered. Jakarta, Durham, London, a couple stuck in places they hadn&apos;t planned to be.
            The group chat died the way group chats do.
          </p>
          <p>So we started a shared story. One rule: post what you&apos;re eating.</p>
          <p>Nobody was eating out. Nobody could. So every plate on there was somebody&apos;s own cooking.</p>
          <p>
            The first thing anyone put up was a pan of shakshuka. Eggs in tomato sauce, feta on top, bread on the side,
            cooked in a flat by someone with nowhere to go.
          </p>
          <p>
            It wasn&apos;t food photography. It was proof of life. Every day someone put up a plate and every day the
            rest of us saw it. It was the one place we could all still sit at the same table.
          </p>
        </div>

        <h2 className="mt-12 text-xl sm:text-2xl font-bold text-brand-ink">Then places opened again</h2>
        <div className="mt-6 space-y-5 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          <p>
            For about a year the story was just cooking. Somebody&apos;s shakshuka. Somebody&apos;s fourth go at bread.
            Whatever was in the fridge.
          </p>
          <p>Then places opened, and the plates started coming from somewhere you could actually go.</p>
          <p>That&apos;s when it started doing something we never asked it to.</p>
          <p>
            Someone would post a plate, and someone else would ask where it was. Not out of politeness. They wanted to
            go. And when they went, they didn&apos;t just go to the restaurant. They ordered the same dish.
          </p>
          <p>
            It kept happening for years. Nobody ever posted asking the group what they should get. It worked the other
            way round: you saw what somebody you actually knew had actually eaten, and you ordered that.
          </p>
        </div>

        <h2 className="mt-12 text-xl sm:text-2xl font-bold text-brand-ink">I did not see what that was</h2>
        <div className="mt-6 space-y-5 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          <p>It would be neat to say I spotted it and built it. I didn&apos;t.</p>
          <p>
            I built a food diary. That is genuinely what I thought I had. A good way to keep the meals. The calendar,
            the photo grid, a website about remembering. All of it pointing backwards. Years of it.
          </p>
          <p>The behaviour never changed. I was just slow to see what it was.</p>
          <p>
            What made me see it was sitting at that table watching four people fail at the exact thing my phone had been
            quietly doing for me for years, and not one of them knew it was possible. The thing we&apos;d built by
            accident answered a question nothing else did. It just wasn&apos;t the question we&apos;d been describing.
          </p>
        </div>

        <h2 className="mt-12 text-xl sm:text-2xl font-bold text-brand-ink">So this is what Makan is</h2>
        <div className="mt-6 space-y-5 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          <p>You save what you eat. Not to keep it. So the app learns what you&apos;d choose again.</p>
          <p>
            Eat or Yeet puts two of your own meals side by side and asks which you&apos;d order first. Your answers build
            a picture of your taste that nobody else can see.
          </p>
          <p>
            Then, at a menu, it starts with your own evidence. When your own evidence runs out, it goes to people you
            chose to trust.
          </p>
          <p>Which is the shared story, with the guessing taken out.</p>
        </div>

        <h2 className="mt-12 text-xl sm:text-2xl font-bold text-brand-ink">Where it is now</h2>
        <div className="mt-6 space-y-5 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          <p>
            Makan went live on 19 June 2026, with {mealCount.toLocaleString()} meals saved so far.
          </p>
          <p>
            Some of the people who started that story in lockdown are still on it. Same thing they were doing in 2020.
            Putting a plate up so somebody else knows what to order. It just has a name now.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10">
          <a
            href={APP_STORE_URL}
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand-orange px-7 text-sm font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
          >
            Start with your next meal
          </a>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            Makan is on iPhone today. Android is coming. Leave your email and we&apos;ll tell you the day it lands.
          </p>
        </div>

        {/* Press essentials */}
        <div className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">For press</h2>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-brand-muted">About Makan (copy-paste)</p>
          <p className="mt-2 text-[15px] leading-[1.75] text-brand-muted">{BOILERPLATE_LONG}</p>

          <p className="mt-6 text-[15px] text-brand-muted">
            Press contact:{" "}
            <a href={`mailto:${PRESS_EMAIL}`} className="text-brand-orange hover:underline">
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
      )}
      <Footer />
    </div>
  )
}
