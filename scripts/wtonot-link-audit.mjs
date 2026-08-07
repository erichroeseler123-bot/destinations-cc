const ORIGIN = process.env.WTONOT_ORIGIN || "https://welcometoneworleanstours.com";
const HOST_HEADER = process.env.WTONOT_HOST_HEADER || "";
const MAX_PAGES = Number.parseInt(process.env.WTONOT_MAX_PAGES || "160", 10);
const REQUEST_HEADERS = {
  "user-agent": "WTONOT link QA crawler",
  ...(HOST_HEADER ? { host: HOST_HEADER, "x-forwarded-host": HOST_HEADER } : {}),
};

const startPaths = [
  "/",
  "/tours",
  "/contact",
  "/help-me-choose",
  "/city-tours",
  "/swamp-tours",
  "/plantation-tours",
  "/tours-for/first-time-visitors",
  "/guides/how-far-are-swamp-tours-from-new-orleans",
  "/guides/how-long-does-a-swamp-tour-take",
];

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function getAttr(attrs, name) {
  const match = attrs.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? decodeEntities(match[1] || match[2] || match[3] || "") : "";
}

function normalizeHref(href, sourceUrl) {
  if (!href) return "";
  if (href.startsWith("tel:") || href.startsWith("mailto:")) return href;
  try {
    return new URL(href, sourceUrl).toString();
  } catch {
    return href;
  }
}

function isInternal(url) {
  try {
    const parsed = new URL(url);
    const origin = new URL(ORIGIN);
    return parsed.hostname === origin.hostname || parsed.hostname === `www.${origin.hostname}` || `www.${parsed.hostname}` === origin.hostname;
  } catch {
    return false;
  }
}

function isFareHarbor(url) {
  try {
    return new URL(url).hostname.endsWith("fareharbor.com");
  } catch {
    return false;
  }
}

function publicPath(url) {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

function extractClickables(html, sourceUrl) {
  const clickables = [];
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html))) {
    const attrs = match[1];
    const href = getAttr(attrs, "href");
    clickables.push({
      source: publicPath(sourceUrl),
      label: stripTags(match[2]) || getAttr(attrs, "aria-label") || "(unlabeled link)",
      type: "a",
      target: normalizeHref(href, sourceUrl),
      rawTarget: href,
    });
  }

  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  while ((match = buttonRegex.exec(html))) {
    const attrs = match[1];
    clickables.push({
      source: publicPath(sourceUrl),
      label: stripTags(match[2]) || getAttr(attrs, "aria-label") || "(unlabeled button)",
      type: "button",
      target: getAttr(attrs, "formaction") || "(client action/no href)",
      rawTarget: getAttr(attrs, "formaction"),
    });
  }

  return clickables;
}

async function fetchDocument(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      ...REQUEST_HEADERS,
      "accept": "text/html,application/xhtml+xml",
    },
  });
  const text = await response.text();
  const title = (text.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || "").trim();
  const notFound = response.status === 404 || /\/not-found/.test(response.url) || /^404\b/i.test(title);
  return {
    url: response.url,
    status: response.status,
    ok: response.ok && !notFound,
    notFound,
    text,
    robots: response.headers.get("x-robots-tag") || "",
  };
}

async function checkUrl(url) {
  if (url.startsWith("tel:") || url.startsWith("mailto:")) {
    return { status: "action", ok: true, finalUrl: url };
  }
  if (!/^https?:\/\//.test(url)) {
    return { status: "invalid", ok: false, finalUrl: url };
  }
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: REQUEST_HEADERS,
    });
    const contentType = response.headers.get("content-type") || "";
    let notFound = response.status === 404 || /\/not-found/.test(response.url);
    if (contentType.includes("text/html")) {
      const text = await response.text();
      const title = (text.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || "").trim();
      notFound = notFound || /^404\b/i.test(title);
    }
    return {
      status: response.status,
      ok: response.ok && !notFound,
      finalUrl: response.url,
      notFound,
    };
  } catch (error) {
    return { status: "error", ok: false, finalUrl: url, error: error.message };
  }
}

const queue = startPaths.map((path) => new URL(path, ORIGIN).toString());
const seenPages = new Set();
const pageResults = [];
const clickables = [];

while (queue.length && seenPages.size < MAX_PAGES) {
  const url = queue.shift();
  const key = publicPath(url).split("#")[0];
  if (seenPages.has(key)) continue;
  seenPages.add(key);

  const page = await fetchDocument(url);
  pageResults.push({ source: key, status: page.status, ok: page.ok, finalUrl: page.url, notFound: page.notFound, robots: page.robots });
  if (!page.ok) continue;

  const extracted = extractClickables(page.text, page.url);
  clickables.push(...extracted);
  for (const item of extracted) {
    if (!item.target || item.target === "#") continue;
    if (!isInternal(item.target)) continue;
    const parsed = new URL(item.target);
    if (parsed.hash && !parsed.pathname) continue;
    if (parsed.pathname.startsWith("/_next/") || parsed.pathname.includes(".")) continue;
    const nextKey = `${parsed.pathname}${parsed.search}`;
    if (!seenPages.has(nextKey) && queue.length + seenPages.size < MAX_PAGES) {
      queue.push(parsed.toString());
    }
  }
}

const uniqueTargets = new Map();
const brokenStatic = [];
for (const item of clickables) {
  if (item.type === "button") continue;
  if (!item.rawTarget || item.rawTarget === "#") {
    brokenStatic.push({ ...item, reason: !item.rawTarget ? "empty href" : "hash href" });
    continue;
  }
  if (item.rawTarget.startsWith("#")) continue;
  if (isInternal(item.target) || isFareHarbor(item.target) || item.target.startsWith("tel:") || item.target.startsWith("mailto:")) {
    uniqueTargets.set(item.target, item);
  }
}

const targetChecks = [];
for (const [target, example] of uniqueTargets) {
  targetChecks.push({ target, example, result: await checkUrl(target) });
}

const brokenTargets = targetChecks.filter(({ result }) => !result.ok);
const fareHarbor = targetChecks.filter(({ target }) => isFareHarbor(target));
const internal = targetChecks.filter(({ target }) => isInternal(target));
const buttons = clickables.filter((item) => item.type === "button");

const report = {
  origin: ORIGIN,
  pagesChecked: pageResults.length,
  clickableElementsChecked: clickables.length,
  uniqueTargetsChecked: targetChecks.length,
  buttonsWithoutHref: buttons.length,
  staticHrefDefects: brokenStatic.length,
  brokenTargetCount: brokenTargets.length,
  internalTargetCount: internal.length,
  fareHarborTargetCount: fareHarbor.length,
  pageResults,
  brokenStatic,
  brokenTargets,
  fareHarbor: fareHarbor.map(({ target, example, result }) => ({
    source: example.source,
    label: example.label,
    target,
    status: result.status,
    finalUrl: result.finalUrl,
    ok: result.ok,
  })),
  allClickables: clickables,
};

console.log(JSON.stringify(report, null, 2));
