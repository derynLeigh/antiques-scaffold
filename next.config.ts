import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp ships native binaries; keep it external so Next doesn't try to
  // bundle it into the serverless function (it's available at runtime).
  serverExternalPackages: ["sharp"],

  images: {
    // Allow next/image to load thumbnails from your public R2 domain.
    // Replace the hostname with your R2_PUBLIC_URL host once known.
    remotePatterns: [
      { protocol: "https", hostname: "pub-*.r2.dev" },
    ],
  },
};

export default nextConfig;
