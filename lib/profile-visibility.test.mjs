import assert from 'node:assert/strict'
import test from 'node:test'

import { createHash } from 'node:crypto'
import * as gate from './profile-visibility.ts'

const { accountStanding, chosenHandle, isUnderMinimumAge, venueVisibilityOn, accountDeletionFencePath } = gate
// The gate takes the three records it is given about an account; `fenced` is the deletion fence's `exists`.
const isVisiblePublicProfile = (user, age, year, fenced = false) => gate.isVisiblePublicProfile({ user, age, fenced }, year)
const mayAppearOnPublicPage = (user, age, year, fenced = false) => gate.mayAppearOnPublicPage({ user, age, fenced }, year)

const YEAR = 2026
const user = (extra = {}) => ({ name: 'Dewi Lestari', username: 'dewi', accountStatus: 'active', ...extra })
const adult = { birthYear: 1994 }

test('an ordinary active account with a chosen handle has a public page', () => {
  assert.equal(isVisiblePublicProfile(user(), adult, YEAR), true)
  // An account from before the age question has no age record: it stays open, and the app asks at launch.
  assert.equal(isVisiblePublicProfile(user(), undefined, YEAR), true)
  assert.equal(isVisiblePublicProfile(user({ accountStatus: undefined }), null, YEAR), true)
})

test('"Discoverable in Search" off means search only: the page still opens (Devon, 24 Nov 2026)', () => {
  assert.equal(isVisiblePublicProfile(user({ discoverable_by_friends_of_friends: false }), adult, YEAR), true)
  assert.equal(mayAppearOnPublicPage(user({ discoverable_by_friends_of_friends: false }), adult, YEAR), true)
})

test('an unknown account has no public page', () => {
  for (const missing of [undefined, null, 'dewi', 7, []]) {
    assert.equal(accountStanding(missing), 'unavailable')
    assert.equal(isVisiblePublicProfile(missing, adult, YEAR), false)
    assert.equal(mayAppearOnPublicPage(missing, adult, YEAR), false)
  }
})

test('a deleted account has no public page', () => {
  for (const extra of [{ deletedAt: 1 }, { deletedAt: '2026-11-01' }, { isDeleted: true }]) {
    assert.equal(isVisiblePublicProfile(user(extra), adult, YEAR), false, JSON.stringify(extra))
    assert.equal(mayAppearOnPublicPage(user(extra), adult, YEAR), false, JSON.stringify(extra))
  }
})

test('a spam account has no public page', () => {
  for (const extra of [{ isSpam: true }, { spamSuspected: true }]) {
    assert.equal(isVisiblePublicProfile(user(extra), adult, YEAR), false, JSON.stringify(extra))
  }
})

test('a held, disabled, hidden or moderated account has no public page, whichever field says so', () => {
  for (const field of ['accountStatus', 'status', 'visibility_status', 'moderationStatus']) {
    for (const status of ['deleted', 'disabled', 'held', 'hidden', 'moderated', 'pending', 'suspended', 'spam', 'banned', 'deactivated', ' Held ', 'DISABLED']) {
      const extra = { [field]: status }
      assert.equal(accountStanding(user(extra)), 'unavailable', JSON.stringify(extra))
      assert.equal(isVisiblePublicProfile(user(extra), adult, YEAR), false, JSON.stringify(extra))
      assert.equal(mayAppearOnPublicPage(user(extra), adult, YEAR), false, JSON.stringify(extra))
    }
  }
})

test('an account status that is anything but active has no public page', () => {
  for (const status of ['closing', 'review', 'unknown-new-state']) {
    assert.equal(isVisiblePublicProfile(user({ accountStatus: status }), adult, YEAR), false, status)
  }
})

