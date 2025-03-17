import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['pbs.twimg.com'],
  },
};

export default nextConfig;
