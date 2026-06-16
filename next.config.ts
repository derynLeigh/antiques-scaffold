import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp ships native binaries; keep it external so Next doesn't try to
  // bundle it into the serverless function (it's available at runtime).
  serverExternalPackages: ["sharp"],

  // Server Actions default to a 1MB request-body cap, which rejects
  // larger uploads before our action (and sharp) ever run. Raise it so
  // phone photos go through; sharp then shrinks them for storage anyway.
  // NOTE: on Vercel, the platform also caps serverless request bodies at
  // ~4.5MB, so values above that won't help in production — keeping this
  // at 5mb covers any normal photo while staying near that ceiling.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

  images: {
    // Allow next/image to load thumbnails from your public R2 domain.
    // Replace the hostname with your R2_PUBLIC_URL host once known.
    remotePatterns: [
      { protocol: "https", hostname: "pub-*.r2.dev" },
    ],
  },
};

export default nextConfig;
