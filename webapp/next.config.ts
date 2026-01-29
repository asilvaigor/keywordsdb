import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  htmlLimitedBots: /.*/,
  output: "standalone",
  reactCompiler: true,
};

export default nextConfig;
