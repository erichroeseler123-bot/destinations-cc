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
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "api.qrserver.com", pathname: "/**" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com", pathname: "/**" },
      { protocol: "https", hostname: "hare-media-cdn.tripadvisor.com", pathname: "/**" },
      { protocol: "https", hostname: "media.tacdn.com", pathname: "/**" },
      { protocol: "https", hostname: "dynamic-media-cdn.tripadvisor.com", pathname: "/**" },
      { protocol: "https", hostname: "**.tripadvisor.com", pathname: "/**" },
      { protocol: "https", hostname: "**.tacdn.com", pathname: "/**" },
      { protocol: "https", hostname: "www.destinationcommandcenter.com", pathname: "/**" },
      { protocol: "https", hostname: "destinationcommandcenter.com", pathname: "/**" },
    ],
  },
  outputFileTracingRoot: '../../'
};

export default nextConfig;
