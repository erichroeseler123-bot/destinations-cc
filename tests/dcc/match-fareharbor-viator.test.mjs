import test from 'node:test';
import assert from 'node:assert/strict';
import { applyReviewedMatches, matchSnapshot } from '../../scripts/dcc/match-fareharbor-viator.mjs';

function row(provider, code, changes = {}) {
  return {
    tourId: provider + ':' + code, primaryProvider: provider, providerProductCode: code,
    portSlug: 'juneau', title: 'Eagle Beach Wildlife Walk', operatorName: 'Example LLC',
    durationMinutes: 120, ...changes,
  };
}

function results(...records) {
  return matchSnapshot({ source: 'fixture', fetchedAt: '2026-11-23', totalRecords: records.length, records }).matches;
}

const fh = row('fareharbor', 'example:1');
const viator = row('viator', '101P2', { operatorName: 'Example' });

test('matches a unique same-port operator, distinctive title and compatible duration', () => {
  assert.equal(results(fh, viator)[0].proposedViatorId, viator.tourId);
  assert.equal(results(fh, { ...viator, portSlug: 'skagway' })[0].status, 'unmatched');
});

test('missing or different identity evidence, duration or variant cannot auto-match', () => {
  for (const changes of [
    { durationMinutes: null }, { durationMinutes: 300 }, { operatorName: null },
    { operatorName: 'Other operator' }, { title: 'Private Eagle Beach Wildlife Walk' },
    { title: 'Eagle Beach Wildlife Walk and Double Landing' },
  ]) {
    assert.equal(results(fh, { ...viator, ...changes })[0].status, 'unsure');
  }
  assert.equal(results({ ...fh, portSlug: null }, viator)[0].status, 'unsure');
  assert.equal(results({ ...fh, title: 'Gift Card' }, viator)[0].status, 'unsure');
});

test('keeps ambiguous directions out of automatically suggested imports', () => {
  const secondV = row('viator', '102P3');
  const secondF = row('fareharbor', 'example:2');
  assert.equal(results(fh, viator, secondV)[0].status, 'unsure');
  assert.ok(results(fh, secondF, viator).every(match => match.status === 'unsure'));
});

test('respects an existing channel ID across different titles without matching across ports', () => {
  const linked = { ...viator, title: 'Different name', operatorName: null, durationMinutes: null,
    channelOffers: [{ provider: 'fareharbor', providerProductCode: fh.providerProductCode }] };
  assert.equal(results(fh, linked)[0].proposedViatorId, viator.tourId);
  assert.equal(results(fh, { ...linked, portSlug: 'skagway' })[0].status, 'unmatched');
});

test('recognizes split or inflected dog sled titles and suppresses incomplete snapshots', () => {
  const [candidate] = results({ ...fh, title: 'Glacier Dog Sled Tour' },
    { ...viator, title: 'Glacier Dogsledding' })[0].candidates;
  assert.equal(candidate.titleSimilarity, 1);
  assert.equal(candidate.differentVariant, false);
  assert.throws(() => results(fh, fh), /duplicate/);
  assert.throws(() => matchSnapshot({ records: [fh], totalRecords: 2 }), /incomplete/);
});

test('stages a reviewed pair idempotently; a hold restores separate records', () => {
  const f = { ...row('fareharbor','co:1'), bookingUrl:'https://fareharbor.com/embeds/book/co/items/1/?asn=fhdn' };
  const v = { ...row('viator','10P1'), bookingUrl:'https://www.viator.com/tours/Juneau/Walk/d941-10P1' };
  const snapshot = { records: [f,v] };
  const base = { dashboardVerifiedRefs: {}, matches: {} };
  const review = { decision:'attach', fareharborTourId:f.tourId, viatorTourId:v.tourId, canonicalTourId:v.tourId,
    checkedAt:'2026-11-23', evidenceUrl:'https://operator.example/walk' };
  const first = applyReviewedMatches(snapshot, [review], base);
  assert.equal(first.matches[v.tourId].comparison.fareharbor.url, null);
  assert.equal(first.matches[v.tourId].comparison.fareharbor.priceText, null);
  assert.deepEqual(applyReviewedMatches(snapshot, [review], first), first);
  assert.deepEqual(applyReviewedMatches(snapshot, [{...review,decision:'hold'}], first), base);
  assert.deepEqual(applyReviewedMatches(snapshot, [{...review,decision:'keep'}], base), base);
  assert.deepEqual(base.matches, {});
  assert.throws(() => applyReviewedMatches(snapshot, [review, review], base), /duplicate/);
  assert.throws(() => applyReviewedMatches({records:[f,{...v,portSlug:'skagway'}]}, [review], base), /same port/);
});
