import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'",
  // Framer Motion and React style props require inline styles. Script execution
  // remains strict in production; styles cannot execute JavaScript.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://firebasestorage.googleapis.com",
  "font-src 'self' data:",
  "connect-src 'self' https://firebasestorage.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

// Security response headers applied to every route.
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
  // Next's static App Router output includes inline RSC bootstrap scripts.
  // Allow those while blocking inline event handlers, eval and third-party JS.
  // A nonce would disable static rendering/ISR and CDN caching for every page.
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  // This repository lives below a user-level lockfile; pin tracing to the
  // actual app so Next does not infer the home directory as the build root.
  outputFileTracingRoot: process.cwd(),
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
    // 320/512 close the common 256px@1.25x and 280px@1.75x gaps, avoiding a
    // jump to 384/640 for hero cards and phone screenshots.
    imageSizes: [32, 64, 128, 256, 320, 384, 512],
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
