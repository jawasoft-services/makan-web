import type { Metadata } from 'next'
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
      ? 'Kamu pegang menunya dan bingung mau makan apa. Makan adalah aplikasi yang kamu buka saat itu.'
      : "You're holding the menu and you have no idea. Makan is the app you open then.",
    path: isIndonesian ? '/id/manifesto' : '/manifesto',
    type: 'article',
    locale,
  })
}

// The full manifesto. A server component: it ships the complete essay as plain
// HTML (nothing is hidden behind JS). The only client code is <Emphasis>, a
// leaf that lets a few load-bearing phrases "ignite" into saffron as the reader
// reaches them — reduced-motion viewers and crawlers get the finished emphasis
// statically.
//
// Structure is deliberate and evidence-led. Reading research (Nielsen: ~20-28%
// of words read; Chartbeat: viewership peaks ~550px, ~half reach 1500px) means
// the argument has to be COMPLETE before the fold and a half. So the order is:
// the reader's moment -> what Makan is -> the gap other apps leave -> how it
// answers -> what it refuses to do -> and only THEN the origin story, which
// works as proof rather than as an opening. Everything abstract is cashed out
// into a concrete scene, which is the best-evidenced persuasion lever we have.
//
// Emphasis chain, read alone, is the manifesto in miniature: no idea -> where
// they stop -> order again first -> never been here -> say so -> tasted ->
// six years -> remember.
export default async function ManifestoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      {locale === 'id' ? (
        <ManifestoIndonesian />
      ) : (
      <main id="main-content" className="bg-brand-cream min-h-screen text-brand-ink">
        <article className="mx-auto max-w-[680px] px-5 pb-24 pt-32 sm:px-8 sm:pb-32 sm:pt-40">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">
            Manifesto
          </p>

          {/* The moment, as the opening move. Not history, not a belief in the
              abstract — the scene the reader has actually been in. */}
          <h1
            className="mt-6 text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-brand-ink sm:text-[52px] lg:text-[64px]"
          >
            You&apos;re holding the menu and you have{' '}
            <Emphasis variant="warm" trigger="load">no&nbsp;idea</Emphasis>.
          </h1>

          <div className="mt-12 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p className="text-[19px] font-medium text-brand-ink sm:text-xl">
              Makan is the app you open then. That is the whole idea. Everything
              else it does is in service of the ninety seconds between sitting
              down and telling someone what you want.
            </p>
            <p>
              Every food app is good at one job: helping you pick a place. Stars
              do that. Four and a half, two thousand reviews, you get in the car.
              Then you sit down, the menu arrives, and none of it helps. Nobody
              rated the rendang against the ayam bakar. Nobody knew you don&apos;t
              much like coriander. The apps got you through the door and stopped
              at the table, which is exactly where the actual decision happens.
            </p>
            <p>
              So you do what everyone does. You order the safe thing. Or you copy
              whoever ordered first. And sometimes the food arrives and you know,
              one bite in, that you chose wrong and the meal is spent.
            </p>
            <p className="text-[19px] font-medium text-brand-ink sm:text-xl">
              Makan starts where{' '}
              <Emphasis variant="warm">they&nbsp;stop</Emphasis>.
            </p>
          </div>

          {/* How it works. Concrete mechanism, no mystique. */}
          <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              It works from what you have already eaten. Every meal you save is
              one more real thing Makan knows about you — not an opinion you
              typed, a dish you actually chose on a Tuesday and finished.
            </p>
            <p>
              Then it asks the only question that gets an honest answer. Two of
              your own meals, side by side:{' '}
              <Emphasis variant="warm">which would you order again first?</Emphasis>{' '}
              Not a score out of five. A choice, the same shape as the one
              you&apos;ll make at the table. Answer a few dozen of those and
              Makan knows something no review site can know — not what a crowd
              enjoyed, but what you personally go back for.
            </p>
            <p>
              Most of the time you are somewhere{' '}
              <Emphasis variant="warm">you&apos;ve&nbsp;never&nbsp;been</Emphasis>,
              and that is the case Makan is built for, not the exception it
              tolerates. It takes what you have chosen before, finds the closest
              thing on this menu, and tells you which and why: because you
              picked the grilled one over the fried one, four times out of five.
              You can disagree with the reasoning, which is the point of showing
              it.
            </p>
          </div>

          {/* The honesty promise. Specific and literally keepable — a vague
              "we might be wrong" measurably lowers confidence; naming WHICH
              kind of thin evidence is what earns trust. */}
          <div className="mt-16 rounded-2xl border border-brand-line bg-white/40 p-6 sm:p-8">
            <p className="text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[26px]">
              And sometimes it won&apos;t know.
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              Too few people have eaten here, or nothing you&apos;ve saved is
              close enough to what&apos;s on this menu. When that happens Makan
              will <Emphasis variant="warm">say&nbsp;so</Emphasis>, and say which
              of the two it is, so you know whether to ask the waiter or just
              order what you fancy. It will not dress a guess up as an answer.
              A recommendation you can&apos;t trust is worse than no
              recommendation, because you only find out at the table.
            </p>
          </div>

          {/* Commitments. Each abstract value cashed out into a concrete
              practice — the strongest evidenced persuasion lever. */}
          <div className="mt-16">
            <p className="text-[15px] text-brand-ink/70">
              Four things we won&apos;t do, because each one would quietly break
              the promise above.
            </p>

            <div className="mt-8 space-y-7 border-l-2 border-brand-orange pl-5 sm:pl-7">
              <div>
                <p className="text-brand-ink font-semibold">
                  No dish will ever have a score out of five.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  A 4.6 is a thousand strangers with a thousand different
                  appetites flattened into one number that describes none of
                  them. The only ranking on Makan is yours: your meals, held
                  against each other, until the order is one you actually
                  believe. Your third-favourite meal ever might be something
                  your mum made you when you were nine. No aggregate will ever
                  find that.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  We always say where a suggestion came from.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  Your own choices, a friend&apos;s, or something the restaurant
                  told us — labelled, never blended into the word
                  &ldquo;recommended&rdquo;. If we can&apos;t show you the
                  working, we haven&apos;t earned the suggestion, and we&apos;d
                  rather show you a thin reason than hide it.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  No restaurant can buy its way into what you order.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  Not the suggestion, not the feed, not a nudge, not a
                  &ldquo;featured&rdquo; slot. The moment a kitchen can pay to
                  change what we tell you to eat, nothing else on this page is
                  worth reading.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  Change your mind and the advice changes with it.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  Every meal you save is yours. Delete one and it stops counting
                  towards what we suggest. Delete all of it and Makan forgets
                  what it worked out about you, because a record you can&apos;t
                  take back isn&apos;t really yours.
                </p>
              </div>
            </div>
          </div>

          {/* The AI line. Framed as a deliberate boundary rather than an
              apology: a flaw-confession measurably backfires on an attentive
              reader, while a stated design limit reads as competence. */}
          <div className="mt-16">
            <p className="mt-6 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[32px]">
              AI has never <Emphasis variant="warm">tasted</Emphasis> food.
            </p>

            <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              It can&apos;t smell, can&apos;t chew, can&apos;t remember being
              hungry as a child. So we drew the line where the line honestly
              falls: it will never tell you a dish is good, never write your
              memories for you, never invent an opinion you didn&apos;t have.
              Taste is the one thing here that has to be human, and it&apos;s
              yours.
            </p>
            <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              There is one narrow job we are building, and only if you switch it
              on: noticing that two of your own photos show the same dish, so
              Makan can tell you that you have eaten this before and what you
              thought last time. Recognising, not judging. Your photos, not
              anyone else&apos;s. Switch it off and what it worked out goes with
              it.
            </p>
          </div>

          {/* Origin story — LAST, as proof. Research is consistent that history
              belongs after the belief: a first-time reader has no reason to care
              who founded us until they share the claim. Here it substantiates
              the claim instead of delaying it. */}
          <div className="mt-16 border-t border-brand-line pt-12">
            <p className="text-[15px] text-brand-ink/70">
              None of this came out of a strategy meeting.
            </p>

            <div className="mt-6 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              <p>
                Makan started during COVID. I couldn&apos;t see my friends, so a
                few of us opened a Snapchat story and posted what we were eating
                — dinner, breakfast, nasi bungkus on the way home. It grew past
                300 people without us trying. When you can&apos;t share a table,
                the photo of the meal becomes the table.
              </p>
              <p>
                That was{' '}
                <Emphasis variant="warm">six&nbsp;years</Emphasis> and thousands
                of meals ago, and it taught us the thing this whole app rests
                on. We had the record. We could scroll back and see exactly what
                each of us went back for. And every time one of us sat down in a
                restaurant we&apos;d never been to, all of it just sat there,
                unused, while we squinted at a menu and ordered the safe thing
                anyway.
              </p>
              <p>
                The record was never the point. It was the raw material for a
                decision nobody was helping us make.
              </p>
              <p>
                So if you already use Makan to remember meals: nothing is being
                taken away. Your diary is still yours, still private unless you
                share it, still the same photos and captions. It has just been
                given the job it was always the evidence for.
              </p>
            </div>
          </div>

          {/* Close */}
          <p className="mt-14 text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[28px]">
            You have maybe twenty thousand meals left in your life.{' '}
            <span className="text-brand-orange">
              Order something you&apos;ll <Emphasis variant="warm">remember</Emphasis>.
            </span>
          </p>

          <p className="mt-10 text-[16px] italic leading-relaxed text-brand-ink/70">
            If you&apos;ve ever read a menu twice and still ordered the safe
            thing, you already know what this is for.
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
