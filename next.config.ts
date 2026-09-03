import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * This site is shared by link with specific people. The password gate in
   * proxy.ts is the actual access control; this header is the belt-and-braces
   * instruction to crawlers and caches, applied to every response including
   * ones that never render a <head> (API routes, redirects, images).
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
