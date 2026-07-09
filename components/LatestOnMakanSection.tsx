import { getMealCount, getRecentPublicMeals } from '@/lib/makan-stats'
import LatestOnMakan from './LatestOnMakan'

/**
 * Server component: fetches the live meal count and the ~100 most recent
 * PUBLIC meal photos from Firestore (each falls back independently if
 * unreachable) and passes plain data to the client section. The homepage's
 * `revalidate` controls how often Firestore is hit.
 */
export default async function LatestOnMakanSection() {
  const [mealCount, liveMeals] = await Promise.all([
    getMealCount(),
    getRecentPublicMeals(),
  ])
  return <LatestOnMakan mealCount={mealCount} liveMeals={liveMeals} />
}
