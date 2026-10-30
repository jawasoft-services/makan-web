// RM20363 — claim links (/claim/<token>) open the installed app on "Is this your
// restaurant?". MakanDev claims them too so testers can scan a dev venue's QR.
const CLAIM_COMPONENT = { "/": "/claim/*", comment: "Open a venue claim link in Makan" }

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
          }, CLAIM_COMPONENT],
        }, {
          appIDs: ["T3Z49Z9YUB.com.makanofficial.makandev"],
          components: [CLAIM_COMPONENT],
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
