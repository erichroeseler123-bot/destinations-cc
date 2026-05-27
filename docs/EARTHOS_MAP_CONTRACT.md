# EarthOS Map Contract

Status: contract only

The EarthOS World Command Map is parked. This document defines the future map as a governed decision-routing graph, not as a decorative geographic interface.

## 1. Purpose

The EarthOS map is the network reference layer for the destination network.

It visualizes governed decision-routing state by geography, ownership, execution relationship, and machine-readable publication status. It shows how search demand, DCC decision pages, satellites, operators, fallback marketplaces, field tests, and governance assets relate to each other.

The map does not claim universal coverage. Absence from the map does not mean a place has no demand, and presence on the map does not prove revenue.

The map does not replace DCC Decision Intelligence. DCC remains the decision layer. EarthOS governs the network truth, publication state, operational drift, and approval rules around that layer.

The map does not execute bookings. Booking execution remains inside operator surfaces, approved marketplace fallbacks, or explicitly governed handoff paths.

## 2. Core Doctrine

- DCC decides.
- Satellites narrow once.
- Operators execute.
- Marketplaces are fallback inventory.
- EarthOS governs operations, publication, drift, canonical network truth, and promotion readiness.

EarthOS may show a route, but the map is not proof that the route is performing. Revenue proof comes from protected checkout, observed booking behavior, valid telemetry, or operator-confirmed fulfillment.

## 3. Node Types

`source_node`

A demand-origin node. Examples include Google Search, social traffic, local guide traffic, Reddit intent, email outreach, or paid/organic campaign entry points.

`destination_node`

A geographic destination, venue, city, corridor, event cluster, attraction, or travel problem area. Examples include Red Rocks Amphitheatre, Denver, Argo, Juneau, New Orleans, or Blue Hills.

`decision_gate`

A DCC-controlled decision surface that evaluates intent and routes users toward a recommended next action. Decision gates are the primary places where DCC Decision Intelligence applies.

`satellite_surface`

A narrow branded or corridor-specific surface that receives traffic from DCC or search and narrows once toward an operator, checkout, partner, or fallback.

`operator_surface`

An owned or partner execution surface where the user can book, request, confirm, or manage the real service. Operator surfaces are responsible for fulfillment claims.

`marketplace_fallback`

A non-owned inventory provider used when owned execution is unavailable, incomplete, or intentionally secondary. GetYourGuide and Viator belong here unless a specific operator execution contract says otherwise.

`field_test`

A manual or semi-manual validation node used to test local demand, messaging, outreach, or operational viability before full DCC telemetry wiring.

`machine_surface`

A machine-readable entry point or reference artifact, including `sitemap.xml`, `llms.txt`, `agent.json`, JSON-LD schema, feeds, and canonical metadata.

`governance_asset`

A doctrine, audit, contract, runbook, tracker, or control document that defines what may be published, changed, promoted, parked, or retired.

`property_listing`

A governed real estate broadcast node representing a home, condo, cabin, parcel, or seller-submitted listing. MLS or seller-provided facts remain baseline data; EarthOS may add vibe, attraction proximity, social asset, and broadcaster attribution metadata under `docs/EARTHOS_BROADCAST_CONTRACT.md`.

## 4. Edge Types

`search_to_dcc`

Search or discovery demand routes into a DCC decision gate.

`dcc_to_satellite`

A DCC decision gate routes to a narrower satellite surface.

`dcc_to_operator`

A DCC decision gate routes directly to an operator execution surface.

`satellite_to_operator`

A satellite surface routes to an operator execution surface.

`operator_to_confirmation`

An operator checkout, request, or booking flow routes to a confirmation, booking token, receipt, customer dashboard, or support surface.

`fallback_to_marketplace`

A destination, decision gate, or satellite routes to marketplace inventory as fallback.

`machine_readable_reference`

A page, domain, route, or node is represented by machine-readable assets such as sitemap entries, JSON-LD, `llms.txt`, or `agent.json`.

`telemetry_observation`

