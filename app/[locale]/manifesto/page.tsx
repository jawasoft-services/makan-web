import type { Metadata } from 'next'
import SiteSchema from "@/components/SiteSchema"
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { Emphasis } from '@/components/Emphasis'
import { createPageMetadata } from '@/lib/site-metadata'
import ManifestoIndonesian from './ManifestoIndonesian'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isIndonesian = locale === 'id'
  return createPageMetadata({
    title: 'Manifesto — Makan',
    description: isIndonesian
      ? 'Kamu duduk. Menunya datang. Kamu bingung mau makan apa. Makan itu buat saat ini.'
      : "You sit down. The menu comes. You have no idea what to order. Makan is for right then.",
    path: isIndonesian ? '/id/manifesto' : '/manifesto',
    type: 'article',
    locale,
  })
}

// The manifesto, told as ONE STORY that travels through a single meal:
// you sit down -> the menu comes -> you have to choose -> Makan answers ->
// where that answer came from -> when it can't answer -> the food arrives ->
// you eat, and that feeds the next choice -> what AI will and won't do ->
// where this began -> you walk out -> next time you sit down somewhere new.
//
// Every capability is explained at the point IN THE MEAL where it happens,
// rather than in a section of its own. Plain words only, short sentences,
// readable by a ten-year-old on the first pass. No strategy language, and no
// bulleted promise list — a list interrupts a story.
//
// The only client code is <Emphasis>, a leaf that lets load-bearing phrases
// "ignite" into saffron as the reader reaches them — reduced-motion viewers
// and crawlers get the finished emphasis statically. Read the emphasised
// words alone and you get the story in miniature: no idea -> at the table ->
// order again first -> say so -> tasted -> for this -> starting from nothing.
export default async function ManifestoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <SiteSchema locale={locale} />
      {locale === 'id' ? (
        <ManifestoIndonesian />
      ) : (
      <main id="main-content" className="bg-brand-cream min-h-screen text-brand-ink">
        <article className="mx-auto max-w-[680px] px-5 pb-24 pt-32 sm:px-8 sm:pb-32 sm:pt-40">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">
            Manifesto
          </p>

          {/* Beginning of the meal: sitting down. */}
          <h1
            className="mt-6 text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-brand-ink sm:text-[52px] lg:text-[64px]"
          >
            You sit down. The menu comes. You have{' '}
            <Emphasis variant="warm" trigger="load">no&nbsp;idea</Emphasis>.
          </h1>

          <div className="mt-12 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p className="text-[19px] font-medium text-brand-ink sm:text-xl">
              Makan is for right then.
            </p>
            <p>
              Every other food app helped you get this far. They rank places.
              Four and a half stars, two thousand reviews, so you came. Good.
              But now you are sitting down, there are twenty things on the menu,
              and not one of those stars tells you which one to eat.
            </p>
            <p>
              So you do what everybody does. You pick the safe thing. Or you
              copy your friend. And sometimes the plate arrives and you know
              straight away that you should have had what she ordered.
            </p>
            <p className="text-[19px] font-medium text-brand-ink sm:text-xl">
              Makan starts here.{' '}
              <Emphasis variant="warm">At&nbsp;the&nbsp;table</Emphasis>, with
              the menu open.
            </p>
          </div>

          {/* The choice: what Makan actually says. */}
          <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              It looks at what you have eaten before. Not what you said about
              it. What you really chose, and ate, and finished.
            </p>
            <p>
              Then it looks at this menu and finds the thing closest to what you
              already love. And it tells you why. You picked the grilled one
              over the fried one, four times out of five. You can argue with
              that. You should be able to.
            </p>
          </div>

          {/* Where the answer comes from. */}
          <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              All of that comes from something small. Every time you eat
              something, you save it. A photo. Where you were. That is it.
            </p>
            <p>
              Later, Makan shows you two of your own meals and asks one
              question:{' '}
              <Emphasis variant="warm">which would you order again first?</Emphasis>
            </p>
            <p>
              No stars. No score. Just pick one. Do that a few times and Makan
              knows something no review site can ever know. Not what a crowd
              liked. What you go back for.
            </p>
          </div>

          {/* When it can't answer. */}
          <div className="mt-16 rounded-2xl border border-brand-line bg-white/40 p-6 sm:p-8">
            <p className="text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[26px]">
              Sometimes it will not know.
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              Maybe nobody has eaten here yet. Maybe nothing you have saved is
              anything like this menu. When that happens Makan will{' '}
              <Emphasis variant="warm">say&nbsp;so</Emphasis>, and tell you
              which of the two it is. Then you can ask the waiter, or just order
              what you fancy.
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              It will not pretend. A guess dressed up as an answer is worse than
              no answer, because you only find out when the food is already in
              front of you.
            </p>
          </div>

          {/* The food arrives. This is the turn: the meal feeds the next one. */}
          <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>Then the food comes, and you eat it.</p>
            <p>
              That is the good part, and not only because you are hungry. You
              just learned something. Save it, and next time Makan can hold it
              up against something else and ask you which one you would go back
              to.
            </p>
          </div>

          {/* The AI line, plainly. Describes what recognition does without
              promising a switch either way — the consent design is still open,
              so this states only what is true today. */}
          <div className="mt-16">
            <p className="mt-6 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[32px]">
              AI has never <Emphasis variant="warm">tasted</Emphasis> food.
            </p>

            <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              It cannot smell. It cannot chew. It does not remember being hungry
              as a kid. So it will never tell you a dish is good, never write
              your memories for you, never make up an opinion you did not have.
              Tasting is the human bit, and it stays yours.
            </p>
            <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              What it does is recognise. It can see that two of your own photos
              are the same dish, so Makan can tell you: you have eaten this
              before, and here is what you thought of it. Your photos, nobody
              else&apos;s. Recognising, not judging.
            </p>
          </div>

          {/* Where it began — late, as proof, told simply. */}
          <div className="mt-16 border-t border-brand-line pt-12">
            <p className="text-[15px] text-brand-ink/70">
              None of this came out of a meeting.
            </p>

            <div className="mt-6 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              <p>
                It started in COVID. I could not see my friends, so a few of us
                made a Snapchat story and posted our dinners. Breakfast. Nasi
                bungkus on the way home. Three hundred people joined without us
                asking anyone.
              </p>
              <p>
                Six years. Thousands of meals. And here is what we learned from
                it.
              </p>
              <p>
                We had all of it saved. We could scroll back and see exactly
                what each of us went back for. But every time one of us sat down
                somewhere new, none of it helped. We stared at the menu and
                ordered the safe thing anyway.
              </p>
              <p>
                Keeping the meals was never the point. The meals were{' '}
                <Emphasis variant="warm">for&nbsp;this</Emphasis>.
              </p>
              <p>
                So if you already use Makan to remember your food, nothing is
                going away. Your meals are still yours, still private unless you
                share them. They just have a job now.
              </p>
            </div>
          </div>

          {/* End of the meal, and the loop closes on the next one. */}
          <p className="mt-14 text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[28px]">
            You finish. You pay. You walk out. And the next time you sit down
            somewhere new and somebody hands you a menu,{' '}
            <span className="text-brand-orange">
              you will not be{' '}
              <Emphasis variant="warm">starting&nbsp;from&nbsp;nothing</Emphasis>.
            </span>
          </p>

          <p className="mt-10 text-[16px] italic leading-relaxed text-brand-ink/70">
            If you have ever read a menu twice and still ordered the safe thing,
            this is for you.
          </p>

          {/* Signature + back link */}
          <div className="mt-16 flex items-center justify-between border-t border-white/15 pt-8">
            <p className="text-[15px] text-brand-ink/70">— Devon</p>
            <Link
              href="/"
              className="text-[13px] text-brand-ink/60 underline-offset-4 transition-colors hover:text-brand-orange hover:underline"
            >
              Back to Makan →
            </Link>
          </div>
        </article>
      </main>
      )}
      <Footer />
    </>
  )
}
