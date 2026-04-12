import type { MetadataRoute } from "next";
import { VISIBLE_SURFACE_PATHS } from "@/src/data/visible-surface";

const BASE_URL = "https://destinationcommandcenter.com";

const CHANGE_FREQUENCY: Record<string, MetadataRoute.Sitemap[number]["changeFrequency"]> = {
  "/": "weekly",
  "/red-rocks-transportation": "weekly",
  "/red-rocks-shuttle": "monthly",
  "/red-rocks-parking": "monthly",
  "/sedona/jeep-tours": "weekly",
  "/juneau/helicopter-tours": "weekly",
  "/juneau/whale-watching-tours": "weekly",
  "/command": "daily",
};

const PRIORITY: Record<string, number> = {
  "/": 1,
  "/red-rocks-transportation": 0.95,
  "/red-rocks-shuttle": 0.8,
  "/red-rocks-parking": 0.76,
  "/sedona/jeep-tours": 0.82,
  "/juneau/helicopter-tours": 0.82,
  "/juneau/whale-watching-tours": 0.82,
  "/command": 0.72,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return VISIBLE_SURFACE_PATHS.map((pathname) => ({
    url: `${BASE_URL}${pathname}`,
    lastModified,
    changeFrequency: CHANGE_FREQUENCY[pathname] ?? "monthly",
    priority: PRIORITY[pathname] ?? 0.7,
  }));
}
