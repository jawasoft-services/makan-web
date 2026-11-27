// RM20363 — claim links (/claim/<token>) open the installed app on "Is this your
// restaurant?". MakanDev claims them too so testers can scan a dev venue's QR.
// Indonesian browsers are localised to /id/claim/<token>; the app opens that form too.
// RM20333 — restaurant and dish links (/p/<placeId>[/<dishId>]) open the installed app the same way;
// the friend without the app gets the web page.
const CLAIM_COMPONENTS = [
  { "/": "/claim/*", comment: "Open a venue claim link in Makan" },
  { "/": "/id/claim/*", comment: "Open an Indonesian venue claim link in Makan" },
  { "/": "/p/*", comment: "Open a restaurant or dish link in Makan" },
  { "/": "/id/p/*", comment: "Open an Indonesian restaurant or dish link in Makan" },
  // RM20356 — the verification email's Continue link returns to the app's Verify screen.
  { "/": "/verified", comment: "Return to Makan after verifying an email address" },
]

// RM20616 growth item 1 (App Clip), unit U4 — the MakanDev App Clip, and the MakanDev app taking
// restaurant page links (/places/<slug>, the table card's QR and every shared place link). Behind
// APP_CLIP_DEV_LINKS, on only for the exact value "1": with it off this file is exactly what it was
// before this unit. The production app's /places/ links and its clip are the release step (A12).
// Apple: "Associating your App Clip with your website" (the `appclips` key) and "Supporting associated
// domains" (<team id>.<bundle id>; the team id is the one this file already uses).
const DEV_CLIP_APP_ID = "T3Z49Z9YUB.com.makanofficial.makandev.Clip"
const DEV_PLACE_COMPONENTS = [
  { "/": "/places/*", comment: "Open a restaurant page link in MakanDev" },
  { "/": "/id/places/*", comment: "Open an Indonesian restaurant page link in MakanDev" },
]

const appClipDevLinksOn = (): boolean => process.env.APP_CLIP_DEV_LINKS === "1"

export function GET() {
  const clip = appClipDevLinksOn()
  return Response.json(
    {
      applinks: {
        apps: [],
        details: [{
          appIDs: ["T3Z49Z9YUB.com.makanofficial.makanapp"],
          // Claim only a complete fragment-bearing invite. If an intermediary
          // removes the fragment, iOS leaves the existing web landing in charge.
          components: [{
            "/": `/invite/${"?".repeat(12)}`,
            "#": `s=${"?".repeat(43)}`,
            comment: "Open a complete table invite in Makan",
          }, ...CLAIM_COMPONENTS],
        }, {
          appIDs: ["T3Z49Z9YUB.com.makanofficial.makandev"],
          components: clip ? [...CLAIM_COMPONENTS, ...DEV_PLACE_COMPONENTS] : CLAIM_COMPONENTS,
        }],
      },
      ...(clip ? { appclips: { apps: [DEV_CLIP_APP_ID] } } : {}),
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    },
  )
}
