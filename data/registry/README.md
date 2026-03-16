# DCC Registry

This directory is the canonical authority layer for Destination Command Center.

It defines the durable node identity system that other layers reference:

- routing
- graphs
- overlays
- products
- signals
- source provenance

The registry is the backbone of the system. Slugs, aliases, routes, and edges are all subordinate to canonical node identity.

## DCC ID Format

Every canonical node must have a permanent DCC-owned ID:

`dcc:{class}:{scope}:{serial}`

Examples:

- `dcc:place:us-nv-las-vegas:0001`
- `dcc:port:us-ak-juneau:0001`
- `dcc:venue:us-il-chicago-loop:0003`

Rules:

- `class` is the canonical node class
- `scope` is a normalized geographic or logical scope
- `serial` is a zero-padded stable suffix
- IDs are immutable once assigned
- IDs are the true foreign-key target across the system

Slugs are never identity. DCC IDs are identity.

## Reference Code Format

Reference codes are human-facing operational labels, not system identity keys.

Format:

`{CLASS_CODE}-{SCOPE_SEGMENTS}-{SERIAL}`

Examples:

- `PLC-US-NV-LAS-VEGAS-0001`
- `PRT-US-AK-JUNEAU-0001`
- `VEN-US-IL-CHICAGO-LOOP-0003`

Rules:

- reference codes should be readable in ops, QA, and exports
- reference codes may change only under controlled migration
- DCC IDs do not change when reference codes are reformatted

## Canonical Node Classes

Current canonical classes:

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

Class choice should reflect the node’s durable role in the system, not a temporary product use.

## Shard Structure

Canonical source data is sharded by class and geography.

Current patterns include:

- `data/registry/place/{country_code}/{admin1_code}.jsonl`
- `data/registry/port/{country_code}.jsonl`

Examples:

- `data/registry/place/us/nv.jsonl`
- `data/registry/place/cn/25.jsonl`
- `data/registry/port/us.jsonl`

Rules:

- one line equals one canonical node
- shard boundaries should be deterministic
- sharding should favor stable geographic grouping over arbitrary volume slicing
- shards are source-of-truth content, not query indexes

## Index Files

Indexes are generated artifacts, not hand-edited authority files.

Generated indexes live in `data/index/`.

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

Rules:

- indexes must be rebuildable from canonical registry content
- registry shards are authoritative
- index files are query accelerators and resolvers

## Slug Policy

`slug` is a routing and presentation handle, not the canonical key.

Rules:

- slugs should be lowercase ASCII
- use hyphen-separated words
- avoid punctuation except hyphens
- prefer stable geographic specificity where ambiguity is likely
- global slug collisions are expected at world scale
- deterministic resolution must use class-aware or ID-aware lookup

Examples:

- `las-vegas-nv`
- `union-station`
- `red-rock-canyon`

A slug can be canonical for one node and ambiguous globally. That is acceptable if the resolver layer handles it explicitly.

## Alias Policy

Aliases are alternate inbound handles for an existing canonical node.

Rules:

- aliases belong on node records via `aliases[]`
- aliases do not create new identity
- aliases are resolved into canonical nodes through generated indexes
- aliases must not silently shadow another node’s canonical slug
- aliases should be conservative during migrations

Good alias use:

- old city spellings
- legacy route handles
- known abbreviated forms
- pre-normalization imported slugs

Bad alias use:

- speculative marketing phrases
- temporary campaign strings
- ambiguous short names without resolver safeguards

## Edge Policy

Edges express canonical graph relationships between nodes.

Rules:

- edges always target DCC IDs, never slugs
- edges are directional
- edge types must come from the approved edge taxonomy
- strict validation should fail when referenced target nodes do not exist
- routing should not depend on edge presence

Examples of valid edge intent:

- containment
- proximity
- service coverage
- gateway relationships
- commercial attachment
- alias equivalence where explicitly modeled

Edges belong to the structural graph, not to page copy.

## source_refs Policy

Every canonical node must carry provenance.

Rules:

- `source_refs` is required on every node
- each `source_ref` must include at least:
  - `system`
  - `id`
- source refs store origin evidence and external identifiers
- DCC still owns the canonical node identity

Typical source systems:

- GeoNames
- Wikidata
- OpenStreetMap
- Viator
- IATA
- UN/LOCODE
- internal editorial systems

`source_refs` answers: where did this node come from and what external record backs it.

## Build And Validation

Registry maintenance runs through the DCC pipeline.

Current core scripts:

- `npm run dcc:migrate:locations`
- `npm run dcc:migrate:ports`
- `npm run dcc:index`
- `npm run dcc:validate`
- `npm run dcc:build`

Validation is the strict gate for:

- canonical identity correctness
- shard consistency
- alias safety
- edge referential integrity
- source provenance presence

## Operating Principle

The registry is not a content dump.

It is the durable identity and structure layer that every faster system depends on:

- pages
- APIs
- overlays
- products
- signals
- maps
- future ranking and orchestration
