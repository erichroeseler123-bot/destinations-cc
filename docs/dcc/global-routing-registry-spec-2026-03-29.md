# Global Routing Registry Spec

Date: 2026-03-29

## Purpose

Create one shared routing language for DCC, decision satellites, and checkout surfaces without forcing unlike systems into one flat record.

This spec defines:
- the shared core types
- the extension types
- the registry file shape
- the migration path from the current `warmTransfer`, `redirect-intent-registry`, and PARR-style landing records

## Design Rule

Use one shared core plus system-specific extensions.

Do not force these into fake sameness:
- a DCC -> WTS warm transfer packet
- a redirect from an old path
- a PARR landing-quality record
- a canonical page's own routing metadata

They should speak the same language, but they should not be the same object.

## Shared Core Types

```ts
export type RoutingLayer = "dcc" | "decision" | "checkout";

export type RoutingIntent = "explore" | "understand" | "compare" | "act";

export type RoutingSourceSystem = "dcc" | "wts" | "parr" | "redirect";

export type RoutingNode = {
  id: string;
  layer: RoutingLayer;
  intent: RoutingIntent;
  topic: string;
  subtype?: string;
  sourceSystem?: RoutingSourceSystem;
  sourcePath?: string;
  destinationPath: string;
  nextStepPath?: string;
  notes?: string;
};
```

## Why These Fields Exist

- `id`: stable registry identity for reporting, overrides, and migration
- `layer`: forces each node into `dcc`, `decision`, or `checkout`
- `intent`: forces each node into `explore`, `understand`, `compare`, or `act`
- `topic`: shared subject handle across systems, for example `swamp-tours` or `concert-transport`
- `subtype`: optional narrower lens, for example `airboat`, `families`, `pickup`, `shared-shuttle`
- `sourceSystem`: tells you where the node originates logically
- `sourcePath`: concrete route or legacy path that produced the node
- `destinationPath`: canonical landing destination
- `nextStepPath`: the best next step if the destination page only solves part of the job
- `notes`: human override context, not business logic

## Extension Types

### WarmTransferNode

Use for DCC -> WTS or DCC -> checkout warm transfers.

```ts
export type WarmTransferNode = RoutingNode & {
  transferType: "warm-transfer";
  approvedTopic: string;
  approvedSubtypes?: readonly string[];
  approvedContexts?: readonly string[];
  approvedSourcePages?: readonly string[];
  context?: string;
  sourcePage?: string;
  packetVersion: 1;
};
```

### RedirectNode

Use for redirects, aliases, deprecated URLs, and old entry points.

```ts
export type RedirectSourceType = "legacy" | "external" | "search";
export type RedirectStatus = 301 | 302 | 307 | 308;
export type NextStepStatus = "yes" | "partial" | "no";

export type RedirectNode = RoutingNode & {
  transferType: "redirect";
  sourceType: RedirectSourceType;
  redirectStatus: RedirectStatus;
  canonicalDestination: boolean;
  nextStepStatus: NextStepStatus;
  externalDemandNotes?: string;
};
```

### LandingNode

Use for landing quality evaluation, especially PARR-style act pages and high-intent decision landers.

```ts
export type LandingNode = RoutingNode & {
  transferType: "landing";
  intentMatchScore: 1 | 2 | 3 | 4 | 5;
  nextStepClarityScore: 1 | 2 | 3 | 4 | 5;
  needsRewrite: boolean;
  needsRedirect: boolean;
  needsDedicatedLandingPage: boolean;
  reviewedAt?: string;
};
```

### PageRoutingNode

Use for canonical page metadata so every page has one declared job.

```ts
export type PageRoutingNode = RoutingNode & {
  transferType: "page";
  canonical: boolean;
  pageRole: "authority" | "bridge" | "decision" | "action";
};
```

## Registry File Shape

The registry should be split by concern, but all records should conform to the shared core and extensions.

Recommended paths:

- `src/data/routing/core.ts`
- `src/data/routing/nodes/pages.ts`
- `src/data/routing/nodes/warmTransfers.ts`
- `src/data/routing/nodes/redirects.ts`
- `src/data/routing/nodes/landings.ts`
- `src/data/routing/index.ts`

### `core.ts`

Contains only shared enums and shared base types.

### `nodes/pages.ts`

Contains canonical route metadata.

```ts
export const PAGE_ROUTING_NODES: PageRoutingNode[] = [
  {
    id: "dcc:new-orleans:swamp-tours",
    transferType: "page",
    layer: "dcc",
    intent: "understand",
    topic: "swamp-tours",
    sourceSystem: "dcc",
    sourcePath: "/new-orleans/swamp-tours",
    destinationPath: "/new-orleans/swamp-tours",
    nextStepPath: "https://welcometotheswamp.com/plan",
    canonical: true,
    pageRole: "bridge",
  },
];
```

### `nodes/warmTransfers.ts`

Contains approved packet definitions and allowed routing handoffs.

