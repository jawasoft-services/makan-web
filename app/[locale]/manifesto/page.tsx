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
      ? 'Semuanya bermula karena kami tidak bisa makan bersama. Makan adalah catatan tentang apa yang kamu makan dan siapa yang ada bersamamu.'
      : "It started because we couldn't eat together. Makan is the record of what you ate — the food diary you keep with your friends.",
    path: isIndonesian ? '/id/manifesto' : '/manifesto',
    type: 'article',
    locale,
  })
}

// The full manifesto. A server component: it ships the complete essay as plain
// HTML (nothing is hidden behind JS). The only client code is <Emphasis>, a
// leaf that lets a few load-bearing phrases "ignite" into saffron as the reader
// reaches them — reduced-motion viewers and crawlers get the finished emphasis
// statically. Read only the emphasised words and you get the manifesto in
// miniature: eat together -> the table -> remember what you ate -> otherwise
// forget -> mattered/trended -> tasted -> with you -> that's the gap Makan fills.
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

          <h1
            className="mt-6 text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-brand-ink sm:text-[52px] lg:text-[64px]"
          >
            It started because we couldn&apos;t{' '}
            <Emphasis variant="warm" trigger="load">eat&nbsp;together</Emphasis>.
          </h1>

          {/* Opening — origin and founding observation */}
          <div className="mt-14 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              Makan started during COVID. I couldn&apos;t see my friends, so a
              few of us started a Snapchat story to stay in touch. We&apos;d
              post photos of dinner, breakfast, takeout, whatever we were
              eating. It grew to over 300 people without us trying. When you
              can&apos;t share a table, the photo of the meal becomes{' '}
              <Emphasis variant="warm">the&nbsp;table</Emphasis>.
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
              the life of you{' '}
              <Emphasis variant="underline">remember what you ate</Emphasis> at
              any of them.
            </p>
          </div>

          {/* Apex line — pulled out as the structural peak */}
          <p className="mt-14 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[34px]">
            Makan is the opposite. It&apos;s the record of what you ate.
          </p>

          <div className="mt-10 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              Your meal isn&apos;t content. Choose Public or Friends Only when
              you post. It&apos;s a food diary — the kind that remembers
              what you&apos;d <Emphasis variant="warm">otherwise&nbsp;forget</Emphasis>.
            </p>
            <p>
              The meal that stays with you in five years probably isn&apos;t the
              one everyone queued for this week. Maybe it&apos;s a dinner you
              made at 11pm last Tuesday. Maybe it&apos;s a small restaurant
              nobody else seems to know about. The meal that{' '}
              <Emphasis variant="warm">mattered</Emphasis> beats the meal that{' '}
              <Emphasis variant="cool">trended</Emphasis>. Makan is built around
              that.
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
                  A meal isn&apos;t 4.2 out of 5.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  No stars. No averages deciding what was good. The only ranking
                  on Makan is your own: your meals, held up against each other,
                  until the order is one you actually believe. Your #3 of all
                  time might be the same dish your mum made for you as a kid.
                  That means more than a 4.6 from people who weren&apos;t there.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  Your feed isn&apos;t sorted by what&apos;s popular.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  Your friends, in the order they posted. There&apos;s a public
                  feed if you want to see past them, and it works the same way.
                  Nothing jumps the queue for having more likes.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  Restaurants can&apos;t pay their way into your feed.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  If you see a place on Makan, it&apos;s because someone you
                  know ate there and remembered it.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  Your record is yours.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  We hold it for you. You can delete it whenever you want.
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
              AI has never <Emphasis variant="warm">tasted</Emphasis> food.
            </p>

            <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              It can&apos;t smell, can&apos;t chew, can&apos;t remember being
              hungry as a kid. So it won&apos;t write your meals, generate your
              recipes, or guess what you ate from a photo. The point of
              remembering what you ate is that you tasted it. AI never has.
            </p>
          </div>

          {/* Gallery + closing */}
          <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              What Makan does is help you remember how you&apos;ve eaten.
              The Tuesday night dinner. The long lunch in Lisbon that ran four
              hours. The kebab at 2am after you got home. The first time someone
              cooked for you properly. The breakfast you ate alone the morning
              after. The meal you cooked the first night in a new flat. Every
              meal saved with what was happening around it. What you ate. Who
              was <Emphasis variant="warm">with&nbsp;you</Emphasis>.
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
      )}
      <Footer />
    </>
  )
}
