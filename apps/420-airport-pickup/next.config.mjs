import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appRoot, "../..");

/** @type {import('next').NextConfig} */
// Dedicated Vercel app root; shared monorepo modules are intentionally allowed.
const nextConfig = {
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
        source: "/:path*",
        has: [{ type: "host", value: "www.420friendlyairportpickup.com" }],
        destination: "https://420friendlyairportpickup.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
