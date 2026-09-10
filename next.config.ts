import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone",
  images: {
    localPatterns: [
      {
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5gb",
    },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon.png",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
