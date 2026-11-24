import assert from 'node:assert/strict'
import test from 'node:test'

import { shareV2PagesOn } from './share-v2.ts'

test('the Share v2 pages switch is on only for the exact value "1"', () => {
  const before = process.env.SHARE_V2_PAGES
  try {
    delete process.env.SHARE_V2_PAGES
    assert.equal(shareV2PagesOn(), false)
    for (const value of ['', '0', 'true', 'TRUE', 'on', 'yes', ' 1', '1 ', '01', 'false']) {
      process.env.SHARE_V2_PAGES = value
      assert.equal(shareV2PagesOn(), false, JSON.stringify(value))
    }
    process.env.SHARE_V2_PAGES = '1'
    assert.equal(shareV2PagesOn(), true)
  } finally {
    if (before === undefined) delete process.env.SHARE_V2_PAGES
    else process.env.SHARE_V2_PAGES = before
  }
})
