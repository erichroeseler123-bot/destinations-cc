/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable full static export (required for Cloudflare Pages)
  output: "export",

  // Makes routes like /ports/juneau/ instead of /ports/juneau
  // Prevents Cloudflare 404 edge cases
  trailingSlash: true,

  // Cloudflare Pages cannot use Next image optimizer
  images: {
    unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // Prevent build crashes on optional data
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
