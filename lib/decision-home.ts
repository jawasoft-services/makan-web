/**
 * The decision-first homepage ships by default. Set DECISION_HOME=0 to fall
 * back to the legacy home (kept only as an escape hatch until its sections
 * are retired). One read, so every gated surface flips together: the page,
 * its metadata, the share cards, the app page description, llms.txt.
 */
export const DECISION_HOME = process.env.DECISION_HOME !== "0"
