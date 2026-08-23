/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/webp"],
    qualities: [15, 30, 45, 55, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/guides/null", destination: "/guides", permanent: true },
      { source: "/categories/swamp-tours", destination: "/swamp-tours", permanent: true },
      { source: "/categories/food-and-cocktail-tours", destination: "/food-tours", permanent: true },
      { source: "/swamp-tours/pickup-vs-self-drive", destination: "/swamp-tours", permanent: true },
      { source: "/swamp-tours/airboat-vs-covered-boat", destination: "/compare/covered-swamp-boat-vs-airboat", permanent: true },
      { source: "/family-friendly-new-orleans-tours", destination: "/guides/new-orleans-tours-for-families", permanent: true },
    ];
  },
};

export default nextConfig;
