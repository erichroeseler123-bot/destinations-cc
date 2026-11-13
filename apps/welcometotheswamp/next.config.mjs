/** @type {import('next').NextConfig} */
// Dedicated Vercel app root; shared monorepo modules are intentionally allowed.
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    externalDir: true,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.welcometotheswamp.com" }],
        destination: "https://welcometotheswamp.com/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com" },
      { protocol: "https", hostname: "www.destinationcommandcenter.com" },
      { protocol: "https", hostname: "destinationcommandcenter.com" }
    ]
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
