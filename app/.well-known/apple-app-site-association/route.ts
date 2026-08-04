export function GET() {
  return Response.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appIDs: ["T3Z49Z9YUB.com.makanofficial.makanapp"],
            components: [
              {
                "/": "/club/*",
                comment: "Permanent Restaurant Club venue routes. The app resolves the slug to an exact server-owned venue before showing or recording anything.",
              },
            ],
          },
        ],
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
