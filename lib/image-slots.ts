/**
 * At most IMAGE_SLOTS image jobs (sharp resizes, share-image renders) run at once on a website
 * instance; the rest wait their turn. Each instance accepts up to 80 requests at a time on 512 MiB,
 * and every image job in flight holds roughly 15 MiB (measured 24 Nov 2026: 12 share images at once
 * peaked at +167 MiB and stayed there, one at a time at +67 MiB and returned). Bursts from link
 * crawlers and cold thumbnails had been pushing instances past the limit several times a day.
 * Pages and other requests are not affected; only image work queues.
 */
export const IMAGE_SLOTS = 4

let active = 0
const waiting: (() => void)[] = []

/** Runs `work` once a slot is free. A finished job hands its slot straight to the next in line. */
export async function withImageSlot<T>(work: () => Promise<T>): Promise<T> {
  if (active < IMAGE_SLOTS) active++
  else await new Promise<void>((resolve) => waiting.push(resolve))
  try {
    return await work()
  } finally {
    const next = waiting.shift()
    if (next) next()
    else active--
  }
}

/**
 * Renders an image response to bytes inside a slot. `ImageResponse` renders while its body is
 * read, so without this the slot would be released before the memory is used.
 */
export function renderImage(make: () => Response): Promise<Response> {
  return withImageSlot(async () => {
    const response = make()
    const body = await response.arrayBuffer()
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers })
  })
}

/** For tests: jobs running and jobs waiting. */
export function imageSlotState() {
  return { active, waiting: waiting.length }
}
