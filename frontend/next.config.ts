import type { NextConfig } from "next";

// Backend origin used by the API rewrites.
// Set NEXT_PUBLIC_API_URL in Vercel (or any production host) to the deployed backend URL,
// e.g. https://your-backend.vercel.app. Defaults to the local dev server.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
