import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appRoot, "../..");
const effectiveRoot = process.env.DCC_TURBOPACK_ROOT?.trim() || repoRoot;

/** @type {import('next').NextConfig} */
// Stage 2 Machine Contract Pilot Release
const nextConfig = {
  outputFileTracingRoot: effectiveRoot,
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: effectiveRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1600, 1920],
    qualities: [15, 30, 45, 55, 75, 80, 82],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "welcometoneworleanstours.com" }],
        destination: "https://www.welcometoneworleanstours.com/:path*",
        permanent: true,
      },
      { source: "/things-to-do-in-new-orleans-today", destination: "/guides/things-to-do-in-new-orleans-today", permanent: true },
      { source: "/guides/null", destination: "/guides", permanent: true },
      { source: "/categories/swamp-tours", destination: "/swamp-tours", permanent: true },
      { source: "/categories/food-and-cocktail-tours", destination: "/food-tours", permanent: true },
      { source: "/swamp-tours/pickup-vs-self-drive", destination: "/swamp-tours", permanent: true },
      { source: "/swamp-tours/airboat-vs-covered-boat", destination: "/compare/covered-swamp-boat-vs-airboat", permanent: true },
      { source: "/family-friendly-new-orleans-tours", destination: "/guides/new-orleans-tours-for-families", permanent: true },
      { source: "/best-swamp-tour-with-transportation", destination: "/guides/best-swamp-tour-with-transportation", permanent: true },
      { source: "/new-orleans-plantation-and-swamp-tour", destination: "/guides/new-orleans-plantation-and-swamp-tour", permanent: true },
      { source: "/new-orleans-tours-with-transportation", destination: "/guides/new-orleans-tours-with-transportation", permanent: true },
      { source: "/new-orleans/tonight", destination: "/guides/tonight", permanent: true },
      { source: "/new-orleans/this-weekend", destination: "/guides/this-weekend", permanent: true },
      { source: "/plantation-tours/oak-alley-vs-laura", destination: "/guides/oak-alley-plantation-tour-from-new-orleans", permanent: true },
      { source: "/new-orleans/restaurant-partners", destination: "/contact", permanent: true },
      { source: "/guides/new-orleans-tours-tonight", destination: "/guides/tonight", permanent: true },
      { source: "/guides/french-quarter-orientation", destination: "/help-me-choose", permanent: true },
      { source: "/guides/restaurant-partners", destination: "/contact", permanent: true },
      { source: "/guides/tour-catalog", destination: "/tours", permanent: true },
      { source: "/tours/airboat-small", destination: "/tours/small-airboat-swamp-adventure", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://www.destinationcommandcenter.com/api/v1/:path*",
      },
      {
        source: "/embed/:path*",
        destination: "https://www.destinationcommandcenter.com/embed/:path*",
      },
    ];
  },
};

export default nextConfig;
