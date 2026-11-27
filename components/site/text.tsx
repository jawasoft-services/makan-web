import type { ReactNode } from 'react'

/** A sentinel that never occurs in copy, passed as an ICU argument so a value can be swapped for markup in any word order. */
export const SLOT = '⁣'

/** Splits a translated sentence at SLOT and puts `node` there (once), e.g. a counting number in bold. */
export function withSlot(text: string, node: ReactNode): ReactNode {
  const at = text.indexOf(SLOT)
  if (at < 0) return text
  return <>{text.slice(0, at)}{node}{text.slice(at + SLOT.length)}</>
}

/** `<em>` inside a rich message: the orange words of a big serif heading. */
export const em = (chunks: ReactNode) => <em>{chunks}</em>
