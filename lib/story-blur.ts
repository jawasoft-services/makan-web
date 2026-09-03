import blur from '@/lib/data/story-blur.json'

const BLUR = blur as Record<string, string>

/** The tiny blurred preview for a story image path, if one was generated. */
export function storyBlur(src: string): string | undefined {
  return BLUR[src]
}
