import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent ESLint errors from blocking production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    // Suppress the noisy dynamic-require warnings from libheif-js
    config.ignoreWarnings = [
      /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
    ];
    return config;
  },
};

export default nextConfig;