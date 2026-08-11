import type { MetadataRoute } from "next";

const routes = [
  "",
  "/helicopter",
  "/juneau/helicopter",
  "/juneau-whale-watching-tours",
  "/juneau/what-to-do-if-helicopter-tour-canceled",
  "/what-to-do-in-juneau-cruise-port",
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
    changeFrequency: index < 7 ? "daily" : "monthly",
    priority: index === 0 ? 1 : index < 7 ? 0.9 : 0.5,
  }));
}
