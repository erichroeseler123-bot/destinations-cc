/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "https://destinationcommandcenter.com/new-orleans",
        },
        {
          source: "/:path*",
          destination: "https://destinationcommandcenter.com/new-orleans/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
