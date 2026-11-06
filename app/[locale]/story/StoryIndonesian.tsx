import StoryArticle from '@/components/story/StoryArticle'

export default function StoryIndonesian({ mealCount }: { mealCount: number }) {
  return <StoryArticle locale="id" mealCount={mealCount} />
}
