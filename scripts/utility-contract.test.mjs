import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import test from 'node:test'

// Wording captured from integration base4af759a before this presentation-only pass.
// A future authorized policy edit must deliberately update its prose fingerprint.
const expected = {
  "app/[locale]/privacy-policy/page.tsx": "f164cbe742c77bc6feb3949a2e6f84e9cd1c3cc49b7ab349830a90ed07a166c5",
  "components/legal/PrivacyPolicyId.tsx": "6e11e49facc9b3d797930c33f6b08652ac72c4e88c50513d73ceee46ff5648e9",
  "app/[locale]/tos/page.tsx": "7ad7594a86d6c43c786e573a046058e9723ad42940a6256c361d8b562a810256"
}
for (const [file, hash] of Object.entries(expected)) {
  test(`${file}: preserves the full existing legal prose`, () => {
    const source=readFileSync(file,'utf8')
    const body=source.split('data-policy-copy>')[1]?.split('</article>')[0]
    assert.ok(body, 'The complete policy body must remain identifiable.')
    const text=body.replace(/\{\/\*[\s\S]*?\*\/\}/g,'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()
    assert.equal(createHash('sha256').update(text).digest('hex'),hash)
  })
}
