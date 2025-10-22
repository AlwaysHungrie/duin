import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Memory optimization settings
  experimental: {
    // Reduce memory usage during build
    memoryBasedWorkersCount: true,
  },
  // Optimize bundle size
  swcMinify: true,
  // Reduce memory usage
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
