import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repoRoot,
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: repoRoot,
  },
  async redirects() {
    return [
      {
        source: "/juneau",
        destination: "/ports/juneau",
        permanent: true,
      },
      {
        source: "/skagway",
        destination: "/ports/skagway",
        permanent: true,
      },
      {
        source: "/ketchikan",
        destination: "/ports/ketchikan",
        permanent: true,
      },
      {
        source: "/sitka",
        destination: "/ports/sitka",
        permanent: true,
      },
      {
        source: "/icy-strait-point",
        destination: "/ports/icy-strait-point",
        permanent: true,
      },
      {
        source: "/hoonah",
        destination: "/ports/icy-strait-point",
        permanent: true,
      },
      {
        source: "/cruise-ships/:shipSlug/victoria-bc-shore-excursions",
        destination: "/cruise-ships/:shipSlug",
        permanent: true,
      },
      {
        source: "/cruise-ships/:shipSlug/victoria-bc",
        destination: "/cruise-ships/:shipSlug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
