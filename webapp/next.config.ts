import path from "node:path";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  htmlLimitedBots: /.*/,
  output: "standalone",
  pageExtensions: ["ts", "tsx", "mdx"],
  reactCompiler: true,
  serverExternalPackages: ["@duckdb/node-api", "@duckdb/node-bindings"],
  experimental: {
    mdxRs: {
      mdxType: "gfm",
    },
  },
};

// Blog MDX configuration
const withMDX = createMDX({});
const config = withMDX(nextConfig) as NextConfig;

// Turbopack (next dev) bypasses the webpack() callback above.
// @next/mdx registers its MDX rule at config.turbopack.rules['{*,next-mdx-rule}'].
// We append our loader so it runs first (Turbopack is also right-to-left).
const stripFrontmatterLoader = path.resolve(
  "./lib/blog/strip-frontmatter-loader.cjs",
);
const mdxRuleKey = "{*,next-mdx-rule}";
if (config.turbopack?.rules?.[mdxRuleKey]) {
  config.turbopack.rules[mdxRuleKey] = config.turbopack.rules[mdxRuleKey].map(
    // biome-ignore lint/suspicious/noExplicitAny: turbopack rule shape
    (rule: any) =>
      rule?.loaders
        ? {
            ...rule,
            loaders: [...rule.loaders, { loader: stripFrontmatterLoader }],
          }
        : rule,
  );
}

export default config;
