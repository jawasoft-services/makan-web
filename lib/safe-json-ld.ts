/**
 * JSON for the body of a `<script type="application/ld+json">` element.
 *
 * The HTML parser ends a script element at the first `</script`, before any
 * JSON is parsed, so a restaurant name, caption, cuisine label or image URL
 * that came from a user's meal could otherwise close the element and start
 * one of its own. Escaping `<`, `>` and `&` as `\uXXXX` keeps the output
 * identical after JSON.parse while never forming markup; U+2028 and U+2029
 * are line terminators in older JavaScript engines and are escaped for the
 * same reason. Every JSON-LD sink on the site goes through this one function.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
}
