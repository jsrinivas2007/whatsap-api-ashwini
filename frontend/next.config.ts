import type { NextConfig } from "next";

// Backend origin used by the API rewrites.
// NEXT_PUBLIC_API_URL should be set in Vercel to the deployed backend URL, but as a
// safety net the production build falls back to the Render backend (NOT localhost) so a
// missing env var can never make the rewrite resolve to a private IP (DNS_HOSTNAME_RESOLVED_PRIVATE).
// Local dev still resolves to http://localhost:3001. Trailing slashes are stripped so
// "/api/..." joins never produce "//api/...".
const PROD_API_URL = "https://whatsap-api-ashwini.onrender.com";

let API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
// Treat loopback/private hosts as "not configured".
const isLocalhost = !API_URL || /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(API_URL);
if (isLocalhost) {
  // In production we MUST NOT proxy to a private IP (Vercel error: DNS_HOSTNAME_RESOLVED_PRIVATE),
  // so force the deployed Render backend. Local dev keeps using http://localhost:3001.
  API_URL = process.env.NODE_ENV === "production" ? PROD_API_URL : "http://localhost:3001";
}

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${API_URL}/api/:path*`,
        },
        {
          source: "/internal-ops/api/:path*",
          destination: `${API_URL}/internal-ops/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
