import { NextResponse } from "next/server"

/*
 * Apple App Site Association (AASA) — the file iOS fetches to verify universal
 * links for makanofficial.com. Served as a route handler (not a public/ file) so
 * the Content-Type is guaranteed `application/json`; a wrong type makes iOS
 * silently reject the association and every link falls back to Safari.
 *
 * It MUST be reachable WITHOUT a redirect on every claimed host — iOS does not
 * follow redirects when fetching AASA. The apex->www 308 in middleware.ts
 * explicitly skips /.well-known/*, so both makanofficial.com and
 * www.makanofficial.com serve this directly.
 *
 * `appIDs` lists the prod + dev bundles (both under Apple Team T3Z49Z9YUB) so
 * TestFlight / dev-client builds handle universal links too. `paths` is an
 * ALLOW-list: only these open the app; every other URL (the marketing pages)
 * stays in Safari. Both the legacy (`appID` + `paths`) and modern (`appIDs` +
 * `components`) forms are included for maximum iOS-version compatibility.
 *
 * PATHS are DELIBERATELY the not-yet-live paths only. /r/* (the LIVE venue-QR
 * pilot with printed cards) is intentionally EXCLUDED: claiming it would make
 * iOS pull installed users out of the working /r web landing into the app,
 * which has no /r handler until RM18720 Phase 2. AASA paths are server-side, so
 * adding /r/* later (with the app-side /r handler) is a web-only change — NO
 * Apple re-submission. Keep the AASA path set in lockstep with what the app's
 * inbound URL router actually handles.
 *
 * NOTE: the matching `ios.associatedDomains` entitlement ships on the app side
 * (RM18722, native — a Jenkins build + Apple submission). Android assetlinks are
 * a fast-follow (RM18767).
 */

export const dynamic = "force-static"

const TEAM_ID = "T3Z49Z9YUB"
const APP_IDS = [
  `${TEAM_ID}.com.makanofficial.makanapp`, // App Store build
  `${TEAM_ID}.com.makanofficial.makandev`, // dev-client / TestFlight build
]
// Excludes /r/* on purpose (live venue-QR pilot) — see the header comment.
const PATHS = ["/m/*", "/meal/*", "/u/*", "/invite/*"]

const AASA = {
  applinks: {
    apps: [],
    details: [
      {
        appID: APP_IDS[0],
        appIDs: APP_IDS,
        paths: PATHS,
        components: PATHS.map((path) => ({ "/": path })),
      },
    ],
  },
}

export function GET() {
  return NextResponse.json(AASA, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
