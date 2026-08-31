export function GET() {
  return Response.json(
    // Invite credentials live in URL fragments. HTTPS universal-link handoff
    // does not preserve them reliably, so invite URLs must open the safe web
    // landing first and enter Makan through its explicit custom-scheme CTA.
    { applinks: { apps: [], details: [] } },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    },
  )
}
