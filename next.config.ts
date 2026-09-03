import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'",
  // Framer Motion and React style props require inline styles. Script execution
  // remains strict in production; styles cannot execute JavaScript.
  "style-src 'self' 'unsafe-inline'",
  // Meal photos (Firebase), OpenStreetMap tiles for the maps, and Google
  // Places photos for restaurant heroes (lh3.googleusercontent.com).
  "img-src 'self' blob: data: https://firebasestorage.googleapis.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://lh3.googleusercontent.com",
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
  images: {
    // The Hobby quota is capped at 5,000 billed transformations. This site is
    // deliberately image-heavy, so width variants from /_next/image exhausted
    // the allowance and began erroring. Serve browser-ready variants generated
    // at build time instead. next/image still provides layout, lazy loading and
    // priority hints for the remaining small/dynamic images, but never calls
    // Vercel's transformer.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // Versioned, build-generated assets. Bump the v1 directory if their
        // visual contents change so a year-long browser cache stays safe.
        source: "/static-images/v1/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/invite/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
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

export default withNextIntl(nextConfig);
