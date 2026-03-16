# Destination Layer

The destination layer is the product-facing interpretation of the DCC world graph.

A destination is not always the same thing as a registry node.

Examples:
- `civitavecchia` is a canonical port node
- `rome` is a tourism destination context
- `/ports/civitavecchia` can hand off into `/rome/tours`

## Purpose

Destinations unify the product inputs that are currently spread across:
- `data/city-aliases.json`
- `data/attractions.json`
- `data/port-tour-destinations.json`

The long-term goal is for destination records to become the single source of truth for:
- destination aliases
- port gateways
- provider IDs
- starter intents
- destination status and visibility

Then the legacy compatibility files can be generated from the destination layer instead of maintained by hand.

## File Shape

Each destination file represents one tourism context:

- `slug`
- `name`
- `country_code`
- `registry_nodes`
- `port_gateways`
- `aliases`
- `providers`
- `starter_intents`
- `tags`
- `status`
- `visibility`

Example files:
- `data/destinations/rome.json`
- `data/destinations/athens.json`
- `data/destinations/nassau.json`

## Relationship To The Backbone

The registry backbone models what exists in the world.

The destination layer models how tourism and product surfaces interpret that world.

Examples:
- `dcc:place:it-rome:0001` -> destination `rome`
- `dcc:port:it-civitavecchia:0001` -> destination `rome`
- `dcc:port:gr-piraeus:0001` -> destination `athens`

That means:
- ports do not need to become fake cities
- place nodes do not need to absorb product logic
- mapped gateways remain explicit and auditable

## Relationship To Routes

This folder does not change routes by itself.

Current route behavior still depends on:
- `data/city-aliases.json`
- `data/attractions.json`
- `data/port-tour-destinations.json`

These destination files are the foundation for a future migration where those files become derived indexes.

## Next Migration Direction

1. Add more destination records.
2. Build a destination index/export script.
3. Generate:
   - city aliases
   - starter intents
   - port-to-destination handoff indexes
4. Switch tours coverage maintenance to destination records first, not scattered files.
