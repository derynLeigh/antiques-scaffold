import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // R2 image domain goes here in Phase 2 so next/image can serve thumbnails:
  // images: { remotePatterns: [{ protocol: "https", hostname: "<your-r2-domain>" }] },
};

export default nextConfig;
