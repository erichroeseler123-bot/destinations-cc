#!/usr/bin/env node

import entrySurfaces from "../../data/generated/entry-surfaces.json" with { type: "json" };

const origin = (process.argv[2] || "https://www.destinationcommandcenter.com").replace(/\/$/, "");
const timeoutMs = Number(process.argv[3] || 10000);

function getPromotedEntries() {
  return [...entrySurfaces]
    .filter((entry) => entry.showInHomepage || entry.showInCommand)
    .sort((a, b) => b.rankScore - a.rankScore || a.label.localeCompare(b.label));
}

async function request(url) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": "dcc-promoted-entry-check/1.0",
      accept: "text/html,application/xhtml+xml",
      "cache-control": "no-cache",
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get("content-type") || "",
  };
}

function isHtmlResponse(contentType) {
  return typeof contentType === "string" && contentType.includes("text/html");
}

async function main() {
  const promoted = getPromotedEntries();
  const failures = [];

  for (const entry of promoted) {
    const url = `${origin}${entry.path}`;
    try {
      const result = await request(url);
      if (!result.ok) {
        failures.push({
          id: entry.id,
          label: entry.label,
          path: entry.path,
          url,
          status: result.status,
          finalUrl: result.finalUrl,
          reason: "non_ok_status",
        });
        continue;
      }

      if (!isHtmlResponse(result.contentType)) {
        failures.push({
          id: entry.id,
          label: entry.label,
          path: entry.path,
          url,
          status: result.status,
          finalUrl: result.finalUrl,
          reason: `unexpected_content_type:${result.contentType}`,
        });
        continue;
      }

      console.log(`PASS ${entry.label}: ${result.status} ${entry.path}`);
    } catch (error) {
      failures.push({
        id: entry.id,
        label: entry.label,
        path: entry.path,
        url,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (failures.length > 0) {
    console.error(
      JSON.stringify(
        {
          origin,
          promotedEntries: promoted.map((entry) => ({
            id: entry.id,
            label: entry.label,
            path: entry.path,
          })),
          failures,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
