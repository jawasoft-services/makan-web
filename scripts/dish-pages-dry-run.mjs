#!/usr/bin/env node
/**
 * RM20616 dish pages U1 — a read-only dry run of the cron's dish step against makan-devel.
 *
 *   FIREBASE_PROJECT_ID=makan-devel node scripts/dish-pages-dry-run.mjs [--sample]
 *
 * It runs only the pure dish rules (lib/aggregates/dishes.ts) over makan-devel's restaurants that have an answer,
 * as the 03 UTC run would: one query for those restaurants (their dish and visibility fields only), then one read
 * of each answered venue's menu order (`dishRatingOrder` only, never its sections or prices). It prints counts and
 * the number of documents read, and with --sample up to five places' names. It writes nothing, calls nothing
 * outside Firestore, never runs the full cron (which would write webAggregates and could make paid place lookups)
 * and refuses any project but makan-devel. Credentials: the caller's own Application Default Credentials.
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { buildPlaceDishes, DISH_VENUE_FIELDS, RATING_ORDER_FIELDS, readAnswer } from '../lib/aggregates/dishes.ts'

const PROJECT = 'makan-devel'
if (process.env.FIREBASE_PROJECT_ID !== PROJECT) {
  console.error(`Refusing: set FIREBASE_PROJECT_ID=${PROJECT}. This dry run never reads any other project.`)
  process.exit(2)
}
const sample = process.argv.includes('--sample')
const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: PROJECT }, 'dish-pages-dry-run'))

// The visibility fields the cron's directory uses (lib/public-venues.ts excludesPublicVenue), restated here so the
// script needs no app module: a test, retired or moved venue never gets a page or dishes.
const excluded = (v, id) => v.isTestVenue === true || (v.state !== undefined && v.state !== 'active') || Boolean(v.replacedByCanonicalPlaceId)
  || (typeof v.canonicalPlaceId === 'string' && v.canonicalPlaceId !== id)

let reads = 0
const venues = await db.collection('restaurants').where('dishToOrder.maitred', 'in', [true, false])
  .select(...DISH_VENUE_FIELDS, 'state', 'isTestVenue', 'canonicalPlaceId', 'replacedByCanonicalPlaceId').get()
reads += Math.max(1, venues.size)
const counts = { withAnswerField: venues.size, excluded: 0, optedOut: 0, malformed: 0, answered: 0, maitred: 0, withRows: 0, rows: 0, noMenu: 0, noOrder: 0 }
const answered = []
for (const doc of venues.docs) {
  const v = doc.data()
  if (excluded(v, doc.id)) { counts.excluded++; continue }
  if (v.dishNamesPolicy === 'venue_opt_out') { counts.optedOut++; continue }
  const answer = readAnswer(v)
  if (!answer) { counts.malformed++; continue }
  counts.answered++
  if (answer.maitred) counts.maitred++
  answered.push({ id: doc.id, answer })
}
const shown = []
for (let i = 0; i < answered.length; i += 100) {
  const batch = answered.slice(i, i + 100)
  const menus = await db.getAll(...batch.map(({ id }) => db.collection('venueMenus').doc(id)), { fieldMask: RATING_ORDER_FIELDS })
  reads += menus.length
  menus.forEach((menu, j) => {
    if (!menu.exists) counts.noMenu++
    const order = menu.exists ? menu.data()?.dishRatingOrder ?? null : null
    if (menu.exists && order === null) counts.noOrder++
    const dishes = buildPlaceDishes(batch[j].answer, order, null)
    if (dishes.rated.length) { counts.withRows++; counts.rows += dishes.rated.length }
    if (sample && shown.length < 5) shown.push({ placeId: batch[j].id, ...dishes })
  })
}
console.log(JSON.stringify({ project: PROJECT, documentsRead: reads, ...counts }, null, 2))
if (sample) console.log(JSON.stringify(shown, null, 2))
