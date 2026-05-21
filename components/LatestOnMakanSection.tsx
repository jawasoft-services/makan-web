import { getMealCount } from '@/lib/makan-stats'
import LatestOnMakan from './LatestOnMakan'

/**
 * Server component: fetches the live meal count from Firestore (or returns
 * fallback if unreachable) and passes it as a plain number to the client
 * section. The homepage's `revalidate` controls how often Firestore is hit.
 */
export default async function LatestOnMakanSection() {
  const mealCount = await getMealCount()
  return <LatestOnMakan mealCount={mealCount} />
}
