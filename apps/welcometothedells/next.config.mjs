import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    root: appRoot,
  },
};

export default nextConfig;
