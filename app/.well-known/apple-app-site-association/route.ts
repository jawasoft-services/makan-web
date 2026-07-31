const details = [
  "T3Z49Z9YUB.com.makanofficial.makanapp",
  "T3Z49Z9YUB.com.makanofficial.makandev",
].map((appID) => ({
  appID,
  components: [
    {
      "/": "/invite/*",
      comment: "Makan table invite links",
    },
  ],
}))

export function GET() {
  return Response.json(
    { applinks: { apps: [], details } },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    },
  )
}
