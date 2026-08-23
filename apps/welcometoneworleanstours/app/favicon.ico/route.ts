const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#171717"/><text x="32" y="42" text-anchor="middle" font-size="34" font-family="Georgia,serif" fill="#d6b46a">⚜</text></svg>`;

export function GET() {
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
