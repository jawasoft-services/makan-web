import { NextResponse } from "next/server";

// Apple App Site Association (AASA) for Makan Universal Links.
// Served at https://www.makanofficial.com/.well-known/apple-app-site-association
// Team ID T3Z49Z9YUB + bundle com.makanofficial.makanapp, matching /invite/* links.
// The iOS app must also declare `applinks:www.makanofficial.com` / `applinks:makanofficial.com`
// in its Associated Domains entitlement (shipped in a native build) for this to take effect.
const AASA = {
  applinks: {
    details: [
      {
        appIDs: ["T3Z49Z9YUB.com.makanofficial.makanapp"],
        components: [
          {
            "/": "/invite/*",
            comment: "Matches any Friends invite link and opens it in the Makan app",
          },
        ],
      },
    ],
  },
  webcredentials: {
    apps: ["T3Z49Z9YUB.com.makanofficial.makanapp"],
  },
};

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(AASA, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
