import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appRoot, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: repoRoot,
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.jetboatadv.com",
      },
      {
        protocol: "https",
        hostname: "originalwisconsinducks.com",
      },
      {
        protocol: "https",
        hostname: "www.dellsghostboat.com",
      },
      {
        protocol: "https",
        hostname: "www.dellsboats.com",
      },
    ],
  },
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
