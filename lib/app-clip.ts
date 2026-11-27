/**
 * RM20616 growth item 1 (App Clip), unit U4 — the dev App Clip on the restaurant page.
 *
 * One switch, APP_CLIP_DEV_BANNER, read per request. It is on only for the exact value "1"; absent or
 * anything else is off, and with it off the restaurant page's <head> is what it was before this unit.
 * With it on, the page's Smart App Banner tag names the MakanDev App Clip (Apple, "Supporting
 * invocations from your website and the Messages app"):
 *
 *   <meta name="apple-itunes-app" content="app-id=…, app-clip-bundle-id=com.makanofficial.makandev.Clip, app-argument=…">
 *
 * `app-clip-display=card` (Apple's card over the page in Safari) is not added: the approved choice is
 * Apple's install banner, and covering the page is a separate decision.
 *
 * Safari only draws the clip's banner once a published app offers that clip, so with the dev clip this
 * tag is for checking the markup; the production clip's bundle id is the release step (A12), not this unit.
 * The association file's switch (APP_CLIP_DEV_LINKS) lives in app/.well-known/apple-app-site-association.
 */
export const APP_CLIP_DEV_BUNDLE_ID = 'com.makanofficial.makandev.Clip'

export const appClipDevBannerOn = (): boolean => process.env.APP_CLIP_DEV_BANNER === '1'

export type SmartAppBanner = { appId: string; appArgument?: string }

/**
 * Apple's Smart App Banner for a page: the App Store app's id (from its App Store address) and the
 * page's address for the app to open; undefined when the address has no id. Kept free of imports so
 * the restaurant page can use it without the share pages' server code.
 */
export function appStoreBanner(appStoreUrl: string, pageUrl: string): SmartAppBanner | undefined {
  const appId = appStoreUrl.match(/id(\d+)/)?.[1]
  return appId ? { appId, appArgument: pageUrl } : undefined
}

/**
 * The page's Smart App Banner tag with the dev App Clip added, as metadata to spread into the page's,
 * or null when the switch is off or there is no banner to add it to. Next's `itunes` field cannot carry
 * `app-clip-bundle-id`, so the whole tag is written through `other`; a page using this drops its `itunes`.
 */
export function appClipBannerMetadata(banner: SmartAppBanner | undefined): { other: { 'apple-itunes-app': string } } | null {
  if (!appClipDevBannerOn() || !banner) return null
  const argument = banner.appArgument ? `, app-argument=${banner.appArgument}` : ''
  return { other: { 'apple-itunes-app': `app-id=${banner.appId}, app-clip-bundle-id=${APP_CLIP_DEV_BUNDLE_ID}${argument}` } }
}
