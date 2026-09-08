import type { NextConfig } from "next";

/**
 * All HTTP security headers live here. The policy is `default-src 'self'`:
 * fonts are self-hosted through next/font, the world map is inline SVG and
 * every threat feed is fetched server-side, so no third-party host is needed.
 * `'unsafe-inline'` on script-src is required for RSC hydration; on style-src
 * for Tailwind v4. Neither can be dropped without a nonce-based CSP.
 */
const dev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  // React's dev overlay needs eval; production never does.
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
