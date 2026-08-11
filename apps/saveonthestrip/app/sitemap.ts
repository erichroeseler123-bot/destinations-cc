import type { MetadataRoute } from "next";

const routes = [
  "",
  "/tonight",
  "/worth-it",
  "/under-100",
  "/near-your-hotel",
  "/four-hours-in-vegas",
  "/before-a-late-flight",
  "/what-to-skip-in-las-vegas",
  "/compare/sphere-vs-vegas-show",
  "/compare/grand-canyon-vs-hoover-dam",
  "/shows",
  "/shows/sphere",
  "/tours",
  "/free-things",
  "/deals",
  "/hotels",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/llms.txt",
  "/agent.json",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((route, index) => ({
    url: `https://saveonthestrip.com${route}`,
    lastModified,
    changeFrequency: index <= 10 ? "daily" : "weekly",
    priority: index === 0 ? 1 : index <= 10 ? 0.9 : 0.7,
  }));
}
