import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fareharbor.com" },
      { protocol: "https", hostname: "*.fareharbor.com" },
      { protocol: "https", hostname: "cloudfront.fareharbor.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "s1.ticketm.net" },
      { protocol: "https", hostname: "*.ticketmaster.com" },
      { protocol: "https", hostname: "seatgeekimages.com" },
      { protocol: "https", hostname: "*.seatgeekimages.com" },
      { protocol: "https", hostname: "images.seatgeek.com" },
      { protocol: "https", hostname: "static.seatgeek.com" },
      { protocol: "https", hostname: "www.destinationcommandcenter.com" },
      { protocol: "https", hostname: "destinationcommandcenter.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/images/:path*",
        destination: "https://www.destinationcommandcenter.com/images/:path*",
      },
    ];
  },
};

export default nextConfig;
