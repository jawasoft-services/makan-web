export type MenuEntry = {
  name: string
  description?: string
  price: string
  /** Dietary markers as printed, e.g. "VG GF". */
  diet?: string
}

/**
 * One printed menu line. Prices are right-aligned and tabular; cafés that
 * describe their dishes do not use dot leaders — those are a fine-dining
 * convention for undescribed items.
 */
export default function MenuItem({ name, description, price, diet }: MenuEntry) {
  return (
    <li className="mb-[0.8em] list-none">
      <div className="flex items-baseline justify-between gap-5">
        <span className="text-[1.05rem] font-semibold text-brand-ink">
          {name}
          {diet ? (
            <span className="ml-1.5 text-[0.6rem] font-bold tracking-[0.1em] text-brand-muted opacity-75">
              {diet}
            </span>
          ) : null}
        </span>
        <span className="text-[0.95rem] font-semibold tabular-nums text-brand-muted">
          {price}
        </span>
      </div>
      {description ? (
        <p className="mt-[0.16em] max-w-[88%] text-[0.8rem] leading-[1.42] text-brand-muted">
          {description}
        </p>
      ) : null}
    </li>
  )
}
