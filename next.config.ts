import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['pbs.twimg.com', 'ipfs.io', 'rabita.club'],
  },
};

export default nextConfig;
