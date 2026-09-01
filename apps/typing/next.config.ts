import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@writeabout/ui", "@writeabout/types", "@writeabout/validation", "@writeabout/auth", "@writeabout/db"],
};

export default nextConfig;
