/** @type {import('next').NextConfig} */
// Stage 2 Machine Contract Pilot Release
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
      { source: "/new-orleans/tonight", destination: "/guides/tonight", permanent: true },
      { source: "/new-orleans/this-weekend", destination: "/guides/this-weekend", permanent: true },
      { source: "/plantation-tours/oak-alley-vs-laura", destination: "/guides/oak-alley-plantation-tour-from-new-orleans", permanent: true },
      { source: "/new-orleans/restaurant-partners", destination: "/contact", permanent: true },
      { source: "/guides/new-orleans-tours-tonight", destination: "/guides/tonight", permanent: true },
      { source: "/guides/french-quarter-orientation", destination: "/help-me-choose", permanent: true },
      { source: "/guides/restaurant-partners", destination: "/contact", permanent: true },
      { source: "/guides/tour-catalog", destination: "/tours", permanent: true },
    ];
  },
};

export default nextConfig;
