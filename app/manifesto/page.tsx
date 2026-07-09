import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Manifesto — Makan',
  description:
    "You'll forget today's best meal by Friday. Makan won't. The food diary you keep with your friends.",
  openGraph: {
    title: 'Makan — Manifesto',
    description:
      "You'll forget today's best meal by Friday. Makan won't. The food diary you keep with your friends.",
    type: 'article',
  },
}

// The full manifesto. Long-form essay; kept as a static server component
// so it ships as plain HTML with no client JS. Animations belong on the
// homepage hero — this surface is for reading, not for moving.
export default function ManifestoPage() {
  return (
    <>
      <Navbar />
      <main className="bg-brand-cream min-h-screen text-brand-ink">
        <article className="mx-auto max-w-[680px] px-5 pb-24 pt-32 sm:px-8 sm:pb-32 sm:pt-40">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">
            Manifesto
          </p>

          <h1
            className="mt-6 text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-brand-ink sm:text-[52px] lg:text-[64px]"
          >
            You&apos;ll forget today&apos;s best meal by Friday. Makan won&apos;t.
          </h1>

          {/* Opening — origin and founding observation */}
          <div className="mt-14 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              Makan started during COVID. I couldn&apos;t see my friends, so a
              few of us started a Snapchat story to stay in touch. We&apos;d
              post photos of dinner, breakfast, takeout, whatever we were
              eating. It grew to over 300 people without us trying. When you
              can&apos;t share a table, the photo of the meal kind of becomes
              the table.
            </p>
            <p>
              That was six years ago. We&apos;ve sent each other thousands of
              meals since. At some point it stopped feeling like a story and
              started feeling like a record. So we built an app around it.
            </p>
            <p>
              Most food apps are about deciding where to eat next. They rank
              restaurants. They score them. They take a thousand strangers&apos;
              opinions and turn them into one number out of five, and once
              you&apos;ve eaten, they ask you to do the same. A year goes by,
              you&apos;ve got a list of places you went to, and you cannot for
              the life of you remember what you ate at any of them.
            </p>
          </div>

          {/* Apex line — pulled out as the structural peak */}
          <p className="mt-14 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[34px]">
            Makan is the other thing. It&apos;s the record of what you ate.
          </p>

          <div className="mt-10 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              Your meal isn&apos;t content. Only your friends see it unless you
              say otherwise. It&apos;s a food diary, basically. The kind that
              remembers what you&apos;d otherwise forget.
            </p>
            <p>
              Here&apos;s the thing that gets me. The meal that stays with you
              in five years probably isn&apos;t the one everyone was queuing for
              this week. Maybe it&apos;s a dinner you made at 11pm last Tuesday.
              Maybe it&apos;s a small restaurant nobody else seems to know
              about. The meal that mattered always beats the meal that trended.
              Makan is built around that.
            </p>
          </div>

          {/* Commitments — visually elevated with a saffron left rule */}
          <div className="mt-16">
            <p className="text-[15px] text-brand-ink/70">
              A few things we won&apos;t do, because they&apos;d defeat the point.
            </p>

            <div className="mt-8 space-y-7 border-l-2 border-brand-orange pl-5 sm:pl-7">
              <div>
                <p className="text-brand-ink font-semibold">
                  No star ratings. No averages from strangers.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  A meal isn&apos;t 4.2 out of 5. The rankings we show are
                  personal. Yours, and your friends&apos;. When a friend posts a
                  meal, you&apos;ll see if it&apos;s their #3 of all time, no
                  matter where they ate it. That tells you more than a 4.6
                  average from strangers ever could.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  Your home feed isn&apos;t sorted by what&apos;s popular.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  It&apos;s your friends, in the order their meals happened.
                  Nothing jumps to the top just because it has more likes.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  Restaurants can&apos;t pay to be in your feed.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  If you see a place on Makan, it&apos;s because someone you
                  know actually ate there and remembered it.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  Your record is yours.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  We hold it for you. You can delete it whenever. If Makan ever
                  shuts down, we&apos;ll send you your record before we go.
                </p>
              </div>
            </div>
          </div>

          {/* AI peak — separated section with its own setup */}
          <div className="mt-16">
            <p className="text-[15px] text-brand-ink/70">
              And one more, that matters more every year.
            </p>

            <p className="mt-6 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[32px]">
              AI has never tasted food.
            </p>

            <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              It can&apos;t smell, can&apos;t chew, can&apos;t remember being
              hungry as a kid. So it won&apos;t write your meals on Makan,
              generate your recipes, or guess what you ate from a photo. The
              point of remembering what you ate is that you tasted it. AI never
              has.
            </p>
          </div>

          {/* Gallery + closing */}
          <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              What Makan does do is help you remember how you&apos;ve eaten.
              The Tuesday night dinner. The long lunch in Lisbon that ran four
              hours. The kebab at 2am after you got home. The first time your
              kid cooked you something. The breakfast you ate alone the morning
              after. The meal you cooked the first night in a new flat. Every
              meal gets saved with what was happening around it. What you ate.
              Who was with you.
            </p>
          </div>

          {/* Closing peak */}
          <p className="mt-14 text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[28px]">
            You remember who was at the table. You can never remember what you
            actually ate. <span className="text-brand-orange">That&apos;s the gap Makan fills.</span>
          </p>

          <p className="mt-10 text-[16px] italic leading-relaxed text-brand-ink/70">
            If you&apos;ve ever tried to remember a meal and couldn&apos;t,
            you&apos;ll get it.
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
      <Footer />
    </>
  )
}
