import { getMealCount } from '@/lib/makan-stats'
import FinalCTA from './FinalCTA'

/**
 * Server wrapper: fetches the live meal count (or fallback) and hands it to
 * the client CTA for the "Live now · N meals shared" badge. Mirrors
 * LatestOnMakanSection. The homepage's `revalidate` controls fetch cadence;
 * getMealCount() is a single aggregation read, so this is near-free.
 */
export default async function FinalCTASection() {
  const mealCount = await getMealCount()
  return <FinalCTA mealCount={mealCount} />
}
