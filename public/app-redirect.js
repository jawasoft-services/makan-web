// RM20773: /app sends a phone straight to its own store. The App Hosting CDN hands the server
// "Google" as every visitor's user agent, so the device is read here, in the browser. The store
// links and the fallback come from the page (app/[locale]/app/route.ts, from lib/links.ts).
(function () {
  var s = document.currentScript, ua = navigator.userAgent
  var ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 0)
  location.replace((/android/i.test(ua) && s.getAttribute('data-android')) || (ios && s.getAttribute('data-ios')) || s.getAttribute('data-fallback') || '/#get')
})()
