import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: { unoptimized: true },
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  devIndicators: false,
  allowedDevOrigins: ["*.e2b.app"],
  outputFileTracingExcludes: {
    "*": [
      "./tests/**/*",
      "./Tradeintra_Documentation_Pack/**/*",
      "./.playwright-mcp/**/*",
      "./.github/**/*",
      "./README.md",
      "./node_modules/@electric-sql/**/*",
      "./node_modules/@img/**/*",
      "./node_modules/sharp/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
          },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
