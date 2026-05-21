import { getMakanStats } from '@/lib/makan-stats'
import LatestOnMakan from './LatestOnMakan'

/**
 * Server component: fetches live stats from Firestore (or returns fallback
 * if unreachable) and passes them as plain primitives to the client section.
 * The homepage's `revalidate` controls how often Firestore is actually hit.
 */
export default async function LatestOnMakanSection() {
  const stats = await getMakanStats()
  return <LatestOnMakan userCount={stats.userCount} mealCount={stats.mealCount} />
}
