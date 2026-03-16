# Planetary Map Model

This document describes the long-term DCC map model as a layered planetary system.

## Four Permanent Layers

DCC should be understood as four permanent layers:

1. `Backbone`
2. `Spatial map`
3. `Overlay domains`
4. `Control intelligence`

The app layer is delivery, not architecture.

## 1. Backbone

The backbone is the canonical world graph.

It answers:
- what exists
- where it is
- how it is connected

Backbone nodes include:
- places
- ports
- venues
- districts
- mobility hubs
- routes
- clusters

The canonical registry is the source of truth for this layer.

## 2. Spatial Map

The spatial map is the projection of the backbone into map-ready outputs.

Current projection path:
- `data/registry/**/*.jsonl`
- `scripts/dcc/build-master-map.mjs`
- `data/map/master-map.geojson`
- `data/map/by-class/*.geojson`

This is not a second truth system.
It is a visual projection of the canonical graph.

The map should eventually support:
- by class
- by country
- by region
- by overlay
- by user mode

## 3. Overlay Domains

Overlay domains are the fins attached to the backbone.

Examples:
- tours
- cruises
- live-city
- sports
- accessibility
- kid-friendly
- pet-friendly
- food
- events

Overlays do not redefine geography.
They attach product meaning to canonical nodes and destinations.

## 4. Control Intelligence

Control intelligence is the brain.

It handles:
- ranking
- freshness
- signal derivation
- handoff policies
- provider attachment
- product priorities
- editorial overrides
- ambiguity resolution

This layer changes quickly.
It should not be baked into the backbone.

## Where Destinations Fit

The destination layer is the missing bridge between:
- registry nodes
- product surfaces

Destinations are product-facing tourism contexts.

Examples:
- port `civitavecchia` -> destination `rome`
- port `piraeus` -> destination `athens`
- port `livorno` -> destination `florence`
- port `nassau` -> destination `nassau`

Destinations are not always identical to place nodes.

That is why the destination layer sits between the backbone and overlays:

`Backbone -> Destination -> Overlay -> Surface`

## The 3-D Backbone With Fins

The earlier “3-D backbone with fins” idea maps cleanly to the real architecture:

- backbone = stable spine
- destinations and overlays = fins
- control logic = lizard brain
- surfaces = visible skin

That means DCC can scale without mixing:
- truth
- tourism context
- commercial logic
- UI behavior

## Future `/map`

The future `/map` route should expose the planetary model directly:

- base layer = backbone
- selectable overlays = fins
- live emphasis = control intelligence

Examples:
- base map shows Denver, Nassau, Rome, ports, venues, districts
- tours overlay shows destination and gateway context
- live-city overlay shows active signals and district intensity
- control logic decides label density and emphasis

## Practical Rule

When placing data in DCC, ask:

- is this a durable thing in the world?
  - put it in the backbone
- is this a tourism or product context?
  - put it in the destination layer
- is this an overlay or product lens?
  - put it in an overlay
- is this ranking or orchestration?
  - put it in the control layer

That separation is what makes the planetary model scalable.