An observed behavior signal connects one node or edge to event evidence. This must distinguish valid behavior telemetry from outreach, assumptions, or invalid lifecycle data.

`drift_alert`

A governance edge that flags stale metadata, contradictory execution claims, broken machine-readable alignment, invalid telemetry, route-context leaks, or marketplace leakage.

## 5. Required Node Fields

Every map node must support these fields:

```json
{
  "id": "string",
  "label": "string",
  "node_type": "source_node | destination_node | decision_gate | satellite_surface | operator_surface | marketplace_fallback | field_test | machine_surface | governance_asset | property_listing",
  "lat": "number | null",
  "lng": "number | null",
  "region": "string | null",
  "country": "string | null",
  "canonical_domain": "string | null",
  "canonical_paths": ["string"],
  "related_operator": "string | null",
  "related_satellite": "string | null",
  "execution_owner": "string | null",
  "decision_owner": "string | null",
  "fallback_provider": "string | null",
  "status": "protected | live | measure | retune | telemetry_invalid | machine_drift | field_test | parked | future_target",
  "revenue_state": "proven_checkout | booking_interest | clickout_only | fallback_only | no_proof | invalid",
  "telemetry_state": "string",
  "machine_understanding_state": "string",
  "do_not_touch": "boolean",
  "next_action": "string | null",
  "last_verified_at": "ISO-8601 string | null"
}
```

## 6. Status Vocabulary

`protected`

Revenue-critical or operationally sensitive. Changes require explicit approval and focused verification.

`live`

Published and available to users. Live does not imply proven revenue.

`measure`

Traffic or behavior should be observed before optimization or expansion.

`retune`

Messaging, route context, schema, or handoff logic needs correction.

`telemetry_invalid`

Telemetry cannot currently be used as truth because lifecycle ordering, event coverage, identity, or route context is invalid.

`machine_drift`

Machine-readable assets disagree with canonical route, schema, operator, sitemap, `agent.json`, `llms.txt`, or public claims.

`field_test`

Manual validation is active, but it is not wired as DCC Decision Intelligence proof.

`parked`

Intentionally not being built, promoted, wired, or optimized until a prerequisite is complete.

`future_target`

Useful future node or market, but not part of current execution.

## 7. Revenue State Vocabulary

`proven_checkout`

Observed checkout starts and booking completions exist, and telemetry lifecycle is valid enough to trust.

`booking_interest`

Users show intent such as CTA clicks, booking opens, quote requests, checkout starts, or direct customer messages, but completed revenue is not yet proven.

`clickout_only`

The surface routes traffic outward, but owned booking or confirmed fulfillment is not observed.

`fallback_only`

Inventory is available only through fallback providers such as GetYourGuide, Viator, FareHarbor, Rezdy widgets, or affiliate/partner links.

`no_proof`

No reliable behavior or revenue proof exists.

`invalid`

Data is unusable because lifecycle order, telemetry identity, route context, or source attribution is broken.

## 8. Drift Detection Layer

`stale_metadata`

Title, description, schema, event date, pickup details, operator facts, canonical URL, or published status no longer matches current reality.

`marketplace_leakage`

A route that should favor owned/operator execution sends users to fallback marketplace inventory without an intentional fallback decision.

`contradictory_execution_claims`

A page, schema, dashboard, or machine-readable asset claims owned execution, pickup, checkout, delivery, capacity, or confirmation behavior that the operator path does not actually support.

`missing_decision_continuity`

The user moves from search or DCC to a satellite/operator surface without preserving route context, decision action, source path, product, or handoff parameters.

`stale_schema`

JSON-LD, `agent.json`, `llms.txt`, sitemap, or canonical metadata references retired routes, wrong operators, old inventory, or missing current pages.

`broken_sitemap_agent_llms_alignment`

The sitemap, `agent.json`, and `llms.txt` disagree about what pages exist, which routes are canonical, or which surfaces machines should understand.

`event_lifecycle_impossibility`

Telemetry claims an impossible order of events, such as `booking_completed` before `checkout_started`, or completion without a valid route/session context.

`route_context_leak`

