import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { chromium } from 'playwright'

const base = new URL(process.argv[2] ?? 'http://localhost:3463')
const output = process.env.CHECK_OUTPUT ? resolve(process.env.CHECK_OUTPUT) : await mkdtemp(join(tmpdir(), 'makan-navigation-'))
await mkdir(output, { recursive: true })
const report = { base: base.origin, routes: [], layouts: [], drawers: [], languageSwitch: false, hashNavigation: [], pageErrors: [] }
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const locale of ['en', 'id']) {
    const prefix = locale === 'id' ? '/id' : ''
    for (const route of ['/partner', '/support', '/']) {
      const path = route === '/' ? prefix || '/' : prefix + route
      const response = await fetch(new URL(path, base), { headers: { 'accept-language': locale, cookie: 'NEXT_LOCALE=' + locale }, redirect: 'manual' })
      assert.equal(response.status, 200, path + ' must render directly')
      const html = await response.text()
      assert.ok(html.includes('<html lang="' + locale + '"'), path + ' document language')
      report.routes.push({ path, status: response.status, locale })
    }
  }
  for (const [path, status, destination] of [
    ['/en/partner?check=1', 308, '/partner?check=1'],
    ['/id/tos?check=1', 307, '/tos?check=1'],
  ]) {
    const response = await fetch(new URL(path, base), { redirect: 'manual' })
    assert.equal(response.status, status)
    assert.equal(new URL(response.headers.get('location'), base).pathname + new URL(response.headers.get('location'), base).search, destination)
    report.routes.push({ path, status, destination })
  }
  const context = await browser.newContext({ locale: 'en-GB', reducedMotion: 'reduce' })
  await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort())
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror', error => report.pageErrors.push(error.message))
  for (const locale of ['en', 'id']) {
    for (const route of ['/partner', '/support', '/']) {
      const prefix = locale === 'id' ? '/id' : ''
      const path = route === '/' ? prefix || '/' : prefix + route
      for (const width of [1440, 1024, 390, 320]) {
        await page.setViewportSize({ width, height: 844 })
        await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, url: base.origin }])
        await page.goto(new URL(path, base).href)
        await page.evaluate(() => document.fonts.ready)
        for (const scale of [1, 2]) {
          await page.evaluate(scale => document.documentElement.style.fontSize = 112.5 * scale + '%', scale)
          const geometry = await page.evaluate(() => {
            const visible = element => element.getBoundingClientRect().height > 0
            const outside = element => {
              const box = element.getBoundingClientRect()
              return box.left < -1 || box.right > innerWidth + 1
            }
            return {
              width: innerWidth,
              documentWidth: document.documentElement.scrollWidth,
              headerHeight: document.querySelector('nav').getBoundingClientRect().height,
              headerOverflow: [...document.querySelectorAll('nav a, nav button, nav img')].filter(visible).filter(outside).map(element => element.textContent || element.getAttribute('alt')),
              footerOverflow: [...document.querySelectorAll('footer a, footer img')].filter(visible).filter(outside).map(element => element.textContent || element.getAttribute('alt')),
              headerLinks: [...document.querySelectorAll('nav a')].filter(visible).map(element => element.getAttribute('href')),
              footerLinks: [...document.querySelectorAll('footer a')].map(element => element.getAttribute('href')),
              numericColours: [...document.querySelectorAll('main dt')].map(element => getComputedStyle(element).color),
              menuSize: (() => { const button = document.querySelector('nav button'); if (!button || !visible(button)) return null; const box = button.getBoundingClientRect(); return { width: box.width, height: box.height } })(),
            }
          })
          assert.deepEqual(geometry.headerOverflow, [], path + ' header overflow at ' + width + '/' + scale)
          assert.deepEqual(geometry.footerOverflow, [], path + ' footer overflow at ' + width + '/' + scale)
          const localized = path => locale === 'id' ? '/id' + (path === '/' ? '' : path) : path
          const footerLinks = [localized('/'), 'https://apps.apple.com/app/id6756131450', 'https://play.google.com/store/apps/details?id=com.makanofficial.makanapp', ...['/app', '/story', '/blog', '/partner', '/standings', '/support', '/contact', '/account-deletion', '/data-deletion', '/privacy-policy', '/tos'].map(path => ['/blog', '/privacy-policy', '/tos'].includes(path) ? path : localized(path)), 'https://www.instagram.com/makanappofficial/', 'https://x.com/app_makan', 'https://www.tiktok.com/@makan.app', 'https://www.google.com/maps/place/The+Hoxton+Mix/@51.5256479,-0.0885239']
          assert.deepEqual(geometry.footerLinks, footerLinks, 'All footer destinations must remain')
          const hash = value => route === '/' ? value : (locale === 'id' ? '/id/' : '/') + value
          const navigation = [hash('#how-it-works'), hash('#features'), localized('/standings'), hash('#faq'), localized('/partner')]
          const otherLocalePath = locale === 'id' ? (route === '/' ? '/' : route) : '/id' + (route === '/' ? '' : route)
          assert.deepEqual(geometry.headerLinks, width >= 1024 ? [localized('/'), ...navigation, otherLocalePath, localized('/app')] : [localized('/'), localized('/app')], 'Header destinations must remain')
          if (route === '/partner') {
            assert.ok(geometry.documentWidth <= width, 'Partner page overflow at ' + width + '/' + scale)
            assert.equal(geometry.numericColours.length, 5)
            assert.ok(geometry.numericColours.every(colour => colour === 'rgb(255, 153, 50)'), 'All emphasized numbers remain saffron')
          }
          if (geometry.menuSize) assert.ok(geometry.menuSize.width >= 44 && geometry.menuSize.height >= 44, 'Menu hit area')
          report.layouts.push({ locale, path, width, scale, ...geometry })
          if (width === 320 && scale === 2) {
            await page.screenshot({ path: join(output, locale + '-' + (route === '/' ? 'home' : route.slice(1)) + '-320-enlarged.png') })
            await page.locator('nav button[aria-controls="mobile-navigation"]').click()
            const drawer = page.locator('#mobile-navigation')
            await drawer.waitFor({ state: 'visible' })
            await page.waitForFunction(() => {
              const box = document.querySelector('#mobile-navigation').getBoundingClientRect()
              return box.top >= -1 && box.bottom <= innerHeight + 1
            })
            const bounds = await drawer.evaluate(element => ({ top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom, height: element.getBoundingClientRect().height, scrollHeight: element.querySelector('.overflow-y-auto').scrollHeight, clientHeight: element.querySelector('.overflow-y-auto').clientHeight, overflowY: getComputedStyle(element.querySelector('.overflow-y-auto')).overflowY, links: element.querySelectorAll('a').length }))
            assert.ok(bounds.top >= -1 && bounds.bottom <= 845, 'Drawer must stay within viewport')
            assert.ok(bounds.scrollHeight <= bounds.clientHeight || bounds.overflowY === 'auto', 'Long menu must scroll')
            assert.deepEqual(await drawer.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))), [...navigation, otherLocalePath, localized('/app')], 'Drawer destinations must remain')
            await page.keyboard.press('Escape')
            await page.waitForFunction(() => document.activeElement?.getAttribute('aria-controls') === 'mobile-navigation')
            await page.locator('nav button[aria-controls="mobile-navigation"]').click()
            await drawer.waitFor({ state: 'visible' })
            const lastLink = drawer.locator('a').last()
            await lastLink.scrollIntoViewIfNeeded()
            await lastLink.click()
            await page.waitForURL(new URL(localized('/app'), base).href)
            assert.equal(await page.locator('html').getAttribute('lang'), locale)
            report.drawers.push({ locale, path, ...bounds, escapeRestoresFocus: true, lastLinkNavigates: true })
          }
        }
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 844 })
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: base.origin }])
  await page.goto(new URL('/partner?check=language', base).href)
  await page.locator('nav a[hreflang="id"]').click()
  await page.waitForURL(new URL('/id/partner?check=language', base).href)
  assert.equal(await page.locator('html').getAttribute('lang'), 'id')
  await page.locator('nav a[hreflang="en"]').click()
  await page.waitForURL(new URL('/partner?check=language', base).href)
  assert.equal(await page.locator('html').getAttribute('lang'), 'en')
  report.languageSwitch = true
  for (const locale of ['en', 'id']) {
    const prefix = locale === 'id' ? '/id' : ''
    await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, url: base.origin }])
    for (const hash of ['#how-it-works', '#features', '#faq']) {
      await page.goto(new URL(prefix + '/partner', base).href)
      await page.locator('nav a[href="' + prefix + '/' + hash + '"]').click()
      await page.waitForURL(new URL((prefix || '/') + hash, base).href)
      await page.waitForFunction(id => {
        const box = document.getElementById(id)?.getBoundingClientRect()
        return box && box.top < innerHeight && box.bottom > 0
      }, hash.slice(1))
      report.hashNavigation.push({ locale, hash, targetVisible: true })
    }
  }
  assert.deepEqual(report.pageErrors, [])
  await writeFile(join(output, 'navigation.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ routes: report.routes.length, layouts: report.layouts.length, drawers: report.drawers.length, languageSwitch: report.languageSwitch, hashNavigation: report.hashNavigation.length, pageErrors: report.pageErrors.length, output }))
} finally {
  await browser.close()
}
