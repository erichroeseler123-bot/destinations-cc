import type { MetadataRoute } from "next";

const routes = [
  "",
  "/helicopter",
  "/juneau-whale-watching-tours",
  "/skagway/helicopter",
  "/about",
  "/faq",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/llms.txt",
  "/agent.json",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((route, index) => ({
    url: `https://juneauflightdeck.com${route}`,
    lastModified,
    changeFrequency: index < 4 ? "daily" : "monthly",
    priority: index === 0 ? 1 : index < 4 ? 0.9 : 0.5,
  }));
}
