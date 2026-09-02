import MenuItem, { type MenuEntry } from "./MenuItem"

export type MenuSection = { heading: string; items: MenuEntry[] }

type MenuSheetProps = {
  house: string
  meta: string
  sections: MenuSection[]
  /** The tax-and-service line. Printed menus in Bali always carry one. */
  legal: string
  className?: string
}

/**
 * A printed menu. It is an artefact on the page, not part of the document
 * outline: the house name and section names are styled text, never headings,
 * so the story's own headings keep a clean H1 → H2 order around it.
 */
export default function MenuSheet({
  house,
  meta,
  sections,
  legal,
  className = "",
}: MenuSheetProps) {
  return (
    <div className={className}>
      <header className="mb-[1.6em] text-center">
        <p className="text-[1.3rem] font-bold uppercase tracking-[0.3em] text-brand-ink">
          {house}
        </p>
        <div className="mx-auto my-[0.75em] h-px w-[3.4em] bg-brand-muted opacity-50" />
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand-muted">
          {meta}
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.heading}>
          <div className="mb-[0.78em] mt-[1.3em] flex items-center gap-[0.8em] first:mt-0">
            <span className="whitespace-nowrap text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brand-muted">
              {section.heading}
            </span>
            <span aria-hidden className="h-px flex-1 bg-brand-muted/30" />
          </div>
          <ul>
            {section.items.map((item) => (
              <MenuItem key={`${section.heading}-${item.name}`} {...item} />
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-[1.35em] border-t border-brand-muted/30 pt-[0.95em] text-center text-[0.62rem] leading-[1.6] text-brand-muted">
        {legal}
      </p>
    </div>
  )
}
