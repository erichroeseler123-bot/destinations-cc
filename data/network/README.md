# DCC Network Layer (v1)

This directory defines the governed DCC Network Layer.

## Core graph registries

- `nodes.v1.json` (travel/entity Node Registry)
- `edges.v1.json` (entity Edge Registry)
- `pipeline-ownership.v1.json` (Pipeline ownership policy)
- `field-ownership.v1.json` (Field mutation policy)
- `confidence-policy.v1.json` (Operational confidence thresholds)
- `surface-policy.v1.json` (Node type surface eligibility)
- `merge-policy.v1.json` (Schema-aware merge precedence policy)
- `promotion-policy.v1.json` (Surface promotion gate policy)
- `staleness-policy.v1.json` (Freshness windows and review/block rules)

## Full-suite control-plane registries

The site layer is intentionally separate from the travel/entity graph. A website is a routing surface, not a city, port, attraction, or operator entity.

- `sites.v1.json` — canonical identity, role, promotion state, monetization mode, and terminal behavior for every site in the suite
- `intent-ownership.v1.json` — one primary owner for each exact user intent, with optional supporting surfaces
- `handoffs.v1.json` — explicit allowed cross-domain handoffs and the context fields that should survive each transition

Network doctrine:

- DCC decides
- a satellite may narrow once
- execution surfaces fulfill
- never chain satellites
- preserve known traveler context instead of asking again
- every cross-domain handoff must be attributable

## Node Registry fields

Each node includes:

- `node_id`
- `node_type`
- `name`
- `slug`
- `geo`
- `tags`
- `status`
- `authority_url`
- `monetized_targets`
- `related_nodes`
- `source`
- `confidence`
- `owner_pipeline`
- `updated_at`
- `updatedAt`

Core `node_type` values for v1:

- `city`
- `venue`
- `attraction`
- `event`
- `artist`
- `scene`
- `operator`

## Edge Registry fields

Each edge includes:

- `edge_id`
- `from_node`
- `to_node`
- `edge_type`
- `weight`
- `fresh_until`
- `signals`
- `rationale`
- `source`
- `confidence`
- `owner_pipeline`
- `updated_at`
- `updatedAt`

## Validation

Core graph validation:

```bash
npm run dcc:network:validate
```

Full-suite site/intent/handoff validation:

```bash
npx tsx scripts/dcc/validate-site-network.ts
```

The suite validator checks unique site/domain/intent/handoff identities, referential integrity, self-routes, owner/support references, terminal-target coherence, and explicit handoff context.

## Governed exports

```bash
npm run dcc:network:export:authority
npm run dcc:network:export:discovery
npm run dcc:network:export:monetized
npm run dcc:network:export:review-queue
```

## Satellite contracts

```bash
npm run dcc:network:contracts:validate
npm run dcc:network:export:satellite:parr
npm run dcc:network:export:satellite:wta
npm run dcc:network:export:satellite:gosno
```

## Satellite CI enforcement

```bash
npm run dcc:network:ci:satellite:parr
npm run dcc:network:ci:satellite:wta
npm run dcc:network:ci:satellite:gosno
npm run dcc:network:ci:satellites
```

These commands fail if required bundle classes disappear or minimum coverage thresholds are not met.

## Deploy gate sequence (satellite repos)

Use this sequence before satellite build/deploy:

```bash
npm run dcc:network:contracts:validate
npm run dcc:network:export:satellites
npm run dcc:network:ci:satellites
```

This guarantees every satellite receives a valid governed bundle and fails fast on coverage regressions.

## Diff and audit reports

```bash
npm run dcc:network:export:diff:authority
npm run dcc:network:export:diff:discovery
npm run dcc:network:export:diff:monetized
npm run dcc:network:export:diff:satellite:parr
npm run dcc:network:export:diff:satellite:wta
npm run dcc:network:export:diff:satellite:gosno
```

## Health metrics

```bash
npm run dcc:network:health
npm run dcc:city:freshness:report
npm run dcc:city:freshness:enforce
npm run dcc:cruise:freshness:report
npm run dcc:cruise:freshness:enforce
npm run dcc:sitemap:coverage
```

Produces:

- `data/network/health/graph-health.v1.json`
- `data/network/health/surface-health.v1.json`
- `data/network/health/satellite-health.v1.json`
- `data/network/health/city-freshness.v1.json`
- `data/network/health/cruise-freshness.v1.json`
- `data/network/health/sitemap-coverage.v1.json`
