import type { NextConfig } from "next";

// Backend origin used by the API rewrites.
// NEXT_PUBLIC_API_URL should be set in Vercel to the deployed backend URL, but as a
// safety net the production build falls back to the Render backend (NOT localhost) so a
// missing env var can never make the rewrite resolve to a private IP (DNS_HOSTNAME_RESOLVED_PRIVATE).
// Local dev still resolves to http://localhost:3001. Trailing slashes are stripped so
// "/api/..." joins never produce "//api/...".
const PROD_API_URL = "https://whatsap-api-ashwini.onrender.com";
const DEFAULT_API_URL = process.env.NODE_ENV === "production" ? PROD_API_URL : "http://localhost:3001";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

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