test('an account under the minimum age has no public page', () => {
  assert.equal(isUnderMinimumAge({ underMinimum: true }, YEAR), true)
  assert.equal(isUnderMinimumAge({ birthYear: YEAR - 12 }, YEAR), true)
  assert.equal(isUnderMinimumAge({ birthYear: YEAR - 13 }, YEAR), false)
  assert.equal(isUnderMinimumAge({ birthYear: 1994, underMinimum: true }, YEAR), true)
  assert.equal(isUnderMinimumAge(undefined, YEAR), false)
  for (const age of [{ underMinimum: true }, { birthYear: YEAR - 12 }, { birthYear: YEAR }]) {
    assert.equal(isVisiblePublicProfile(user(), age, YEAR), false, JSON.stringify(age))
    assert.equal(mayAppearOnPublicPage(user(), age, YEAR), false, JSON.stringify(age))
  }
})

test('a placeholder handle, or no handle, is no public page; a chosen user_ handle is fine', () => {
  for (const username of ['user_abcdefgh_abc123', '@user_abcdefgh_abc123', 'USER_ABCDEFGH_ABC123456', '', '   ', undefined, 42]) {
    assert.equal(chosenHandle(user({ username })), '', String(username))
    assert.equal(isVisiblePublicProfile(user({ username }), adult, YEAR), false, String(username))
  }
  assert.equal(chosenHandle(user({ username: ' @user_joe ' })), 'user_joe')
  assert.equal(isVisiblePublicProfile(user({ username: 'user_joe' }), adult, YEAR), true)
  // A meal's author may still appear (without a byline) when the account itself is in good standing.
  assert.equal(mayAppearOnPublicPage(user({ username: 'user_abcdefgh_abc123' }), adult, YEAR), true)
})

test('an account that never finished its profile has no public page', () => {
  const unfinished = { name: '', display_name: ' ', profileSetupCompletedAt: undefined }
  assert.equal(isVisiblePublicProfile(user(unfinished), adult, YEAR), false)
  assert.equal(isVisiblePublicProfile(user({ name: {}, display_name: undefined }), adult, YEAR), false)
  assert.equal(isVisiblePublicProfile(user({ name: '', profileSetupCompletedAt: '2026-10-01T00:00:00Z' }), adult, YEAR), true)
})

test('venue visibility is on only for an explicit yes', () => {
  assert.equal(venueVisibilityOn({ enabled: true, noticeAt: 1 }), true)
  for (const record of [undefined, null, {}, { enabled: false }, { enabled: 'true' }, { enabled: 1 }, { noticeAt: 1 }]) {
    assert.equal(venueVisibilityOn(record), false, JSON.stringify(record))
  }
})

test('an account that is being deleted has no public page: the deletion fence the server\'s own active rule reads', () => {
  assert.equal(accountDeletionFencePath('uid-1'), `accountDeletionFences/${createHash('sha256').update('uid-1').digest('hex')}`)
  assert.equal(isVisiblePublicProfile(user(), adult, YEAR, true), false)
  assert.equal(mayAppearOnPublicPage(user(), adult, YEAR, true), false)
  // Only an explicit "no fence" passes: a fence that was not read counts as one.
  for (const fenced of [undefined, null, 'false', 0]) {
    assert.equal(gate.mayAppearOnPublicPage({ user: user(), age: adult, fenced }, YEAR), false, String(fenced))
    assert.equal(gate.isVisiblePublicProfile({ user: user(), age: adult, fenced }, YEAR), false, String(fenced))
  }
  assert.equal(gate.mayAppearOnPublicPage({ user: user(), age: adult }, YEAR), false, 'no fence fact at all')
  assert.equal(mayAppearOnPublicPage(user(), adult, YEAR, false), true)
})

test('a finished-profile stamp counts whatever type it is stored as', () => {
  const unnamed = { name: '', display_name: '' }
  for (const stamp of ['2026-10-01T00:00:00Z', 1790000000000, { seconds: 1790000000, nanoseconds: 0 }, { _seconds: 1790000000 }, { toMillis: () => 1790000000000 }]) {
    assert.equal(isVisiblePublicProfile(user({ ...unnamed, profileSetupCompletedAt: stamp }), adult, YEAR), true, JSON.stringify(stamp))
  }
  for (const stamp of [undefined, null, '', '  ', 0, false, {}, []]) {
    assert.equal(isVisiblePublicProfile(user({ ...unnamed, profileSetupCompletedAt: stamp }), adult, YEAR), false, JSON.stringify(stamp))
  }
})