Events, links, or handoffs lose `target_path`, `target_url`, route target, source path, decision corridor, or product identity.

## 9. Machine-Readable Assets

The map references machine-readable assets as governed node and edge evidence.

`sitemap.xml`

Defines indexable canonical route availability. The map may flag routes missing from sitemap or routes present in sitemap that are no longer valid.

`llms.txt`

Defines preferred machine-readable explanation and retrieval context. The map may flag stale or missing LLM-facing route summaries.

`agent.json`

Defines agent-facing operational and routing metadata. The map may flag mismatches between agent routing claims and actual operator paths.

JSON-LD schema

Defines structured page, local business, service, offer, event, FAQ, and route data. The map may flag stale schema or schema that overclaims execution.

Canonical URLs

Each node and edge should resolve to one canonical public URL or an explicit internal governance asset. Duplicates must be marked as aliases, not separate truth.

`decision_*` handoff params

Decision continuity depends on preserving route context through parameters such as `decision_corridor`, `decision_action`, `decision_option`, `decision_product`, source URL, target path, and handoff IDs.

## 10. Example Node Records

```json
[
  {
    "id": "operator_parr_red_rocks",
    "label": "Party at Red Rocks / Red Rocks Amphitheatre",
    "node_type": "operator_surface",
    "lat": 39.6654,
    "lng": -105.2057,
    "region": "Colorado",
    "country": "US",
    "canonical_domain": "partyatredrocks.com",
    "canonical_paths": ["/", "/book/red-rocks-amphitheatre/custom/shared", "/booking/[token]"],
    "related_operator": "party_at_red_rocks",
    "related_satellite": null,
    "execution_owner": "PARR",
    "decision_owner": "DCC",
    "fallback_provider": null,
    "status": "protected",
    "revenue_state": "proven_checkout",
    "telemetry_state": "observed_checkout_and_booking_completion",
    "machine_understanding_state": "canonical_operator_surface",
    "do_not_touch": true,
    "next_action": "finish payment-flow review before publishing checkout/session changes",
    "last_verified_at": "2026-05-27"
  },
  {
    "id": "dcc_denver_hub",
    "label": "DCC / Denver Hub",
    "node_type": "decision_gate",
    "lat": 39.7392,
    "lng": -104.9903,
    "region": "Colorado",
    "country": "US",
    "canonical_domain": "destinationcommandcenter.com",
    "canonical_paths": ["/red-rocks-transportation", "/red-rocks-shuttle-vs-uber"],
    "related_operator": "party_at_red_rocks",
    "related_satellite": null,
    "execution_owner": null,
    "decision_owner": "DCC",
    "fallback_provider": "GetYourGuide/Viator when owned execution is not available",
    "status": "measure",
    "revenue_state": "booking_interest",
    "telemetry_state": "decision_intelligence_normalization_recently_validated_in_code",
    "machine_understanding_state": "machine assets require production validation",
    "do_not_touch": false,
    "next_action": "validate telemetry normalization in production",
    "last_verified_at": "2026-05-27"
  },
  {
    "id": "satellite_shuttleya_argo",
    "label": "Shuttleya / Argo",
    "node_type": "satellite_surface",
    "lat": 39.7425,
    "lng": -105.5166,
    "region": "Colorado",
    "country": "US",
    "canonical_domain": "shuttleya.com",
    "canonical_paths": ["/argo"],
    "related_operator": "shuttleya",
    "related_satellite": "shuttleya",
    "execution_owner": "Shuttleya",
    "decision_owner": "DCC",
    "fallback_provider": null,
    "status": "measure",
    "revenue_state": "booking_interest",
    "telemetry_state": "needs route-specific verification",
    "machine_understanding_state": "canonical satellite route",
    "do_not_touch": false,
    "next_action": "confirm handoff continuity and operator booking path",
    "last_verified_at": "2026-05-27"
  },
  {
    "id": "satellite_wta_juneau",
    "label": "Welcome to Alaska / Juneau",
    "node_type": "satellite_surface",
    "lat": 58.3019,
    "lng": -134.4197,
    "region": "Alaska",
    "country": "US",
    "canonical_domain": "welcometoalaska.com",
    "canonical_paths": ["/juneau"],
    "related_operator": "juneau_partner",
    "related_satellite": "welcome_to_alaska",
    "execution_owner": "partner_operator",
    "decision_owner": "DCC",
    "fallback_provider": "GetYourGuide/Viator when partner path is unavailable",
    "status": "measure",
    "revenue_state": "clickout_only",
    "telemetry_state": "partner handoff requires validation",
    "machine_understanding_state": "needs schema and handoff audit",
    "do_not_touch": false,
    "next_action": "verify partner handoff and fallback boundary",
    "last_verified_at": "2026-05-27"
  },
  {
    "id": "satellite_wts_new_orleans",
    "label": "Welcome to the Swamp / New Orleans",
    "node_type": "satellite_surface",
    "lat": 29.9511,
    "lng": -90.0715,
    "region": "Louisiana",
    "country": "US",
    "canonical_domain": "welcometotheswamp.com",
    "canonical_paths": ["/"],
    "related_operator": "swamp_partner",
    "related_satellite": "welcome_to_the_swamp",
    "execution_owner": "partner_operator",
    "decision_owner": "DCC",
    "fallback_provider": "GetYourGuide/Viator when partner path is unavailable",
    "status": "retune",
    "revenue_state": "booking_interest",
    "telemetry_state": "route-context risk remains parked",
    "machine_understanding_state": "needs handoff and target_path verification",
    "do_not_touch": true,
    "next_action": "do not publish parked WTS route-context repair until reviewed",
    "last_verified_at": "2026-05-27"
  },
  {
    "id": "field_blue_hills_outpost",
    "label": "Blue Hills Outpost",
    "node_type": "field_test",
    "lat": 45.4200,
    "lng": -91.1000,
    "region": "Wisconsin",
    "country": "US",
    "canonical_domain": "bluehillsoutpost.com",
    "canonical_paths": ["/", "/sitemap.xml"],
    "related_operator": "blue_hills_outpost",
    "related_satellite": null,
    "execution_owner": "Blue Hills Outpost",
    "decision_owner": "manual_field_test",
    "fallback_provider": null,
    "status": "field_test",
    "revenue_state": "no_proof",
    "telemetry_state": "manual outreach only; not DCC telemetry",
    "machine_understanding_state": "sitemap submission and local-guide distribution pending/manual",
    "do_not_touch": false,
    "next_action": "log only actual manual sends in outreach tracker",
    "last_verified_at": "2026-05-27"
  },
  {
    "id": "surface_feastly",
    "label": "Feastly",
    "node_type": "operator_surface",
    "lat": null,
    "lng": null,
    "region": null,
    "country": "US",
    "canonical_domain": null,
    "canonical_paths": [],
    "related_operator": "feastly",
    "related_satellite": null,
    "execution_owner": "Feastly",
    "decision_owner": "DCC",
    "fallback_provider": null,
    "status": "telemetry_invalid",
    "revenue_state": "invalid",
    "telemetry_state": "checkout_started must be guaranteed before booking_completed",
    "machine_understanding_state": "not eligible for map proof",
    "do_not_touch": true,
    "next_action": "keep telemetry fix parked until repo ownership and lifecycle are clean",
    "last_verified_at": "2026-05-27"
  },
  {
    "id": "fallback_getyourguide_viator",
    "label": "GetYourGuide / Viator",
    "node_type": "marketplace_fallback",
    "lat": null,
    "lng": null,
    "region": "global",
    "country": null,
    "canonical_domain": null,
    "canonical_paths": [],
    "related_operator": null,
    "related_satellite": null,
    "execution_owner": "marketplace_provider",
    "decision_owner": "DCC",
    "fallback_provider": "GetYourGuide/Viator",
    "status": "live",
    "revenue_state": "fallback_only",
    "telemetry_state": "clickout or API inventory only",
    "machine_understanding_state": "fallback inventory, not owned execution",
    "do_not_touch": false,
    "next_action": "keep fallback visibly distinct from operator execution",
    "last_verified_at": "2026-05-27"
  }
]
```

