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
      ? 'Semuanya bermula karena kami tidak bisa makan bersama. Makan adalah aplikasi yang kamu buka saat kamu tidak tahu mau pesan apa.'
      : "It started because we couldn't eat together. Makan is the app you open when you don't know what to order.",
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
// miniature: eat together -> the table -> what you ate -> on your own ->
// order again first -> never seen -> tasted -> with you -> holding the menu.
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
              meals since. And somewhere in there I noticed something odd about
              all of it.
            </p>
            <p>
              Most food apps help you pick a restaurant. They rank places, score
              them, take a thousand strangers&apos; opinions and turn them into
              one number out of five. Then you get there, sit down, open the
              menu — and you are completely{' '}
              <Emphasis variant="underline">on your own</Emphasis>. Twelve
              dishes. No idea. You order the safe thing, or you order what the
              table&apos;s having, and sometimes you get it wrong.
            </p>
            <p>
              Meanwhile a year goes by, you&apos;ve got a list of places you
              went to, and you cannot for the life of you remember{' '}
              <Emphasis variant="warm">what&nbsp;you&nbsp;ate</Emphasis> at any
              of them. Those two problems are the same problem. You can&apos;t
              use what you liked, because you never kept it.
            </p>
          </div>

          {/* Apex line — pulled out as the structural peak */}
          <p className="mt-14 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[34px]">
            Makan is the app you open when you don&apos;t know what to order.
          </p>

          <div className="mt-10 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              It works by remembering. Every meal you save is one more thing
              Makan knows about how you actually eat — not what you said in a
              review, what you chose on a Tuesday. Your meal isn&apos;t content.
              Choose Public or Friends Only when you save it.
            </p>
            <p>
              Then it asks you the only question that gets a straight answer. Two
              of your own meals, side by side:{' '}
              <Emphasis variant="warm">which would you order again first?</Emphasis>{' '}
              Not a score out of five. A choice. Answer enough of those and Makan
              knows something no review site does — not what strangers enjoyed,
              but what you would go back for.
            </p>
            <p>
              The meal that stays with you in five years probably isn&apos;t the
              one everyone queued for this week. Maybe it&apos;s a dinner you
              made at 11pm last Tuesday. Maybe it&apos;s a small restaurant
              nobody else seems to know about. The meal that{' '}
              <Emphasis variant="warm">mattered</Emphasis> beats the meal that{' '}
              <Emphasis variant="cool">trended</Emphasis>. Makan is built around
              that, because it is better evidence.
            </p>
          </div>

          {/* The hard case — cold start is the point, not the edge case */}
          <div className="mt-16">
            <p className="text-[15px] text-brand-ink/70">
              The hard part isn&apos;t the place you know.
            </p>

            <p className="mt-6 text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[32px]">
              It&apos;s the menu you&apos;ve{' '}
              <Emphasis variant="warm">never&nbsp;seen</Emphasis>.
            </p>

            <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              A restaurant you&apos;ve never been to is where every food app
              quietly gives up and shows you an average. Makan does the opposite:
              it looks at what you have chosen before, finds the thing on this
              menu closest to it, and tells you why it thinks so. If your own
              meals can&apos;t answer, it asks the people you chose to trust. And
              when nobody can answer honestly, it says that instead of guessing.
              &ldquo;Not enough yet&rdquo; is a real answer here.
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
                  That means more than a 4.6 from people who weren&apos;t there —
                  and it is the only thing worth basing a recommendation on.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  We tell you where a suggestion came from.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  Your own choice, a friend&apos;s, or something the restaurant
                  told us — never blurred into one word like
                  &ldquo;recommended&rdquo;. If we can&apos;t show our working,
                  we haven&apos;t earned the suggestion.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  Restaurants can&apos;t pay their way in.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  Not into your feed, and not into what we suggest you order. If
                  you see a place on Makan, it&apos;s because someone you know
                  ate there and remembered it.
                </p>
              </div>

              <div>
                <p className="text-brand-ink font-semibold">
                  Your record is yours.
                </p>
                <p className="mt-2 text-brand-ink/80 text-[17px] leading-relaxed">
                  We hold it for you. Change your mind and it changes what we
                  suggest. Delete it whenever you want.
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
              hungry as a kid. So it will never tell you a meal was good, write
              your memories for you, or invent an opinion you didn&apos;t have.
            </p>
            <p className="mt-5 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
              We are building one narrow thing, and only if you switch it on:
              spotting that two of your own photos are the same dish, so Makan
              can tell you that you have eaten this before. That is recognition,
              not judgement. The judgement stays with you, because you are the
              one who tasted it.
            </p>
          </div>

          {/* Gallery + closing */}
          <div className="mt-16 space-y-7 text-[17px] leading-relaxed text-brand-ink/85 sm:text-lg">
            <p>
              So Makan remembers how you&apos;ve eaten. The Tuesday night
              dinner. The long lunch in Lisbon that ran four hours. The kebab at
              2am after you got home. The first time someone cooked for you
              properly. The breakfast you ate alone the morning after. The meal
              you cooked the first night in a new flat. Every meal saved with
              what was happening around it. What you ate. Who was{' '}
              <Emphasis variant="warm">with&nbsp;you</Emphasis>. And all of it
              waiting for the next time you need it.
            </p>
          </div>

          {/* Closing peak */}
          <p className="mt-14 text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] text-brand-ink sm:text-[28px]">
            You remember who was at the table. You can never remember what you
            actually ate — so every new menu starts you back at zero.{' '}
            <span className="text-brand-orange">
              That&apos;s the gap Makan fills.
            </span>
          </p>

          <p className="mt-10 text-[16px] italic leading-relaxed text-brand-ink/70">
            If you&apos;ve ever sat down, read the whole menu twice, and ordered
            the safe thing anyway — you&apos;ll get it.
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
