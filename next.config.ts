import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.printify.com" },
      { protocol: "https", hostname: "images-api.printify.com" },
    ],
    // Next 16 requires an explicit allowlist for quality values (default is
    // just [75]) — Printify's source photos are already fairly compressed,
    // so re-encoding them again at quality 75 makes them noticeably softer.
    qualities: [75, 95],
  },
};

export default nextConfig;
