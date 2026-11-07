export type MaitredStorySnapshot = {
  step: 'save' | 'qualify' | 'lead' | 'share'
  days: number
  state: 'regulars' | 'qualify' | 'holder' | 'order'
}

const steps = ['save', 'qualify', 'lead', 'share'] as const
// Absorb arithmetic noise at a whole-day boundary, never round partial days up.
const dayTolerance = 1e-9

/** One deterministic timeline for both scrolling and explicit step selection. */
export function storyAtProgress(progress: number): MaitredStorySnapshot {
  const position = Number.isFinite(progress) ? Math.max(0, Math.min(3, progress)) : 0
  const step = steps[Math.round(position)]
  const continuousDays = position <= 1 ? 1 + position : position < 2 ? 2 + (position - 1) * 6 : 8
  const days = Math.min(8, Math.floor(continuousDays + dayTolerance))
  const state = days < 2 ? 'regulars' : days < 8 ? 'qualify' : step === 'share' ? 'order' : 'holder'
  return { step, days, state }
}

/** Interpolate between all four measured step centers in viewport coordinates. */
export function progressAtLine(centers: number[], line: number): number {
  if (!Number.isFinite(line) || centers.length !== 4
    || centers.some((center, index) => !Number.isFinite(center) || (index > 0 && center <= centers[index - 1]))) return 0
  if (line <= centers[0]) return 0
  if (line >= centers[3]) return 3
  for (let index = 0; index < 3; index++) {
    if (line <= centers[index + 1]) return index + (line - centers[index]) / (centers[index + 1] - centers[index])
  }
  return 3
}
