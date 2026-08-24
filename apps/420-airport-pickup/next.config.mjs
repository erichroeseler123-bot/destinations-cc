/** @type {import('next').NextConfig} */
// Dedicated Vercel app root; shared monorepo modules are intentionally allowed.
const nextConfig = {
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
