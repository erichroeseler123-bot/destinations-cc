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
        // Hoonah and Icy Strait Point are separate canonical entities & pages.
        // Never redirect /hoonah or /ports/hoonah into /ports/icy-strait-point.
        source: "/hoonah",
        destination: "/ports/hoonah",
        permanent: true,
      },
      {
        source: "/haines",
        destination: "/ports/haines",
        permanent: true,
      },
      {
        source: "/wrangell",
        destination: "/ports/wrangell",
        permanent: true,
      },
      {
        source: "/petersburg",
        destination: "/ports/petersburg",
        permanent: true,
      },
      {
        source: "/klawock",
        destination: "/ports/klawock",
        permanent: true,
      },
      {
        source: "/gustavus",
        destination: "/ports/gustavus",
        permanent: true,
      },
      {
        // Glacier Bay and Gustavus are separate canonical entities & pages.
        // Never redirect /glacier-bay or /ports/glacier-bay into /ports/gustavus.
        source: "/glacier-bay",
        destination: "/ports/glacier-bay",
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
