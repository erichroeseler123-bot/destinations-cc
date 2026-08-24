/** @type {import('next').NextConfig} */
// Dedicated Vercel app root; shared monorepo modules are intentionally allowed.
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.juneauflightdeck.com" }],
        destination: "https://juneauflightdeck.com/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com" },
      { protocol: "https", hostname: "www.destinationcommandcenter.com" },
      { protocol: "https", hostname: "destinationcommandcenter.com" }
    ]
  },
  outputFileTracingRoot: '../../'
};

export default nextConfig;
