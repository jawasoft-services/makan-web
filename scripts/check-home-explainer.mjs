// BASE=http://127.0.0.1:3467 node scripts/check-home-explainer.mjs
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.BASE ?? 'http://127.0.0.1:3467'
const output = process.env.SCREENSHOTS
if (output) await mkdir(output, { recursive: true })
const browser = await chromium.launch()
try {
  for (const locale of ['en', 'id']) {
    for (const width of [1280, 768, 375, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
        ? route.continue() : route.abort())
      await page.goto(`${base}/${locale}/dev-preview`, { waitUntil: 'networkidle' })
      const arrow = page.locator('.scroll-cue-arrow')
      await arrow.waitFor({ state: 'visible' })
      const frames = await arrow.evaluate(el => {
        const animation = el.getAnimations()[0]
        if (!animation) throw new Error('Missing arrow animation')
        animation.pause()
        return [1400, 1850, 2300, 2750, 3200].map(time => {
          animation.currentTime = time
          const matrix = new DOMMatrix(getComputedStyle(el).transform)
          const rect = el.getBoundingClientRect()
          return { x: matrix.m41, y: matrix.m42, a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d, width: rect.width, height: rect.height }
        })
      })
      assert.ok(frames.some(frame => frame.y >= 3.9), 'Arrow should nudge downward')
      for (const f of frames) {
        assert.deepEqual([f.x, f.a, f.b, f.c, f.d], [0, 1, 0, 0, 1], 'Arrow must not rotate, stretch or drift sideways')
        assert.ok(f.y >= 0 && f.y <= 4.01)
        assert.equal(f.width, frames[0].width)
        assert.equal(f.height, frames[0].height)
      }
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal(await arrow.evaluate(el => el.getAnimations().length), 0, 'Reduced motion must keep the arrow still')
      const proof = page.locator('#proof')
      const text = await proof.innerText()
      assert.ok(!/Fish beats beef|Fresh and spicy beats fried|Chilli beats cheese|Ikan menang dari daging/.test(text))
      assert.ok(text.includes(locale === 'en' ? 'Trying a new restaurant?' : 'Mau coba restoran baru?'))
      assert.ok(text.includes(locale === 'en' ? 'what a friend chose there' : 'dipilih temanmu di sana'))
      assert.equal(await proof.locator('[data-place]').count(), 3, 'Keep the original three comparisons')
      assert.equal(await proof.locator('h3').count(), 0, 'No redesigned step headings')
      assert.ok(await proof.locator('[data-scene]').count() > 0, 'Keep original scene animations')
      await proof.scrollIntoViewIfNeeded()
      await proof.locator('img').evaluateAll(images => Promise.all(images.map(img => img.decode())))
      assert.ok(await proof.locator('img').evaluateAll(images => images.every(img => img.naturalWidth > 0)), 'All meal photos must load')
      assert.ok(text.includes(locale === 'en' ? 'Sushi over roast beef.' : 'Sushi dipilih daripada roast beef.'))
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow')
      if (output) {
        // Hide fixed page chrome only for this full-section review capture.
        await proof.screenshot({ path: `${output}/${locale}-${width}-proof.png`, style: "nav, nextjs-portal { display: none !important; }" })
      }
      await page.close()
      console.log(`${locale} ${width}px: stable downward arrow, reduced motion, original comparison layout and updated copy, loaded photos, no horizontal overflow`)
    }
  }
} finally {
  await browser.close()
}
