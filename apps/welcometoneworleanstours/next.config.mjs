/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "https://www.destinationcommandcenter.com/new-orleans",
        },
        {
          source: "/:path*",
          destination: "https://www.destinationcommandcenter.com/new-orleans/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
