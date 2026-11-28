// RM20320 — a taste-match link carries its key in the path (/taste/<id>/<key>), so a page view must
// never upload it. Table invites keep theirs in the query/fragment, which are stripped.
export function redactAnalyticsUrl(rawUrl: string): string {
  const url = new URL(rawUrl)
  url.search = ""
  url.hash = ""
  url.pathname = url.pathname.replace(/^((?:\/id)?\/taste\/)[^/]+\/[^/]+/, "$1redacted/redacted")
  url.pathname = url.pathname.replace(/^((?:\/id)?\/(?:invite|claim)\/).+/, "$1redacted")
  // RM20616 A12 U3 — a public profile's address is a person's handle and permanent key.
  url.pathname = url.pathname.replace(/^((?:\/id)?\/u\/).+/, "$1redacted")
  // A meal id is public, but it resolves to a person's handle (U3 review, Low 8).
  url.pathname = url.pathname.replace(/^((?:\/id)?\/meal\/).+/, "$1redacted")
  // RM20616 O1 — the approval text's link (/d/<code>) carries its code in the path.
  url.pathname = url.pathname.replace(/^((?:\/(?:en|id))?\/d\/).+/, "$1redacted")
  return url.toString()
}
