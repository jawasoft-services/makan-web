import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import test from 'node:test'

// Baseline wording plus the authorised Maître d’ disclosure and 7 Nov Firebase provider draft.
// Decorative navigation arrows are excluded from the prose fingerprint.
// A future authorized policy edit must deliberately update its prose fingerprint.
const expected = {
  "app/[locale]/privacy-policy/page.tsx": "cb2dc7477c78b8bfec8f4e7efc49b3091f5b8b34c0ff9370b9bb0d1afc0ba04b",
  "components/legal/PrivacyPolicyId.tsx": "d4079f50abc5ad2d2ad4fa8abfec6103314a7dff134e9095673cfb681a88b239",
  "app/[locale]/tos/page.tsx": "b8d48ad02dcce507342798fc6ec4b2b10096ea6fa4ef4ebbaeb2a1df7bf083c2"
}
for (const [file, hash] of Object.entries(expected)) {
  test(`${file}: preserves the full existing legal prose`, () => {
    const source=readFileSync(file,'utf8')
    const body=source.split('data-policy-copy>')[1]?.split('</article>')[0]
    assert.ok(body, 'The complete policy body must remain identifiable.')
    const text=body.replace(/\{\/\*[\s\S]*?\*\/\}/g,'').replace(/<[^>]+>/g,'').replace(/&larr;/g,'').replace(/\s+/g,' ').trim()
    assert.equal(createHash('sha256').update(text).digest('hex'),hash)
  })
}