## 11. Example Edge Records

```json
[
  {
    "id": "edge_dcc_red_rocks_to_parr_shared",
    "edge_type": "dcc_to_operator",
    "from": "dcc_denver_hub",
    "to": "operator_parr_red_rocks",
    "label": "DCC Red Rocks page -> PARR shuttle booking",
    "required_context": ["decision_corridor", "decision_action", "decision_option", "decision_product", "target_path"],
    "status": "protected",
    "revenue_state": "proven_checkout",
    "notes": "Money path. Do not alter checkout/payment/session behavior without explicit approval."
  },
  {
    "id": "edge_dcc_argo_to_shuttleya",
    "edge_type": "dcc_to_satellite",
    "from": "dcc_denver_hub",
    "to": "satellite_shuttleya_argo",
    "label": "DCC Argo page -> Shuttleya Argo booking",
    "required_context": ["source_path", "target_path", "decision_product"],
    "status": "measure",
    "revenue_state": "booking_interest",
    "notes": "Verify operator handoff continuity before promotion."
  },
  {
    "id": "edge_wta_juneau_partner_handoff",
    "edge_type": "satellite_to_operator",
    "from": "satellite_wta_juneau",
    "to": "operator_juneau_partner",
    "label": "WTA Juneau page -> partner handoff",
    "required_context": ["source_path", "target_url", "decision_option"],
    "status": "measure",
    "revenue_state": "clickout_only",
    "notes": "Partner handoff is execution only if partner path is confirmed."
  },
  {
    "id": "edge_dcc_fallback_to_marketplace",
    "edge_type": "fallback_to_marketplace",
    "from": "dcc_denver_hub",
    "to": "fallback_getyourguide_viator",
    "label": "DCC fallback -> GYG/Viator marketplace inventory",
    "required_context": ["fallback_reason", "target_url", "marketplace_provider"],
    "status": "live",
    "revenue_state": "fallback_only",
    "notes": "Fallback inventory must not be represented as owned execution."
  },
  {
    "id": "edge_blue_hills_manual_field_test",
    "edge_type": "telemetry_observation",
    "from": "field_blue_hills_outpost",
    "to": "governance_blue_hills_outreach_tracker",
    "label": "Blue Hills manual field test -> no DCC telemetry edge",
    "required_context": ["manual_send_log"],
    "status": "field_test",
    "revenue_state": "no_proof",
    "notes": "Outreach effort is not telemetry. Only user behavior is telemetry."
  }
]
```

