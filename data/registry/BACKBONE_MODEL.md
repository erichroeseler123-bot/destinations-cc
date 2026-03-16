# Backbone Model

## Core Idea

DCC should be understood as three stacked layers:

1. Backbone
2. Fins
3. Hidden control layer

They are different jobs, not different names for the same thing.

## Backbone

The backbone is the canonical spatial and structural graph.

It contains the durable entities that define what the world is:

- places
- districts
- ports
- venues
- transport hubs
- routes
- neighborhoods
- service areas

The backbone answers:

- what exists
- where it is
- what it is called canonically
- how it is structurally related

In practical terms, the registry plus validated edges form the backbone.

Backbone properties:

- canonical
- durable
- slowly changing
- ID-based
- mapable
- suitable for indexing and graph operations

The backbone is the authoritative structural layer for future routing, master maps, resolver logic, and node attachment.

## Fins

Fins are domain overlays attached to backbone nodes.

They are not the world itself. They are specialized surfaces attached to the world.

Examples of fins:

- cruise overlays on ports
- sports overlays on venues and cities
- accessibility overlays on places and districts
- live-city overlays on anchors, districts, places, and signals
- tourism overlays on places and attractions
- editorial collections bound to places or routes

A fin takes canonical backbone nodes and adds domain-specific meaning, ranking, or product framing.

Backbone example:

- `dcc:place:us-co-denver:0001`

Fin examples attached to it:

- Denver live-city bundle
- Denver sports context
- Denver accessibility overlay
- Denver travel planning layer

The same backbone node can support many fins without changing its identity.

## Hidden Control Layer

The hidden control layer is the orchestration and decision layer behind the visible system.

This layer includes:

- operators
- product attachment logic
- signal derivation
- ranking
- routing policy
- resolver rules
- freshness enforcement
- orchestration pipelines
- commercial prioritization logic
- editorial overrides

This layer should usually not be modeled as visible backbone geography.

It is the machinery that decides:

- what to show first
- what is active now
- which node should resolve for an ambiguous input
- which products attach to which places
- which signals are strong enough to surface

The hidden control layer makes the system useful, but it should not be confused with the canonical graph itself.

## How The Layers Work Together

Backbone:

- the stable graph of real nodes

Fins:

- specialized product and domain overlays attached to those nodes

Hidden control layer:

- the logic that ranks, derives, orchestrates, and surfaces the right fin content on top of the backbone

Simple formula:

`Backbone + Fins + Control = DCC product behavior`

## Future Master Map

The future master map should be built on the backbone first.

That means the map starts from canonical nodes and canonical edges:

- places
- ports
- districts
- venues
- transport hubs
- routes

Then fins can be layered on top:

- cruise network
- sports activity
- live-city pulse
- tourism recommendations
- accessibility overlays

And the hidden control layer determines:

- which layer combinations are visible
- how dense the map should be
- how to rank labels and signals
- what to emphasize for a given user mode

The master map should not be a dump of every product artifact. It should be a controlled view over the backbone with fin overlays and operator logic layered above it.

## `/map` Route Direction

The future `/map` route should reflect this model directly.

Proposed mental structure:

- base map = backbone
- selectable overlays = fins
- live emphasis and ranking = control layer

So:

- the user sees canonical geography and structure
- overlays enrich the map without redefining the world
- ranking and live logic determine emphasis without corrupting canonical identity

Example:

- backbone shows Denver, Union Station, Ball Arena, LoDo, Theater District
- live-city fin shows active districts and signals tonight
- sports fin shows game-related venue gravity
- control layer decides which labels and signals are dominant right now

## Practical Rule

When deciding where something belongs, ask:

- is this a durable thing in the world
  - backbone
- is this a domain-specific attachment to a backbone node
  - fin
- is this ranking, orchestration, or operator logic
  - hidden control layer

That separation keeps DCC scalable.

It prevents:

- routing logic from polluting canonical identity
- product overlays from becoming fake geography
- temporary ranking behavior from hardening into the backbone