```ts
export const WARM_TRANSFER_NODES: WarmTransferNode[] = [
  {
    id: "wt:swamp:from-dcc-swamp-tours",
    transferType: "warm-transfer",
    layer: "decision",
    intent: "compare",
    topic: "swamp-tours",
    subtype: "comfort",
    sourceSystem: "dcc",
    sourcePath: "/new-orleans/swamp-tours",
    sourcePage: "/new-orleans/swamp-tours",
    destinationPath: "https://welcometotheswamp.com/plan",
    nextStepPath: "https://welcometotheswamp.com/live-options",
    approvedTopic: "swamp-tours",
    approvedSubtypes: ["airboat", "bayou", "boat", "comfort", "speed", "families", "half-day", "pickup"],
    approvedContexts: ["first-time", "kids", "no-car", "short-trip", "mixed-group"],
    approvedSourcePages: [
      "/new-orleans/tours",
      "/new-orleans/swamp-tours",
      "/new-orleans/swamp-tours/airboat-vs-boat",
      "/new-orleans/swamp-tours/best-time",
      "/new-orleans/swamp-tours/wildlife",
      "/new-orleans/swamp-tours/with-kids",
      "/new-orleans/swamp-tours/worth-it",
      "/new-orleans/swamp-tours/transportation",
      "/new-orleans/swamp-tours/types",
    ],
    packetVersion: 1,
  },
];
```

### `nodes/redirects.ts`

Contains redirect behavior and quality expectations.

```ts
export const REDIRECT_NODES: RedirectNode[] = [
  {
    id: "redirect:downtown",
    transferType: "redirect",
    layer: "checkout",
    intent: "act",
    topic: "concert-transport",
    subtype: "pickup",
    sourceSystem: "redirect",
    sourcePath: "/downtown",
    destinationPath: "/guide/local/denver-pickups",
    nextStepPath: "/book/red-rocks",
    sourceType: "external",
    redirectStatus: 308,
    canonicalDestination: true,
    nextStepStatus: "yes",
    externalDemandNotes: "Downtown hotel traffic is usually transport-intent and should land on a pickup-first page.",
  },
];
```

### `nodes/landings.ts`

Contains quality scoring and rewrite flags.

```ts
export const LANDING_NODES: LandingNode[] = [
  {
    id: "landing:parr:denver-pickups",
    transferType: "landing",
    layer: "checkout",
    intent: "act",
    topic: "concert-transport",
    subtype: "pickup",
    sourceSystem: "parr",
    sourcePath: "/guide/local/denver-pickups",
    destinationPath: "/guide/local/denver-pickups",
    nextStepPath: "/book/red-rocks",
    intentMatchScore: 4,
    nextStepClarityScore: 5,
    needsRewrite: false,
    needsRedirect: false,
    needsDedicatedLandingPage: false,
  },
];
```

### `index.ts`

Exports combined views without destroying the distinctions.

```ts
export const GLOBAL_ROUTING_REGISTRY = {
  pages: PAGE_ROUTING_NODES,
  warmTransfers: WARM_TRANSFER_NODES,
  redirects: REDIRECT_NODES,
  landings: LANDING_NODES,
};
```

## Migration Map

### 1. Current `lib/dcc/warmTransfer.ts`

Current shape:

```ts
type WarmTransferPacket = {
  intent: WarmTransferIntent;
  topic: WarmTransferTopic;
  subtype?: WarmTransferSubtype;
  context?: WarmTransferContext;
  source?: WarmTransferSource;
  sourcePage?: WarmTransferSourcePage;
};
```

Map to:
- `WarmTransferPacket.intent` -> `RoutingNode.intent`
- `WarmTransferPacket.topic` -> `RoutingNode.topic`
- `WarmTransferPacket.subtype` -> `RoutingNode.subtype`
- `WarmTransferPacket.source` -> `RoutingNode.sourceSystem`
- `WarmTransferPacket.sourcePage` -> `WarmTransferNode.sourcePage`
- `/plan` target inside `buildSwampPlanHref` -> `RoutingNode.destinationPath`
- default next step from `/plan` -> `RoutingNode.nextStepPath`
- approved arrays like `WARM_TRANSFER_SUBTYPES`, `WARM_TRANSFER_CONTEXTS`, `WARM_TRANSFER_SOURCE_PAGES` -> `WarmTransferNode.approvedSubtypes`, `approvedContexts`, `approvedSourcePages`

Migration recommendation:
- keep `lib/dcc/warmTransfer.ts` as the runtime helper for now
- move shared enums into `src/data/routing/core.ts`
- make `warmTransfer.ts` import from the shared core instead of owning its own truth
- define the swamp transfer as a `WarmTransferNode` record in `src/data/routing/nodes/warmTransfers.ts`

### 2. Current `src/data/routing/redirect-intent-registry.ts`

Current shape:

```ts
type RedirectIntentRecord = {
  sourcePath: string;
  sourceType: "legacy" | "external" | "search";
  detectedIntent: RoutingIntent;
  destinationPath: string;
  destinationType: "dcc" | "wts" | "parr";
  intentMatchScore: 1 | 2 | 3 | 4 | 5;
  needsIntentUpgrade: boolean;
  nextStepExists: "yes" | "partial" | "no";
  notes: string;
};
```

Map to two records, not one:

