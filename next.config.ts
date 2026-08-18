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
    ],
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
