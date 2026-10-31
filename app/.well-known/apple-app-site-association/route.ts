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
          }],
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
