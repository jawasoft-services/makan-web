import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import test from 'node:test'

// Wording captured from integration base4af759a before this presentation-only pass.
// Decorative navigation arrows are excluded from the prose fingerprint.
// A future authorized policy edit must deliberately update its prose fingerprint.
const expected = {
  "app/[locale]/privacy-policy/page.tsx": "d842c1874a5cf31ee47050ace9f236bf0fe45cd7eda967a79f4362b61c50ec2f",
  "components/legal/PrivacyPolicyId.tsx": "b10d547fc32ca730d90e84ac356d5236fcf83f6fce8fce47bf9bf2978f77faf2",
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
