const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@clerk/nextjs/server": path.resolve(__dirname, "src/lib/auth/dev-clerk-server.ts"),
      "@clerk/nextjs": path.resolve(__dirname, "src/lib/auth/dev-clerk-client.tsx"),
    };
    return config;
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.clerk.com" },
      { protocol: "https", hostname: "**.sportsdata.io" },
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "**.cdnlogo.com" },
    ],
  },
  // PWA support
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],
};

module.exports = nextConfig;
