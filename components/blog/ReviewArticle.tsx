import Link from "next/link"
import type { ReactNode } from "react"
import type { Block, Review } from "@/lib/reviews/types"
import { MealGallery } from "./MealGallery"

// Minimal inline renderer: supports [text](url) links and **bold** inside body strings.
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined && m[2] !== undefined) {
      out.push(
        <Link
          key={key++}
          href={m[2]}
          className="text-brand-orange underline underline-offset-2 hover:opacity-80"
        >
          {m[1]}
        </Link>,
      )
    } else if (m[3] !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold text-white">
          {m[3]}
        </strong>,
      )
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function QuickFacts({ review }: { review: Review }) {
  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
      <table className="w-full text-sm">
        <tbody>
          {review.quickFacts.map((f, i) => (
            <tr key={i} className="border-b border-brand-border last:border-0">
              <th scope="row" className="w-2/5 px-4 py-3 text-left align-top font-semibold text-brand-muted">
                {f.label}
              </th>
              <td className="px-4 py-3 text-brand-text/90">{f.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BillTable({ review }: { review: Review }) {
  const { bill } = review
  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
      <table className="w-full text-sm">
        <caption className="sr-only">Itemised bill for two at Kendal Street Kitchen</caption>
        <tbody>
          {bill.lines.map((l, i) => (
            <tr key={i} className="border-b border-brand-border">
              <td className="px-4 py-2.5 text-brand-text/85">{l.item}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-brand-text/85">{l.price}</td>
            </tr>
          ))}
          <tr className="border-b border-brand-border">
            <td className="px-4 py-2.5 font-semibold text-white">Subtotal</td>
            <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-white">{bill.subtotal}</td>
          </tr>
          <tr className="border-b border-brand-border">
            <td className="px-4 py-2.5 text-brand-muted">{bill.serviceLabel}</td>
            <td className="px-4 py-2.5 text-right tabular-nums text-brand-muted">{bill.service}</td>
          </tr>
          <tr>
            <td className="px-4 py-3 font-bold text-brand-orange">
              Total · {bill.covers} covers ({bill.perHead}pp)
            </td>
            <td className="px-4 py-3 text-right font-bold tabular-nums text-brand-orange">{bill.total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Faq({ review }: { review: Review }) {
  return (
    <section className="my-10" aria-label="Frequently asked questions">
      <h2 className="mb-5 text-2xl font-bold tracking-tight text-white">Kendal Street Kitchen: quick questions</h2>
      <div className="space-y-5">
        {review.faq.map((f, i) => (
          <div key={i}>
            <h3 className="text-base font-semibold text-white">{f.q}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-brand-text/80">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Cta() {
  return (
    <div className="my-10 rounded-2xl border-2 border-brand-orange/40 bg-brand-surface p-6 text-center">
      <p className="text-lg font-bold text-white">Remember your own meals</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-brand-muted">
        Makan is a food journal for the meals that matter — in beta now.
      </p>
      <Link
        href="/app"
        className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-brand-orange px-7 text-sm font-semibold text-brand-bg transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
      >
        Get Makan
      </Link>
    </div>
  )
}

function BlockView({ block, review }: { block: Block; review: Review }) {
  switch (block.kind) {
    case "lead":
      return <p className="my-5 text-lg leading-[1.7] text-brand-text/90">{renderInline(block.text)}</p>
    case "p":
      return (
        <p className="my-5 text-[16px] leading-[1.75] text-brand-text/85 sm:text-[17px]">
          {renderInline(block.text)}
        </p>
      )
    case "h2":
      return <h2 className="mt-12 mb-4 text-2xl font-bold tracking-tight text-white">{block.text}</h2>
    case "ul":
      return (
        <ul className="my-5 list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-brand-text/85 marker:text-brand-orange">
          {block.items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>
      )
    case "note":
      return (
        <p className="my-8 border-l-2 border-brand-orange pl-4 text-[15px] italic leading-relaxed text-brand-muted">
          {renderInline(block.text)}
        </p>
      )
    case "quickFacts":
      return <QuickFacts review={review} />
    case "bill":
      return <BillTable review={review} />
    case "meals":
      return <MealGallery meals={review.meals} />
    case "faq":
      return <Faq review={review} />
    case "cta":
      return <Cta />
  }
}

export function ReviewArticle({ review }: { review: Review }) {
  const visit = new Date(review.visitDate)
  return (
    <article className="mx-auto max-w-2xl px-5 pt-28 pb-16 sm:px-8">
      <header className="mb-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Restaurant review</p>
        <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-[2.6rem]">
          {review.h1}
        </h1>
        <p className="mt-4 text-lg text-brand-muted">{review.dek}</p>
        <p className="mt-6 text-sm text-brand-dim">
          By{" "}
          <Link href={review.author.url} className="text-brand-orange">
            {review.author.name}
          </Link>
          , {review.author.role}
          {" · "}
          <time dateTime={review.visitDate}>
            Visited{" "}
            {visit.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </time>
          {" · "}
          <span aria-label={`Rated ${review.rating} out of 5 on this visit`}>{review.rating}/5</span>
        </p>
      </header>
      {review.blocks.map((b, i) => (
        <BlockView key={i} block={b} review={review} />
      ))}
    </article>
  )
}
