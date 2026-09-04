import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Bypass next/image disk LRU — Next 15 + Turbopack can write 0-byte
    // cache files that permanently poison the optimizer (calculateSize = 0).
    // Local /public assets are already sized for the shop.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "modelviewer.dev" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "static.specsonline.com" },
      { protocol: "https", hostname: "cdn.specsonline.com" },
      { protocol: "https", hostname: "images.liquorapps.com" },
      { protocol: "https", hostname: "www.totalwine.com" },
    ],
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