#### RedirectNode view
- `sourcePath` -> `RoutingNode.sourcePath`
- `sourceType` -> `RedirectNode.sourceType`
- `detectedIntent` -> `RoutingNode.intent`
- `destinationPath` -> `RoutingNode.destinationPath`
- `destinationType` -> `RoutingNode.layer`
  - `dcc` -> `dcc`
  - `wts` -> `decision`
  - `parr` -> `checkout`
- `nextStepExists` -> `RedirectNode.nextStepStatus`
- `notes` -> `RoutingNode.notes`

#### LandingNode view
- `intentMatchScore` -> `LandingNode.intentMatchScore`
- `needsIntentUpgrade` -> `LandingNode.needsRewrite`
- `nextStepExists` -> derive `LandingNode.nextStepClarityScore`
  - `yes` -> `4` or `5`
  - `partial` -> `2` or `3`
  - `no` -> `1`
- `needsDedicatedLandingPage`
  - set `true` when `needsIntentUpgrade` is `true` and the destination is too generic

Migration recommendation:
- do not delete `redirect-intent-registry.ts` immediately
- first create `nodes/redirects.ts` and `nodes/landings.ts`
- then generate them from the current records with a one-time migration script

### 3. PARR landing-quality records

Current PARR-style signals already exist conceptually across:
- redirect-target quality notes in `src/data/routing/redirect-intent-registry.ts`
- route and booking entry surfaces in PARR pages
- satellite handoff telemetry in `lib/dcc/satelliteHandoffs.ts` and `data/handoffs/satellites/*`

Treat these as `LandingNode` inputs, not as the shared core itself.

Map likely fields like this:
- landing URL -> `RoutingNode.sourcePath` and `RoutingNode.destinationPath`
- intent family -> `RoutingNode.intent`
- surface family (PARR) -> `RoutingNode.layer = "checkout"`
- quality score -> `LandingNode.intentMatchScore`
- next-step quality -> `LandingNode.nextStepClarityScore`
- rewrite flag -> `LandingNode.needsRewrite`
- dedicated-landing need -> `LandingNode.needsDedicatedLandingPage`

Migration recommendation:
- create explicit `LandingNode[]` entries for top PARR landers first
- begin with:
  - `/guide/local/denver-pickups`
  - `/venues/mishawaka-amphitheatre`
  - `/book/red-rocks`
  - `/routes/denver-red-rocks`
- then merge the current redirect-quality annotations into those landing records

### 4. WTS `/plan` as consumer

Current role:
- receives `WarmTransferPacket`
- parses packet values
- infers lane
- routes onward into live options or back into DCC

Map to:
- `destinationPath = https://welcometotheswamp.com/plan`
- `layer = decision`
- `intent = compare`
- `topic = swamp-tours`
- `nextStepPath = https://welcometotheswamp.com/live-options`

Migration recommendation:
- keep `/plan` as the canonical `decision` node
- register it explicitly in `nodes/pages.ts` as a `PageRoutingNode`
- keep packet parsing local, but source the allowed values from shared core types

## Normalized Field Mapping Table

| Current system | Current field | New field |
|---|---|---|
| warmTransfer | `intent` | `RoutingNode.intent` |
| warmTransfer | `topic` | `RoutingNode.topic` |
| warmTransfer | `subtype` | `RoutingNode.subtype` |
| warmTransfer | `source` | `RoutingNode.sourceSystem` |
| warmTransfer | `sourcePage` | `WarmTransferNode.sourcePage` |
| redirect registry | `sourcePath` | `RoutingNode.sourcePath` |
| redirect registry | `detectedIntent` | `RoutingNode.intent` |
| redirect registry | `destinationType` | `RoutingNode.layer` |
| redirect registry | `destinationPath` | `RoutingNode.destinationPath` |
| redirect registry | `nextStepExists` | `RedirectNode.nextStepStatus` and derived `LandingNode.nextStepClarityScore` |
| redirect registry | `intentMatchScore` | `LandingNode.intentMatchScore` |
| redirect registry | `needsIntentUpgrade` | `LandingNode.needsRewrite` |
| PARR landing notes | landing quality | `LandingNode.*` |
| canonical page metadata | page role | `PageRoutingNode.pageRole` |

## Recommended Rollout Order

1. Create `src/data/routing/core.ts`
2. Create `src/data/routing/nodes/warmTransfers.ts`
3. Create `src/data/routing/nodes/pages.ts`
4. Split `redirect-intent-registry.ts` into `nodes/redirects.ts` and `nodes/landings.ts`
5. Add `src/data/routing/index.ts` as the global registry export
6. Refactor `lib/dcc/warmTransfer.ts` to import the shared core types
7. Refactor validators and reports to read from the new registry views

## Immediate Benefits

- one routing language across DCC, WTS, PARR, and redirects
- no fake sameness between unlike systems
- stable place to score landing quality
- stable place to define approved warm-transfer packets
- clear path to future satellites without inventing a new naming model each time

## Blunt Rule

Every new route, redirect, handoff, or landing page should answer three questions in this system:
- what layer is this?
- what intent is this?
- what is the next step?

If the record cannot answer those cleanly, it does not belong in the network yet.
