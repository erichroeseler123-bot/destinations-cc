# DCC Registry v1

This directory is the canonical authority layer for Destination Command Center.

## DCC ID Format

All canonical nodes must have a permanent ID:

`dcc:{class}:{scope}:{serial}`

- `class`: canonical node class (for example `place`, `port`, `region`)
- `scope`: normalized geo/logical scope (`us-ak-juneau`)
- `serial`: zero-padded stable suffix (`0001`)

IDs are immutable once assigned.

## Reference Code Format

Optional human-facing tracking code:

`{CLASS_CODE}-{SCOPE_SEGMENTS}-{SERIAL}`

Examples:

- `PLC-US-AK-JUNEAU-0001`
- `PRT-US-AK-JUNEAU-0001`

Reference codes are operational labels, not identity keys.

## Canonical Node Classes

Current v1 classes:

- `world`
- `continent`
- `country`
- `region`
- `place`
- `district`
- `neighborhood`
- `port`
- `transport_hub`
- `venue`
- `attraction`
- `lodging`
- `pickup_zone`
- `route`
- `operator`
- `product`
- `service_area`
- `article`
- `faq`
- `signal`
- `collection`
- `virtual`

## Shard Structure

Canonical source data is sharded JSONL by class and geography.

Examples:

- `data/registry/place/us/ak.jsonl`
- `data/registry/port/us.jsonl`
- `data/registry/virtual/global.jsonl`

Each line is one canonical node.

## Index Files

Generated indexes live in `data/index/` and are rebuildable artifacts.

Core indexes:

- `by-id.json`
- `by-slug.json`
- `by-slug-class.json`
- `by-alias.json`
- `by-class.json`
- `by-parent.json`
- `by-country.json`
- `by-tag.json`
- `by-source/*.json`

## Slug Policy

- `slug` is routing/presentation, not identity.
- Global slug collisions are expected at world scale.
- Class-aware lookup is required for deterministic resolution (`by-slug-class`).
- Canonical route policy can be either:
  - strict globally-unique slugs, or
  - class-aware canonical routes (`/place/[slug]`, `/port/[slug]`, etc.).

## Alias Policy

- Aliases belong on node records (`aliases[]`), not detached files.
- Alias resolver is generated from canonical nodes (`by-alias.json`).
- Alias values must not silently shadow canonical slugs of other nodes.
- During migration phases, keep aliases conservative until normalization rules are fully enforced.

## Edge Policy

- Edges always reference target DCC IDs, never slugs.
- Edge records are directional.
- Only approved edge types are allowed.
- Edge targets must exist in canonical registry at validation time for strict mode.

## source_refs Policy

- `source_refs` is required on every node.
- Each entry must include at least:
  - `system`
  - `id`
- `source_refs` stores provenance and external IDs (for example GeoNames, Viator, Wikidata, OSM, IATA, UN/LOCODE).
- Canonical node identity remains DCC-owned, regardless of external sources.

## Build and Validation

Use the DCC pipeline scripts:

- `npm run dcc:migrate:locations`
- `npm run dcc:migrate:ports`
- `npm run dcc:index`
- `npm run dcc:validate`
- `npm run dcc:build`

`dcc:validate` is the strict gate for registry correctness.
