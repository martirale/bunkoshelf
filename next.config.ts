import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "5gb",
    },
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
