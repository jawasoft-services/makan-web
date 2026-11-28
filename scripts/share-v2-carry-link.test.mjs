// RM20616 A12 U12 follow-up: every way off a v2 share page to a store carries the link (lib/carry-link.ts),
// so the app's first-open handoff (Play install referrer / iPhone paste card) can open it after the install.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const actions = readFileSync('components/share/ShareActions.tsx', 'utf8')

test('Open in Makan on Android falls back to the Play listing that carries the link', () => {
  assert.match(actions, /S\.browser_fallback_url=\$\{encodeURIComponent\(playUrlWithLink\(link\)\)\}/)
  assert.doesNotMatch(actions, /S\.browser_fallback_url=\$\{encodeURIComponent\(GOOGLE_PLAY_URL\)\}/)
})

test('Open in Makan on iPhone and Get Makan with a link still go through goToStoreWithLink', () => {
  assert.match(actions, /goToStoreWithLink\(link\)\s*\},\s*STILL_HERE_MS/)
  assert.match(actions, /if \(link\) void goToStoreWithLink\(link\)/)
})
