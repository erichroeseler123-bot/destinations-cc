const urls = [
  "https://shuttleya.com/",
  "https://shuttleya.com/airport-shuttles",
  "https://shuttleya.com/ski-shuttles",
  "https://shuttleya.com/concert-transportation",
  "https://shuttleya.com/cruise-port-transportation",
  "https://shuttleya.com/agent.json",
  "https://shuttleya.com/llms.txt",
];

export function GET() {
  const lastmod = "2026-08-24";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
