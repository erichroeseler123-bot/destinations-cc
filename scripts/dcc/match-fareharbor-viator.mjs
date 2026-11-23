#!/usr/bin/env node
// Node 20+. Fetch the active DCC catalog, or replay a saved catalog snapshot.
// node scripts/dcc/match-fareharbor-viator.mjs --save-snapshot catalog.json --out review.json
// node scripts/dcc/match-fareharbor-viator.mjs --snapshot catalog.json --out review.json
import { open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const catalogUrl = 'https://destinationcommandcenter.com/api/v1/tours/catalog';
const pageSize = 150;
const fields = [
  'tourId', 'portSlug', 'destinationSlug', 'title', 'primaryProvider', 'providerProductCode',
  'operatorName', 'operatorCode', 'durationMinutes', 'durationRawText', 'bookingUrl', 'channelOffers',
  'fromPriceCents', 'currency', 'priceBasis', 'freeCancellation', 'cancellationCutoffHours',
  'cancellationSummary', 'pickupSummary', 'meetingPointName', 'meetingPointAddress', 'lastVerifiedAt',
];

async function pageAt(offset) {
  const url = new URL(catalogUrl);
  url.search = new URLSearchParams({ limit: String(pageSize), offset: String(offset), sortBy: 'title_asc' });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error('Catalog HTTP ' + response.status);
      const page = await response.json();
      if (!page.ok || !page.readOnly || page.offset !== offset || !Array.isArray(page.records) ||
          !Number.isSafeInteger(page.totalMatched) || page.totalMatched < 0 ||
          page.records.length !== Math.min(pageSize, page.totalMatched - offset)) {
        throw new Error('Unexpected catalog page at offset ' + offset);
      }
      return page;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(done => setTimeout(done, attempt * 1000));
    }
  }
}

export async function fetchSnapshot() {
  const fetchedAt = new Date().toISOString();
  const first = await pageAt(0);
  const compact = rows => rows.map(row => Object.fromEntries(fields.map(key => [key, row[key] ?? null])));
  const records = compact(first.records);
  for (let offset = pageSize; offset < first.totalMatched;) {
    const requests = [];
    while (requests.length < 4 && offset < first.totalMatched) {
      requests.push(pageAt(offset));
      offset += pageSize;
    }
    for (const page of await Promise.all(requests)) {
      if (page.totalMatched !== first.totalMatched) throw new Error('Catalog changed during pagination. Rerun the scan.');
      records.push(...compact(page.records));
    }
  }
  const snapshot = { source: catalogUrl, fetchedAt, totalRecords: first.totalMatched, records };
  validateSnapshot(snapshot);
  return snapshot;
}

function validateSnapshot(snapshot) {
  if (!Array.isArray(snapshot.records) || snapshot.records.length !== snapshot.totalRecords) {
    throw new Error('Snapshot record count is incomplete.');
  }
  const ids = new Set();
  for (const row of snapshot.records) {
    if (!row.tourId || !row.primaryProvider || !row.providerProductCode || ids.has(row.tourId)) {
      throw new Error('Invalid or duplicate provider record: ' + row.tourId);
    }
    ids.add(row.tourId);
  }
}

async function save(path, data, pretty = false) {
  const partial = resolve(path) + '.' + process.pid + '.tmp';
  await writeFile(partial, JSON.stringify(data, null, pretty ? 2 : undefined) + '\n', 'utf8');
  await rename(partial, path);
}

