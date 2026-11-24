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

// RM20616 A12 U3 — the links a Share v2 share sends (munchies-rn utils/shareLinks.ts): a restaurant page,
// a public profile and a meal. MakanDev only: the App Store app gains nothing until its release carries
// the screens. Taste links stay out, as RM20320's review left them: a build without the screen would open
// a dead end, and a taste share sends the profile link.
//
// This file is NOT behind SHARE_V2_PAGES: it takes effect when it reaches main, and from then a phone
// with MakanDev installed opens these links in MakanDev. The Share v2 pages do not depend on it; this
// commit can be merged with them, later, or not at all.
const DEV_SHARE_COMPONENTS = [
  { "/": "/places/*", comment: "Open a shared restaurant page in Makan" },
  { "/": "/id/places/*", comment: "Open an Indonesian shared restaurant page in Makan" },
  { "/": "/u/*", comment: "Open a shared profile in Makan" },
  { "/": "/id/u/*", comment: "Open an Indonesian shared profile in Makan" },
  { "/": "/meal/*", comment: "Open a shared meal in Makan" },
  { "/": "/id/meal/*", comment: "Open an Indonesian shared meal in Makan" },
]

export function GET() {
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
          components: [...CLAIM_COMPONENTS, ...DEV_SHARE_COMPONENTS],
        }],
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    },
  )
}
