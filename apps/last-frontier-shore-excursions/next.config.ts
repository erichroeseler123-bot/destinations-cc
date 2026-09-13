import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/juneau",
        destination: "/ports/juneau",
        permanent: true,
      },
      {
        source: "/skagway",
        destination: "/ports/skagway",
        permanent: true,
      },
      {
        source: "/ketchikan",
        destination: "/ports/ketchikan",
        permanent: true,
      },
      {
        source: "/sitka",
        destination: "/ports/sitka",
        permanent: true,
      },
      {
        source: "/icy-strait-point",
        destination: "/ports/icy-strait-point",
        permanent: true,
      },
      {
        source: "/hoonah",
        destination: "/ports/icy-strait-point",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
