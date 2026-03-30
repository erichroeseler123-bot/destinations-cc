import { setTimeout as delay } from "node:timers/promises";

const origin = process.argv[2] || "https://www.destinationcommandcenter.com";
const maxPages = Number(process.argv[3] || 25);

function normalizeUrl(input, base) {
  try {
    const url = new URL(input, base);
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function isHtmlResponse(contentType) {
  return typeof contentType === "string" && contentType.includes("text/html");
}

function extractLinks(html, pageUrl) {
  const links = new Set();
  const pattern = /href\s*=\s*"([^"]+)"|href\s*=\s*'([^']+)'/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const raw = match[1] || match[2] || "";
    if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) continue;
    const url = normalizeUrl(raw, pageUrl);
    if (!url) continue;
    if (url.origin !== new URL(pageUrl).origin) continue;
    links.add(url.toString());
  }
  return [...links];
}

async function requestUrl(url) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
    headers: {
      "user-agent": "dcc-link-checker/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  });
  const location = response.headers.get("location");
  return {
    status: response.status,
    ok: response.ok,
    location,
    contentType: response.headers.get("content-type"),
    body: response.ok ? await response.text() : "",
  };
}

async function main() {
  const root = normalizeUrl(origin, origin);
  if (!root) throw new Error("invalid_origin");

  const queue = [root.toString()];
  const visited = new Set();
  const broken = [];

  while (queue.length > 0 && visited.size < maxPages) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    try {
      const result = await requestUrl(current);
      if (result.status >= 400) {
        broken.push({ source: current, target: current, status: result.status, kind: "page" });
        continue;
      }

      if (!isHtmlResponse(result.contentType)) continue;

      const links = extractLinks(result.body, current);
      for (const target of links) {
        if (!visited.has(target) && !queue.includes(target) && queue.length + visited.size < maxPages * 4) {
          queue.push(target);
        }
      }

      for (const target of links) {
        try {
          const check = await requestUrl(target);
          if (check.status >= 400) {
            broken.push({ source: current, target, status: check.status, kind: "link" });
          }
        } catch (error) {
          broken.push({
            source: current,
            target,
            status: "fetch_failed",
            kind: "link",
            error: error instanceof Error ? error.message : String(error),
          });
        }
        await delay(75);
      }
    } catch (error) {
      broken.push({
        source: current,
        target: current,
        status: "fetch_failed",
        kind: "page",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await delay(75);
  }

  console.log(
    JSON.stringify(
      {
        origin: root.toString(),
        pagesVisited: visited.size,
        checked: [...visited],
        broken,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
