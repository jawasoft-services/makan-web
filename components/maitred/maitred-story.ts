export type MaitredStorySnapshot = {
  progress: number
  step: 'save' | 'qualify' | 'lead' | 'share'
  days: number
  dayProgress: number
  state: 'regulars' | 'qualify' | 'holder' | 'order'
  mealLanding: number
  camera: number
  editorOpen: number
  typedText: string
  preview: boolean
  publishProgress: number
  publication: number
}

// Absorb arithmetic noise at a whole-day boundary, never round partial days up.
const dayTolerance = 1e-9

function segment(position: number, start: number, end: number) {
  return Math.max(0, Math.min(1, (position - start) / (end - start)))
}

function ease(position: number, start: number, end: number) {
  const value = segment(position, start, end)
  return value * value * (3 - 2 * value)
}

/** Every visual value comes from position, so stopping and reversing need no clock. */
export function storyAtProgress(progress: number): MaitredStorySnapshot {
  const position = Number.isFinite(progress) ? Math.max(0, Math.min(3, progress)) : 0
  const step = position < .55 ? 'save' : position < 1.5 ? 'qualify' : position < 2.08 ? 'lead' : 'share'
  const days = position < .55 ? 1 : position < 1 ? 2 : Math.min(8, Math.floor(2 + (position - 1) * 6 + dayTolerance))
  const dayProgress = position < 1 ? days : Math.min(8, 2 + (position - 1) * 6)
  const publication = ease(position, 2.83, 2.95)
  const state = days < 2 ? 'regulars' : days < 8 ? 'qualify' : publication > 0 ? 'order' : 'holder'
  const dish = 'Harissa prawns'
  return {
    progress: position, step, days, dayProgress, state,
    mealLanding: ease(position, .05, .55),
    camera: ease(position, .7, 1),
    editorOpen: ease(position, 2.08, 2.2) * (1 - ease(position, 2.8, 2.94)),
    typedText: dish.slice(0, Math.floor(segment(position, 2.22, 2.52) * dish.length)),
    preview: position >= 2.58,
    publishProgress: ease(position, 2.7, 2.78),
    publication,
  }
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
