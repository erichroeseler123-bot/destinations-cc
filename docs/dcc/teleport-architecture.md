# DCC Teleport Architecture (Authority-First)

## Purpose
Replace brittle hyperlink-web navigation with a canonical entity-query system so any surface (Decision Engine, Alerts, Next48, Live Pulse, share cards) can retrieve the best relevant entities by criteria.

## Core Contract
Teleport is: `entities + attributes + graph edges + derived signals + query ranking + surface adapters`.

## 1) Canonical Entity Model
Each entity must have:
- `id` (stable key, e.g. `city:denver`, `venue:red-rocks-amphitheatre`)
- `type` (`city|port|venue|attraction|route|event|experience`)
- `slug`
- `name`
- `geo` (`lat`, `lng`, optional radius)
- `tags` (scene/category attributes)
- `priorityTier` (`gold|high|standard`)
- `status` (`active|deprecated`)

## 2) Shared Queryable Attributes
Derived and source-backed attributes used for sorting/filtering:
- `hasTours`, `hasCruises`, `hasTransport`
- `counts.tours`, `counts.cruises`, `counts.transport`, `counts.events`
- `next48Count`
- `livePulseCount`
- `authorityScore`
- `freshnessHours`
- `sceneTags` (e.g. `music`, `nightlife`, `family`, `outdoors`)

## 3) Canonical Edge Types
Use fixed edge taxonomy only:
- `near`
- `inside`
- `route_to`
- `sibling_of`
- `supports`
- `departs_from`
- `commonly_combined_with`
- `same_scene_as`

Edge shape:
- `fromEntityId`
- `toEntityId`
- `edgeType`
- `weight` (0..1)
- `source` (`registry|derived|editorial`)
- `updatedAt`

## 4) Derived Surface Index
Precompute an index consumed by runtime features:
- `data/graph/place-action-index.json` (existing)
- add incremental derived tables for:
  - `next48 rollups`
  - `live pulse rollups`
  - `authority media coverage`

Key rule: runtime surfaces should avoid expensive graph traversals and rely on precomputed slices where possible.

## 5) Teleport Query API
Create one canonical query interface:

```ts
teleportQuery({
  origin: { entityId: "city:denver" },
  filters: {
    entityTypes: ["venue", "experience"],
    hasTours: true,
    timeWindow: "next48",
    sceneTags: ["music"],
    maxDistanceMiles: 10,
  },
  includeEdges: ["near", "supports", "route_to"],
  sort: ["authorityScore", "liveActivity", "distance"],
  limit: 12,
})
```

Response:
- ranked entities
- explanation fields (`whySelected`)
- confidence / freshness metadata

## 6) Ranking Model
Default score composition:
- `authorityScore` (content and graph completeness)
- `liveActivityScore` (Next48 + Live Pulse)
- `connectionScore` (edge weight to origin)
- `actionabilityScore` (tours/cruises/transport availability)
- `distanceScore` (where geographic)
- `freshnessScore`

Sort behavior must be deterministic with stable tie-breaks by `entityId`.

## 7) Surface Adapters
All major surfaces should call teleport query instead of hardcoded links:
- Decision Engine related modules
- GraphContextPanel
- Alerts signal panels
- Next48 related experiences
- Live Pulse overlays
- Share card source selection

## 8) Guardrails
- Priority (`gold|high`) surfaces must only use approved media and validated entity references.
- Zero-count rows are allowed only as fallback, never ahead of action-backed rows.
- Unknown or deprecated entities excluded from top results.

## 9) Incremental Delivery Plan
1. Add `teleportQuery` to `lib/dcc/graph/` with current index-backed implementation.
2. Migrate GraphContextPanel and Alerts to use query output.
3. Add query validation script (`scripts/dcc/validate-teleport.ts`).
4. Add CI gate for top-5 pages query health (non-empty, action-backed minimum coverage).

## 10) Definition of Done
- No critical surface depends on hardcoded relationship lists for primary recommendations.
- Top 5 gold pages show teleport-backed entity selections.
- Alerts and Next48 surfaces rank action-backed entities first.
- Validation and CI enforce query integrity and fallback behavior.
