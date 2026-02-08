import fs from "fs";
import path from "path";

type Port = {
  slug: string;
};

type Region = {
  slug: string;
};

export default function sitemap() {
  const baseUrl = "https://destinationcommandcenter.com";

  /* -----------------------------
     Load Ports
  ----------------------------- */

  const portsPath = path.join(
    process.cwd(),
    "data",
    "ports.generated.json"
  );

  const ports: Port[] = JSON.parse(
    fs.readFileSync(portsPath, "utf-8")
  );

  /* -----------------------------
     Load Regions
     (If regions are static, hardcode.
      If generated later, mirror ports.)
  ----------------------------- */

  const regions: Region[] = [
    { slug: "alaska" },
    { slug: "australia" },
    { slug: "bahamas" },
    { slug: "canada" },
    { slug: "denmark" },
    { slug: "florida" },
    { slug: "italy" },
    { slug: "mexico" },
    { slug: "puerto-rico" },
    { slug: "spain" },
    { slug: "texas" },
    { slug: "united-kingdom" },
  ];

  /* -----------------------------
     Static URLs
  ----------------------------- */

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
  ];

  /* -----------------------------
     Region URLs
  ----------------------------- */

  const regionUrls = regions.map((region) => ({
    url: `${baseUrl}/regions/${region.slug}`,
    lastModified: new Date(),
  }));

  /* -----------------------------
     Port URLs
  ----------------------------- */

  const portUrls = ports.map((port) => ({
    url: `${baseUrl}/ports/${port.slug}`,
    lastModified: new Date(),
  }));

  /* -----------------------------
     Final Sitemap
  ----------------------------- */

  return [
    ...staticUrls,
    ...regionUrls,
    ...portUrls,
  ];
}
