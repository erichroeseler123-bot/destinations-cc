#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const configPath = path.join(__dirname, 'suite-health.config.json');
const outputDir = path.join(root, 'artifacts', 'suite-health');

const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

const timeoutMs = Number(process.env.SUITE_HEALTH_TIMEOUT_MS || 15000);
const userAgent = 'DestinationCommandCenter-SuiteHealth/1.0 (+https://destinationcommandcenter.com)';

function textMatch(html, regex) {
  const match = html.match(regex);
  return match?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

function stripTags(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(value, base) {
  if (!value) return '';
  try {
    const url = new URL(value, base);
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': userAgent, ...(init.headers || {}) },
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function probe(url) {
  const started = Date.now();
  try {
    const response = await fetchWithTimeout(url);
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      elapsedMs: Date.now() - started,
      body,
      contentType: response.headers.get('content-type') || '',
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      elapsedMs: Date.now() - started,
      body: '',
      contentType: '',
      error: error?.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : String(error?.message || error),
    };
  }
}

function findCanonical(html, base) {
  const patterns = [
    /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i,
  ];
  for (const regex of patterns) {
    const value = textMatch(html, regex);
    if (value) return normalizeUrl(value, base);
  }
  return '';
}

function analyzeHtml(html, base) {
  const title = stripTags(textMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const h1 = stripTags(textMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
  const description = textMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
    || textMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const canonical = findCanonical(html, base);
  const jsonLdCount = (html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi) || []).length;
  return { title, h1, description: stripTags(description), canonical, jsonLdCount };
}

function pushIssue(issues, severity, code, detail) {
  issues.push({ severity, code, detail });
}

async function scanSite(site) {
  const issues = [];
  const page = await probe(site.url);
  const result = {
    name: site.name,
    role: site.role,
    url: site.url,
    status: page.status,
    finalUrl: page.finalUrl,
    elapsedMs: page.elapsedMs,
    title: '',
    h1: '',
    description: '',
    canonical: '',
    jsonLdCount: 0,
    robotsStatus: 0,
    sitemapStatus: 0,
    issues,
  };

  if (!page.ok) {
    pushIssue(issues, 'critical', 'homepage-unavailable', page.error || `HTTP ${page.status}`);
    return result;
  }

  let finalHost = '';
  try { finalHost = new URL(page.finalUrl).host; } catch {}
  if (site.expectedHost && finalHost !== site.expectedHost) {
    pushIssue(issues, 'critical', 'unexpected-host', `Expected ${site.expectedHost}; landed on ${finalHost || page.finalUrl}`);
  }

  if (!/text\/html/i.test(page.contentType)) {
    pushIssue(issues, 'warning', 'unexpected-content-type', page.contentType || 'missing content-type');
  }

  const analyzed = analyzeHtml(page.body, page.finalUrl);
  Object.assign(result, analyzed);

  if (!analyzed.title) pushIssue(issues, 'warning', 'missing-title', 'Homepage has no <title>.');
  if (!analyzed.description) pushIssue(issues, 'warning', 'missing-description', 'Homepage has no meta description.');
  if (!analyzed.h1) pushIssue(issues, 'warning', 'missing-h1', 'Homepage has no H1.');
  if (!analyzed.canonical) {
    pushIssue(issues, 'warning', 'missing-canonical', 'Homepage has no canonical URL.');
  } else {
    try {
      const canonicalHost = new URL(analyzed.canonical).host;
      if (site.expectedHost && canonicalHost !== site.expectedHost) {
        pushIssue(issues, 'critical', 'canonical-host-mismatch', `Canonical points to ${canonicalHost}; expected ${site.expectedHost}.`);
      }
    } catch {
      pushIssue(issues, 'warning', 'invalid-canonical', analyzed.canonical);
    }
  }

  if (analyzed.jsonLdCount === 0) pushIssue(issues, 'warning', 'missing-jsonld', 'No JSON-LD detected on homepage.');

  const lower = page.body.toLowerCase();
  for (const phrase of site.forbiddenPhrases || []) {
    if (lower.includes(phrase.toLowerCase())) {
      pushIssue(issues, 'critical', 'forbidden-stale-copy', `Found stale/forbidden phrase: “${phrase}”.`);
    }
  }

  const origin = new URL(page.finalUrl).origin;
  const [robots, sitemap] = await Promise.all([
    probe(`${origin}/robots.txt`),
    probe(`${origin}/sitemap.xml`),
  ]);
  result.robotsStatus = robots.status;
  result.sitemapStatus = sitemap.status;

  if (!robots.ok) pushIssue(issues, 'warning', 'robots-unavailable', `robots.txt returned ${robots.status || robots.error}`);
  if (!sitemap.ok) pushIssue(issues, 'warning', 'sitemap-unavailable', `sitemap.xml returned ${sitemap.status || sitemap.error}`);

  return result;
}

const results = [];
for (const site of config.domains) {
  // Sequential by design: polite to the portfolio and easier to read in CI logs.
  process.stdout.write(`Scanning ${site.name}... `);
  const result = await scanSite(site);
  results.push(result);
  const criticals = result.issues.filter((i) => i.severity === 'critical').length;
  const warnings = result.issues.filter((i) => i.severity === 'warning').length;
  console.log(`${result.status || 'ERR'} | ${criticals} critical | ${warnings} warning`);
}

const criticalCount = results.flatMap((r) => r.issues).filter((i) => i.severity === 'critical').length;
const warningCount = results.flatMap((r) => r.issues).filter((i) => i.severity === 'warning').length;
const healthyCount = results.filter((r) => !r.issues.some((i) => i.severity === 'critical')).length;

const report = {
  generatedAt: new Date().toISOString(),
  version: config.version,
  summary: {
    sites: results.length,
    healthyWithoutCriticals: healthyCount,
    criticalIssues: criticalCount,
    warnings: warningCount,
  },
  results,
};

const markdown = [
  '# Suite Health Check',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `**${results.length} sites scanned · ${healthyCount} without critical issues · ${criticalCount} critical · ${warningCount} warnings**`,
  '',
  '| Site | HTTP | Canonical | Schema | Robots | Sitemap | Critical | Warnings |',
  '|---|---:|---|---:|---:|---:|---:|---:|',
  ...results.map((r) => {
    const criticals = r.issues.filter((i) => i.severity === 'critical').length;
    const warnings = r.issues.filter((i) => i.severity === 'warning').length;
    return `| ${r.name} | ${r.status || 'ERR'} | ${r.canonical ? 'yes' : 'no'} | ${r.jsonLdCount} | ${r.robotsStatus || 'ERR'} | ${r.sitemapStatus || 'ERR'} | ${criticals} | ${warnings} |`;
  }),
  '',
  '## Findings',
  '',
  ...results.flatMap((r) => r.issues.length
    ? [`### ${r.name}`, '', ...r.issues.map((i) => `- **${i.severity.toUpperCase()} · ${i.code}:** ${i.detail}`), '']
    : [`### ${r.name}`, '', '- No issues detected by the current rule set.', '']),
].join('\n');

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, 'latest.md'), `${markdown}\n`);

console.log(`\nSuite Health: ${healthyCount}/${results.length} sites without critical issues; ${criticalCount} critical; ${warningCount} warnings.`);
console.log(`Reports: ${path.relative(root, path.join(outputDir, 'latest.md'))} and latest.json`);

// Critical failures are actionable identity/availability problems. Warnings stay informational.
if (criticalCount > 0 && process.env.SUITE_HEALTH_STRICT === '1') process.exitCode = 1;
