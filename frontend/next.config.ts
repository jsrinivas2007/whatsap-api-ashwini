import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: "http://localhost:3001/api/:path*",
        },
        {
          source: "/internal-ops/api/:path*",
          destination: "http://localhost:3001/internal-ops/api/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
