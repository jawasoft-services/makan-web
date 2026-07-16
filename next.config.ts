import type { NextConfig } from "next";

// Security response headers applied to every route.
// Conservative subset — zero breakage risk. A nonce-based script-src CSP is a
// follow-up (needs nonce wiring through Next's inline runtime + Vercel Analytics).
const securityHeaders = [
  // Clickjacking protection (legacy header for older browsers).
  { key: "X-Frame-Options", value: "DENY" },
  // Block MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer leakage on cross-origin navigation.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 1 year + apply to subdomains. No `preload` so we can
  // roll back without going through the preload-list removal process.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Deny powerful browser APIs we don't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Modern clickjacking protection. Full CSP (script-src/style-src) is deferred —
  // see TODO above; ship the part with zero compatibility risk first.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  // The opengraph-image route reads meal thumbnails + the Plus Jakarta Sans
  // TTFs off disk at render time. Vercel's tracer can't see the runtime
  // `join(process.cwd(), ...)` paths, so force these assets into the route's
  // serverless bundle (else ENOENT in prod).
  outputFileTracingIncludes: {
    "/opengraph-image": ["./public/og-tiles/**", "./public/fonts/*.ttf"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
    // Vercel bills an image cache write on every optimizer MISS *and* STALE.
    // Firebase Storage serves meal photos `Cache-Control: private, max-age=0`,
    // and Next floors the optimizer TTL at minimumCacheTTL, so the default 4h
    // meant every remote variant on the homepage strip was re-written six times
    // a day forever — the bulk of the Hobby cache-write budget, burned on
    // re-encoding identical bytes. Storage URLs are content-addressed and carry
    // a token, so a photo behind a given URL never changes: 31 days is safe.
    minimumCacheTTL: 2678400,
    // Nothing renders above ~1200 CSS px, and the meal sources top out near
    // 2048 — Next never upscales, so the 2048/3840 candidates only ever minted
    // duplicate cache keys holding bytes identical to the 1920 entry.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 64, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // 301 the stale pre-launch URLs Google still has indexed (GSC "Not found 404",
  // 2026-06-19) to their live equivalents — clears the 404s and preserves any
  // link equity (e.g. from old backlinks).
  async redirects() {
    return [
      { source: "/join-the-waitlist", destination: "/", permanent: true },
      { source: "/tou", destination: "/tos", permanent: true },
      { source: "/success", destination: "/", permanent: true },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/about", destination: "/story", permanent: true },
      { source: "/press", destination: "/story", permanent: true },
    ];
  },
};

export default nextConfig;
