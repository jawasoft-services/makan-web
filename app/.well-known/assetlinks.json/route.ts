export function GET() {
  // Match iOS: table invite HTTPS links stay on the fragment-safe web landing
  // and open the installed app only after the user presses Open in Makan.
  return Response.json([], {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  })
}