// Strip spelling and punctuation differences only. A reseller and its operator may have similar
// products, but a shared destination or category is not evidence that they are the same company.
function words(text) {
  return String(text || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
}

function operatorKey(text) {
  const tokens = words(text);
  while (['llc', 'inc', 'incorporated', 'ltd', 'limited'].includes(tokens.at(-1))) tokens.pop();
  const key = tokens.join(' ');
  return ['unknown', 'n a', 'not disclosed', 'various operators'].includes(key) ? '' : key;
}

const generic = new Set(words('a an the and from of in to on with at by shore excursion excursions tour tours adventure adventures experience'));
const variants = [
  /\bprivate\b/, /\bshared\b/, /\bextended\b/, /\bdeluxe\b/, /\bvip\b/, /\bovernight\b/,
  /\bsmall group\b/, /\bone way\b/, /\bround trip\b/, /\bglacier landing\b/, /\bdouble landing\b/,
  /\b(?:transfer|transportation|shuttle) only\b/, /\bdogsled\b/,
];

function titleText(row) {
  const title = words(row.title);
  const operator = words(row.operatorName);
  // FareHarbor often prefixes its title with "Operator: ". Remove a literal prefix only.
  if (operator.length < title.length && operator.every((value, i) => value === title[i])) {
    title.splice(0, operator.length);
  }
  return title.join(' ').replace(/\bdog\s*sled(?:ding|s)?\b/g, 'dogsled')
    .replace(/\be bike\b/g, 'ebike').replace(/\bflight seeing\b/g, 'flightseeing');
}

function titleWords(title, port) {
  const portWords = new Set(words(port));
  return new Set(words(title).filter(word => !generic.has(word) && !portWords.has(word)));
}

function duration(row) {
  const minutes = row.durationMinutes;
  return typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

function hasOffer(row, provider, code) {
  return (row.channelOffers || []).some(offer =>
    offer.provider === provider && offer.providerProductCode === code);
}

function compare(fh, v) {
  const fhTitle = titleText(fh);
  const vTitle = titleText(v);
  const left = titleWords(fhTitle, fh.portSlug);
  const right = titleWords(vTitle, v.portSlug);
  const overlap = [...left].filter(word => right.has(word)).length;
  const similarity = left.size && right.size ? 2 * overlap / (left.size + right.size) : 0;
  const fhOperator = operatorKey(fh.operatorName);
  const vOperator = operatorKey(v.operatorName);
  const operatorMatch = fhOperator && vOperator ? (fhOperator === vOperator ? 'same' : 'different') : 'missing';
  const a = duration(fh);
  const b = duration(v);
  const durationDeltaMinutes = a !== null && b !== null ? Math.abs(a - b) : null;
  const durationCompatible = durationDeltaMinutes !== null &&
    durationDeltaMinutes <= Math.max(10, Math.min(30, Math.min(a, b) * .15));
  const differentVariant = variants.some(pattern => pattern.test(fhTitle) !== pattern.test(vTitle));
  const existingOffer = hasOffer(fh, 'viator', v.providerProductCode) ||
    hasOffer(v, 'fareharbor', fh.providerProductCode);
  return {
    viatorTourId: v.tourId, productCode: v.providerProductCode, title: v.title, operatorName: v.operatorName,
    durationMinutes: b, durationDeltaMinutes, durationCompatible, operatorMatch, differentVariant, existingOffer,
    titleSimilarity: Number(similarity.toFixed(3)), commonTitleWords: overlap,
  };
}

function rank(candidate) {
  // Rank for human review only. All independent identity checks below must pass to suggest a match.
  return Number(candidate.existingOffer) * 2 + candidate.titleSimilarity +
    (candidate.operatorMatch === 'same' ? .25 : 0) + (candidate.durationCompatible ? .04 : 0);
}

function matchRow(fh, localViator) {
  const output = {
    fareharborTourId: fh.tourId, fareharborProductCode: fh.providerProductCode, port: fh.portSlug,
    title: fh.title, operatorName: fh.operatorName, durationMinutes: duration(fh),
    viatorRecordsAtPort: localViator.length, status: 'unsure', reason: '', candidateCount: 0, candidates: [],
  };
  if (!fh.portSlug) return { ...output, reason: 'FareHarbor record has no cruise port; same-port matching is unavailable.' };
  if (/\b(gift (?:card|certificate)|fundrais(?:er|ing)|employee only|staff only)\b/i.test(fh.title)) {
    return { ...output, reason: 'Possible non-excursion or one-off event; review listing eligibility.' };
  }
  const candidates = localViator.map(v => compare(fh, v))
    .filter(c => c.existingOffer || c.operatorMatch === 'same' || c.titleSimilarity >= .30)
    .sort((a, b) => rank(b) - rank(a) || a.viatorTourId.localeCompare(b.viatorTourId));
  const existing = candidates.filter(c => c.existingOffer);
  const strong = candidates.filter(c => c.operatorMatch === 'same' && !c.differentVariant &&
    c.durationCompatible && c.titleSimilarity >= .75 && c.commonTitleWords >= 2);
  output.candidates = candidates.slice(0, 5);
  output.candidateCount = candidates.length;
  if (existing.length === 1) {
    output.status = 'matched';
    output.proposedViatorId = existing[0].viatorTourId;
    output.reason = 'Existing provider product ID links the two records at this port.';
  } else if (existing.length > 1) {
    output.reason = 'Multiple Viator records already reference this FareHarbor item.';
  } else if (strong.length === 1 && !candidates.some(candidate =>
    candidate !== strong[0] && candidate.operatorMatch !== 'different' &&
    candidate.titleSimilarity >= strong[0].titleSimilarity - .15)) {
    output.status = 'matched';
    output.proposedViatorId = strong[0].viatorTourId;
    output.reason = 'Unique strong title, operator and duration agreement at this port.';
  } else if (candidates.length) {
    output.reason = 'Candidate requires review of operator, title, variant or duration.';
  } else if (!localViator.length) {
    output.status = 'unmatched';
    output.reason = 'No Viator records at this port in the scanned catalog.';
  } else if (!operatorKey(fh.operatorName) || !duration(fh) ||
    localViator.some(v => !operatorKey(v.operatorName) || !duration(v))) {
    output.reason = 'No plausible candidate, but missing operator or duration information prevents exclusion.';
  } else {
    output.status = 'unmatched';
    output.reason = 'No plausible candidate in the scanned same-port Viator records.';
  }
  return output;
}

export function matchSnapshot(snapshot) {
  validateSnapshot(snapshot);
  const portRecords = snapshot.records.filter(row => row.portSlug);
  const viatorByPort = new Map();
  for (const row of portRecords.filter(row => row.primaryProvider === 'viator')) {
    if (!viatorByPort.has(row.portSlug)) viatorByPort.set(row.portSlug, []);
    viatorByPort.get(row.portSlug).push(row);
  }
  const matches = snapshot.records.filter(row => row.primaryProvider === 'fareharbor')
    .sort((a, b) => a.tourId.localeCompare(b.tourId))
    .map(fh => matchRow(fh, viatorByPort.get(fh.portSlug) || []));
  // Different FH variants can resemble the same Viator product. Never propose a many-to-one import.
  const proposed = new Map();
  for (const match of matches.filter(r => r.proposedViatorId)) {
    const key = match.proposedViatorId;
    if (!proposed.has(key)) proposed.set(key, []);
    proposed.get(key).push(match);
  }
  for (const group of proposed.values()) {
    if (group.length < 2) continue;
    for (const row of group) {
      row.status = 'unsure';
      row.reason = 'More than one FareHarbor record points to the proposed Viator record.';
      delete row.proposedViatorId;
    }
  }
  return {
    generatedFrom: { source: snapshot.source, fetchedAt: snapshot.fetchedAt },
    counts: { catalog: snapshot.records.length, ports: new Set(portRecords.map(row => row.portSlug)).size,
      portRecords: portRecords.length, fareharbor: matches.length,
      viator: portRecords.filter(row => row.primaryProvider === 'viator').length,
      fareharborWithoutPort: matches.filter(row => !row.port).length,
      matched: matches.filter(row => row.status === 'matched').length,
      unmatched: matches.filter(row => row.status === 'unmatched').length,
      unsure: matches.filter(row => row.status === 'unsure').length },
    matches,
  };
}

// Apply explicit product-identity decisions to CP's review registry. This never writes the live catalog.
// Usage: node scripts/dcc/match-fareharbor-viator.mjs --snapshot catalog.json --apply-reviewed decisions.json --registry data/catalog/cp-reviewed-checkouts.json
export function applyReviewedMatches(snapshot, decisions, current) {
  if (!Array.isArray(decisions) || !current.matches || !current.dashboardVerifiedRefs) throw new Error('Invalid review inputs.');
  const records = new Map(snapshot.records.map(row => [row.tourId, row]));
  const used = new Set();
  const registry = structuredClone(current);
  for (const review of decisions) {
    const fh = records.get(review.fareharborTourId);
    if (!fh || fh.primaryProvider !== 'fareharbor' || !fh.portSlug || used.has(fh.tourId)) {
      throw new Error('Unknown or duplicate reviewed FareHarbor ID: ' + review.fareharborTourId);
    }
    used.add(fh.tourId);
    if (!['attach', 'keep', 'hold'].includes(review.decision)) throw new Error('Unknown review decision: ' + review.decision);
    const previous = Object.entries(registry.matches).find(([, pair]) =>
      pair.port === fh.portSlug && pair.fareharborProductCode === fh.providerProductCode);
    if (review.decision !== 'attach') {
      // A standalone already has its own DCC ID. A held or rejected pair must not publish.
      if (previous) delete registry.matches[previous[0]];
      continue;
    }
    const viator = records.get(review.viatorTourId);
    if (!viator || viator.primaryProvider !== 'viator' || viator.portSlug !== fh.portSlug ||
        ![fh.tourId, viator.tourId].includes(review.canonicalTourId)) {
      throw new Error('Both exact catalog IDs must exist at the same port: ' + fh.tourId);
    }
    if (!isSource(review.evidenceUrl) || !Number.isFinite(Date.parse(review.checkedAt))) {
      throw new Error('An approved pair requires dated identity evidence: ' + fh.tourId);
    }
    const canonical = review.canonicalTourId;
    if ((previous && previous[0] !== canonical) || (registry.matches[canonical] &&
        registry.matches[canonical].fareharborProductCode !== fh.providerProductCode)) {
      throw new Error('Conflicting canonical ID: ' + canonical);
    }
    const existing = registry.matches[canonical];
    const operatorName = fh.operatorName || viator.operatorName;
    if (!operatorName) throw new Error('Missing operator identity: ' + fh.tourId);
    const operator = facts(fh, review.fareharbor);
    const reseller = facts(viator, review.viator);
    const terms = review.travelerTerms ?? 'pending';
    if (!['pending','worse','equal','better'].includes(terms)) throw new Error('Invalid terms decision: ' + canonical);
    const issued = review.fareharborReferralUrl ?? existing?.comparison.fareharbor.url ?? null;
    if (issued) {
      const target = new URL(issued);
      const [company, item] = fh.providerProductCode.split(':');
      if (target.origin !== 'https://fareharbor.com' || target.username || target.password ||
          target.pathname !== `/embeds/book/${company}/items/${item}/` ||
          target.searchParams.getAll('asn').join() !== 'fhdn' ||
          target.searchParams.getAll('asn-ref').join() !== 'aktourcenter' ||
          !['cruisepromenade','cruisepromenade-' + fh.portSlug].includes(target.searchParams.getAll('ref').join())) {
        throw new Error('Invalid account-issued CP referral: ' + canonical);
      }
    }
    registry.matches[canonical] = {
      port: fh.portSlug, viatorProductCode: viator.providerProductCode, fareharborProductCode: fh.providerProductCode,
      alternateTourId: canonical === viator.tourId ? fh.tourId : viator.tourId, evidenceUrl: review.evidenceUrl, travelerTerms: terms,
      comparison: {operatorName, verifiedAt: review.checkedAt,
        fareharbor: {...operator, url: issued}, viator: reseller},
    };
  }
  return registry;
}

function isSource(value) {
  if (!value || !URL.canParse(value)) return false;
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}

function facts(record, verified = {}) {
  const url = verified.sourceUrl || record.bookingUrl;
  if (!isSource(url)) throw new Error('Missing verified provider source for ' + record.tourId);
  const source = new URL(url);
  if (!verified.sourceUrl) source.search = '';
  const fields = {sourceUrl: source.href};
  for (const field of ['priceText','cancellationText','pickupText','checkInText','departureText']) {
    const value = verified[field] ?? null;
    if (value !== null && typeof value !== 'string') throw new Error('Invalid reviewed field: ' + field);
    fields[field] = value;
  }
  const cutoff = verified.fullRefundCutoffHours ?? null;
  if (cutoff !== null && (!Number.isFinite(cutoff) || cutoff < 0)) throw new Error('Invalid refund cutoff');
  fields.fullRefundCutoffHours = cutoff;
  return fields;
}

async function main() {
  const { values } = parseArgs({ options: {
    snapshot: { type: 'string' }, 'save-snapshot': { type: 'string' }, out: { type: 'string' },
    'apply-reviewed': { type: 'string' }, registry: { type: 'string' },
  } });
  if (values['apply-reviewed'] || values.registry) {
    if (!values.snapshot || !values.registry || !values['apply-reviewed'] || values.out || values['save-snapshot']) {
      throw new Error('Review import requires --snapshot FILE --apply-reviewed DECISIONS.json --registry REGISTRY.json');
    }
    const files = [values.snapshot, values['apply-reviewed'], values.registry];
    if (new Set(files.map(file => resolve(file))).size !== files.length) throw new Error('Use separate input and registry files.');
    const lockPath = resolve(values.registry) + '.lock';
    const lock = await open(lockPath, 'wx');
    try {
      const [snapshot, decisions, current] = await Promise.all(files.map(async file => JSON.parse(await readFile(file, 'utf8'))));
      validateSnapshot(snapshot);
      const result = applyReviewedMatches(snapshot, decisions, current);
      const changed = JSON.stringify(current) !== JSON.stringify(result);
      if (changed) await save(values.registry, result, true);
      console.log(JSON.stringify({ reviewed: decisions.length, approved: decisions.filter(row => row.decision === 'attach').length, changed }));
    } finally {
      await lock.close();
      await unlink(lockPath);
    }
    return;
  }
  if (!values.out || (values.snapshot && values['save-snapshot'])) {
    throw new Error('Usage: node match-fareharbor-viator.mjs [--snapshot FILE | --save-snapshot FILE] --out REVIEW.json');
  }
  const input = values.snapshot || values['save-snapshot'];
  if (input && resolve(input) === resolve(values.out)) throw new Error('Use separate paths for snapshot and review.');
  const snapshot = values.snapshot ? JSON.parse(await readFile(values.snapshot, 'utf8')) : await fetchSnapshot();
  const result = matchSnapshot(snapshot);
  if (values['save-snapshot']) await save(values['save-snapshot'], snapshot);
  await save(values.out, result);
  console.log(JSON.stringify(result.counts));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
