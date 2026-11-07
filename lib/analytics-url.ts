// RM20320 — a taste-match link carries its key in the path (/taste/<id>/<key>), so a page view must
// never upload it. Table invites keep theirs in the query/fragment, which are stripped.
export function redactAnalyticsUrl(rawUrl: string): string {
  const url = new URL(rawUrl)
  url.search = ""
  url.hash = ""
  url.pathname = url.pathname.replace(/^((?:\/id)?\/taste\/)[^/]+\/[^/]+/, "$1redacted/redacted")
  url.pathname = url.pathname.replace(/^((?:\/id)?\/(?:invite|claim)\/).+/, "$1redacted")
  return url.toString()
}
