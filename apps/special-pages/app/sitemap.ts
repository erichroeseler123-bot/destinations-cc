export default function sitemap() {
  const base = "https://destinationcommandcenter.com";
  const routes = ["", "/mighty-argo-shuttle", "/vegas", "/alaska", "/cruises", "/national-parks", "/new-orleans"];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}
