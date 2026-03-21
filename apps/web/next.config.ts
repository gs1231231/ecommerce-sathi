import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ecommerce-sathi/ui", "@ecommerce-sathi/shared"],
  output: "standalone",
};

export default nextConfig;
