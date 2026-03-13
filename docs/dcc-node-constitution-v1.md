# DCC Node Constitution v1

Status: Draft v1  
Scope: Network Layer contract for Authority, Discovery, Monetized, and Intelligence execution

## 1. Purpose

DCC is a graph system, not a page factory.  
This constitution defines how nodes and edges are created, validated, and governed so ingestion pipelines can manufacture reliable graph assets at scale.

## 2. Core Layers

1. Intelligence: data ingestion and signal updates
2. Authority: canonical destination knowledge
3. Discovery: demand capture and intent routing
4. Monetized: fulfillment and bookings
5. Network: shared graph and cross-destination routing

## 3. Canonical Node Types (v1)

1. `city`
2. `venue`
3. `attraction`
4. `event`
5. `artist`
6. `scene`
7. `operator`

## 4. Required Node Fields

All nodes must include:

1. `node_id`
2. `node_type`
3. `name`
4. `slug`
5. `geo` (`lat`, `lon`, `country`, `region`, `locality`)
6. `tags`
7. `status` (`active`, `beta`, `paused`, `archived`)
8. `authority_url`
9. `related_nodes`
10. `source`
11. `confidence`
12. `owner_pipeline`
13. `updatedAt`

Conditional requirements:

1. `operator` nodes must include at least one `monetized_target`
2. `scene` nodes should include at least two `related_nodes`

## 5. Canonical Edge Types (v1)

1. `nearby`
2. `feeds`
3. `routes_to`
4. `operates_in`
5. `co_intent`
6. `fallback_to`

Required edge fields:

1. `edge_id`
2. `from_node`
3. `to_node`
4. `edge_type`
5. `weight` (0..1)
6. `fresh_until`
7. `signals`
8. `rationale`
9. `source`
10. `confidence`
11. `owner_pipeline`
12. `updatedAt`

## 6. Authority vs Monetized Rules

1. Authority pages must remain canonical references and may link to monetized targets.
2. Authority nodes should not depend on monetized platform uptime to remain valid.
3. Monetized nodes must be traceable back to one or more authority nodes.
4. Every booking path should map to at least one operator node and one authority node.

## 7. Pipeline Ownership (v1)

1. Geo backbone pipeline owns `city` base geometry and hierarchy enrichment.
2. Venue ingestion pipeline owns `venue` creation and updates.
3. Attraction ingestion pipeline owns `attraction` creation and updates.
4. Event ingestion pipeline owns `event` freshness and lifecycle.
5. Artist ingestion pipeline owns `artist` nodes and performer relationships.
6. Scene clustering pipeline owns `scene` assignment and semantic grouping.
7. Operator/business pipeline owns `operator` nodes and monetized targets.
8. Transportation pipeline owns route-oriented edges (`routes_to`, `fallback_to`, `nearby` by corridor).
9. Signal enrichment pipeline owns dynamic edge weighting and freshness windows.

## 8. Validation Gates

Minimum validation before publish:

1. Schema validity for node and edge registries
2. Referential integrity (`from_node`, `to_node`, `related_nodes`)
3. Unique node slugs
4. Node type floor: at least one `city`, `scene`, `operator`
5. No expired critical edges (`fresh_until` policy-driven check)
6. Staleness policy compliance for node/edge freshness windows
7. Surface manifest and promotion gate compliance before export

Current validator command:

```bash
npm run dcc:network:validate
```

## 9. Scale Plan

1. 0-2,000 nodes: schema hardening and ingestion reliability
2. 2,000-5,000 nodes: internal graph density and intent routing quality
3. 5,000-20,000 nodes: compounding SEO/discovery and monetized handoff optimization
4. 20,000+ nodes: automated quality scoring, confidence models, and network-level orchestration

## 10. Rendering Principle

Websites are renderers of the graph.  
Pipelines create and maintain graph truth; presentation surfaces consume it.
