# DCC Network Layer (v1)

This directory defines the DCC Network Layer contract using two registries:

- `nodes.v1.json` (Node Registry)
- `edges.v1.json` (Edge Registry)
- `pipeline-ownership.v1.json` (Pipeline ownership policy)
- `field-ownership.v1.json` (Field mutation policy)
- `confidence-policy.v1.json` (Operational confidence thresholds)
- `surface-policy.v1.json` (Node type surface eligibility)
- `merge-policy.v1.json` (Schema-aware merge precedence policy)
- `promotion-policy.v1.json` (Surface promotion gate policy)
- `staleness-policy.v1.json` (Freshness windows and review/block rules)

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

Run:

```bash
npm run dcc:network:validate
```

This validates schema correctness and referential integrity between nodes and edges.
It also validates ownership constraints against `pipeline-ownership.v1.json`.
Validator output now includes severity classes:

- `errors`
- `warnings`
- `infos`

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
