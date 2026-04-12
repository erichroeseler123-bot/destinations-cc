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
          "/wp-content/",
        ],
      },
    ],
    sitemap: "https://destinationcommandcenter.com/sitemap.xml",
  };
}
