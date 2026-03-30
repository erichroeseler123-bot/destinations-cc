export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/_next/",
          "/_vercel/",
        ],
      },
    ],
    sitemap: "https://destinationcommandcenter.com/sitemap.xml",
  };
}