## 12. Build Phases

Phase 0: contract only

Define doctrine, fields, node types, edge types, status vocabulary, examples, and boundaries. No UI.

Phase 1: static config

Create a source-controlled static config or data model that represents nodes and edges without rendering a map.

Phase 2: read-only internal map

Render a private/internal map from static config. No booking execution, no write actions, no automated promotion.

Phase 3: telemetry overlays

Overlay valid telemetry only after event lifecycle, route context, and production normalization are verified.

Phase 4: drift alerts

Surface machine-readable drift, marketplace leakage, stale metadata, route-context leaks, and invalid lifecycle alerts.

Phase 5: publishing/governance approvals

Use EarthOS approval rules to decide whether routes become public, stay parked, get retuned, or require operator/payment-path review.

## 13. Hard Boundaries

- Do not use the map as proof of revenue.
- Do not treat fallback marketplaces as owned execution.
- Do not wire field tests into DCC telemetry prematurely.
- Do not read invalid telemetry as truth.
- Do not let visual polish outrun payment-path reliability.
- Do not let the map make booking, payment, refund, or fulfillment claims that the operator path cannot support.
- Do not use the map to bypass protected-money-path review.

## 14. Current Parking Rule

EarthOS World Command Map remains parked until PARR payment-flow risk is reviewed and DCC telemetry normalization has been validated in production.

Until then, EarthOS map work is limited to docs, doctrine, and static contract shape. No map UI, no telemetry overlay, no governance automation, no booking-path wiring, and no field-test telemetry promotion should be built.
