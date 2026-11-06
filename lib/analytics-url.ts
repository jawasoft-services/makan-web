// RM20320 — a taste-match link carries its key in the path (/taste/<id>/<key>), so a page view must
// never upload it. Table invites keep theirs in the query/fragment, which are stripped.
export function redactAnalyticsUrl(rawUrl: string): string {
  const url = new URL(rawUrl)
  if (url.pathname.includes("/invite/")) {
    url.searchParams.delete("s")
    url.hash = ""
  }
  url.pathname = url.pathname.replace(/^((?:\/id)?\/taste\/)[^/]+\/[^/]+/, "$1redacted/redacted")
  return url.toString()
}
