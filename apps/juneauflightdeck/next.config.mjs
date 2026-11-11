import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appRoot, "../..");

/** @type {import('next').NextConfig} */
// Dedicated Vercel app root; shared monorepo modules are intentionally allowed.
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: repoRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.juneauflightdeck.com" }],
        destination: "https://juneauflightdeck.com/:path*",
        permanent: true,
      },
      {
        source: "/whale-deck",
        missing: [{ type: "query", key: "flight_canceled" }],
        destination: "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching",
        permanent: true,
      },
      {
        source: "/juneau-whale-watching-tours",
        missing: [{ type: "query", key: "flight_canceled" }],
        destination: "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching",
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "api.qrserver.com", pathname: "/**" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com", pathname: "/**" },
      { protocol: "https", hostname: "hare-media-cdn.tripadvisor.com", pathname: "/**" },
      { protocol: "https", hostname: "media.tacdn.com", pathname: "/**" },
      { protocol: "https", hostname: "dynamic-media-cdn.tripadvisor.com", pathname: "/**" },
      { protocol: "https", hostname: "**.tripadvisor.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.filestackcontent.com", pathname: "/**" },
      { protocol: "https", hostname: "www.destinationcommandcenter.com", pathname: "/**" },
      { protocol: "https", hostname: "destinationcommandcenter.com", pathname: "/**" },
    ],
  },
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
