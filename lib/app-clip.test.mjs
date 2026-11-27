import assert from 'node:assert/strict'
import test from 'node:test'

import { APP_CLIP_DEV_BUNDLE_ID, appClipBannerMetadata, appClipDevBannerOn } from './app-clip.ts'

const BANNER = { appId: '6756131450', appArgument: 'https://www.makanofficial.com/places/kendal-street-kitchen-f10001' }

// Runs `body` with APP_CLIP_DEV_BANNER set to `value` (undefined: unset), then restores it.
function withBannerSwitch(value, body) {
  const before = process.env.APP_CLIP_DEV_BANNER
  try {
    if (value === undefined) delete process.env.APP_CLIP_DEV_BANNER
    else process.env.APP_CLIP_DEV_BANNER = value
    return body()
  } finally {
    if (before === undefined) delete process.env.APP_CLIP_DEV_BANNER
    else process.env.APP_CLIP_DEV_BANNER = before
  }
}

test('the App Clip banner switch is on only for the exact value "1", and off it adds nothing', () => {
  for (const value of [undefined, '', '0', 'true', 'TRUE', 'on', 'yes', ' 1', '1 ', '01', 'false']) {
    withBannerSwitch(value, () => {
      assert.equal(appClipDevBannerOn(), false, JSON.stringify(value))
      assert.equal(appClipBannerMetadata(BANNER), null, JSON.stringify(value))
    })
  }
  withBannerSwitch('1', () => assert.equal(appClipDevBannerOn(), true))
})

test('with the switch on, the Smart App Banner tag names the MakanDev App Clip in Apple\'s format', () => withBannerSwitch('1', () => {
  assert.equal(APP_CLIP_DEV_BUNDLE_ID, 'com.makanofficial.makandev.Clip')
  assert.deepEqual(appClipBannerMetadata(BANNER), {
    other: { 'apple-itunes-app': 'app-id=6756131450, app-clip-bundle-id=com.makanofficial.makandev.Clip, app-argument=https://www.makanofficial.com/places/kendal-street-kitchen-f10001' },
  })
  assert.deepEqual(appClipBannerMetadata({ appId: '6756131450' }), {
    other: { 'apple-itunes-app': 'app-id=6756131450, app-clip-bundle-id=com.makanofficial.makandev.Clip' },
  })
  // No App Store id, no banner: nothing to add the clip to.
  assert.equal(appClipBannerMetadata(undefined), null)
  // Apple's card over the page is not part of this unit.
  assert.ok(!appClipBannerMetadata(BANNER).other['apple-itunes-app'].includes('app-clip-display'))
}))
