/**
 * Level names are taken verbatim from RM19665 so the website and the app
 * describe the same six states with the same words.
 */
export type DecisionEvidenceLevel =
  | "personal_taste"
  | "trusted_person"
  | "maitred_menu"
  | "community_evidence"
  | "restaurant_provided"
  | "insufficient"

/**
 * The saffron grammar. Saffron drains as the evidence thins, and the
 * restaurant's own words carry none at all — Makan did not say them.
 */
export type MarkForm = "solid" | "rule" | "dot" | "ink" | "none"

const MARK_FORMS: Record<DecisionEvidenceLevel, MarkForm> = {
  personal_taste: "solid",
  trusted_person: "rule",
  maitred_menu: "rule",
  community_evidence: "dot",
  restaurant_provided: "ink",
  insufficient: "none",
}

export function markFormFor(level: DecisionEvidenceLevel): MarkForm {
  return MARK_FORMS[level]
}

export const MARK_CLASSES: Record<MarkForm, string> = {
  solid: "rounded-full bg-brand-orange px-[0.85em] py-[0.45em] text-white",
  rule: "border-b-2 border-brand-orange pb-[0.42em] text-brand-orange",
  dot: "text-brand-orange before:mr-[0.6em] before:align-[0.12em] before:text-[0.7em] before:content-['●']",
  ink: "rounded-full border border-brand-muted/35 px-[0.8em] py-[0.4em] text-brand-muted",
  none: "hidden",
}
