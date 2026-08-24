export function GET() {
  const text = `User-agent: *\nAllow: /\n\nSitemap: https://shuttleya.com/sitemap.xml\n`;
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
