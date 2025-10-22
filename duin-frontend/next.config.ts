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
    // Use fewer workers to reduce memory usage
    workerThreads: false,
    // Disable features that use more memory
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-popover'],
  },
  // Reduce memory usage
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  // Optimize for memory usage
  output: 'standalone',
};

export default nextConfig;
