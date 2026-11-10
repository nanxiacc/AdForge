import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cheerio", "sharp"],
  devIndicators: false,
};

export default nextConfig;
