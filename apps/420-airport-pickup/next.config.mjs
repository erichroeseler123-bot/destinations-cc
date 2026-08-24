/** @type {import('next').NextConfig} */
// Dedicated Vercel app root; shared monorepo modules are intentionally allowed.
const nextConfig = {
  experimental: {
    externalDir: true,
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
