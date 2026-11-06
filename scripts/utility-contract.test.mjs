import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import test from 'node:test'

// Baseline wording plus the authorised 6 Nov Maître d’ public visibility disclosure.
// Decorative navigation arrows are excluded from the prose fingerprint.
// A future authorized policy edit must deliberately update its prose fingerprint.
const expected = {
  "app/[locale]/privacy-policy/page.tsx": "d8bdc6f286b873f5c0ac7bd27be8b8dcb51e8f81ae0d2276f346a454f7333d0c",
  "components/legal/PrivacyPolicyId.tsx": "5f5b0adccae35c57900c3e05bd93607395f2467307fd6a519b182d2b8a1f829a",
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
