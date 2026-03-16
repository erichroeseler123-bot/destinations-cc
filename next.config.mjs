import { buildCitySatelliteRedirects, buildSatelliteRedirects } from "./src/data/edge-routing-rules.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.viator.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async redirects() {
    const satelliteRedirects = buildSatelliteRedirects();
    const citySatelliteRedirects = buildCitySatelliteRedirects();
    return [
      ...satelliteRedirects,
      ...citySatelliteRedirects,
      {
        source: "/concert-shuttles",
        destination: "/transportation",
        permanent: false,
      },
      {
        source: "/red-rocks/transportation",
        destination: "/red-rocks-transportation",
        permanent: false,
      },
      {
        source: "/red-rocks/parking",
        destination: "/red-rocks-parking",
        permanent: false,
      },
      {
        source: "/.env",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/env",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/config.js",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/config.json",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/__env.js",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/@vite/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/wp-admin/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/wp-login/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/phpmyadmin/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/.git/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/vegas/shows",
        destination: "/las-vegas/shows",
        permanent: false,
      },
      {
        source: "/vegas/shows/:path*",
        destination: "/las-vegas/shows/:path*",
        permanent: false,
      },
      {
        source: "/vegas/tours",
        destination: "/las-vegas/tours",
        permanent: false,
      },
      {
        source: "/vegas/tours/:path*",
        destination: "/las-vegas/tours/:path*",
        permanent: false,
      },
      {
        source: "/vegas/attractions",
        destination: "/las-vegas/attractions",
        permanent: false,
      },
      {
        source: "/vegas/attractions/:path*",
        destination: "/las-vegas/attractions/:path*",
        permanent: false,
      },
      {
        source: "/vegas/day-trips",
        destination: "/las-vegas/day-trips",
        permanent: false,
      },
      {
        source: "/vegas/day-trips/:path*",
        destination: "/las-vegas/day-trips/:path*",
        permanent: false,
      },
      {
        source: "/vegas/helicopter",
        destination: "/las-vegas/helicopter",
        permanent: false,
      },
      {
        source: "/vegas/helicopter/:path*",
        destination: "/las-vegas/helicopter/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv",
        destination: "/vegas",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/shows",
        destination: "/las-vegas/shows",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/shows/:path*",
        destination: "/las-vegas/shows/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/tours",
        destination: "/las-vegas/tours",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/tours/:path*",
        destination: "/las-vegas/tours/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/attractions",
        destination: "/las-vegas/attractions",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/attractions/:path*",
        destination: "/las-vegas/attractions/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/day-trips",
        destination: "/las-vegas/day-trips",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/day-trips/:path*",
        destination: "/las-vegas/day-trips/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/helicopter",
        destination: "/las-vegas/helicopter",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/helicopter/:path*",
        destination: "/las-vegas/helicopter/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/helicopter-tours",
        destination: "/las-vegas/helicopter-tours",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/helicopter-tours/:path*",
        destination: "/las-vegas/helicopter-tours/:path*",
        permanent: false,
      },
      {
        source: "/:city/:lane(cruises|events|transport)",
        destination: "/nodes/:city?alive=:lane",
        permanent: false,
      },
    ];
  },
};
export default nextConfig;
