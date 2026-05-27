# GEO Context Envelope Contract

Status: contract only

`GEO_CONTEXT_ENVELOPE` is the standard context wrapper used by EarthOS and DCC to interpret location-aware requests. It helps DCC route a user to the correct mission, corridor, operator, property node, or fallback inventory based on geography, intent, compliance limits, and operational state.

This contract does not build the EarthOS map UI, public real estate pages, MLS/RESO integrations, database migrations, or booking/payment behavior.

## 1. Purpose

The GEO context envelope gives DCC a governed spatial input before a decision is made.

It answers:

- Where is the request centered?
- Which corridors, operators, satellites, field tests, property nodes, and fallback providers are nearby?
- Which surface is allowed to answer?
- Which actions are blocked by governance, compliance, or operational risk?
- Which mission should win when multiple candidates overlap the same cell?

The envelope is context, not proof. It can inform routing, presentation, and governance review, but it does not prove revenue, fulfillment, MLS authorization, or operator readiness.

## 2. Core Doctrine

- DCC decides.
- EarthOS supplies governed operating context.
- Satellites narrow.
- Operators execute.
- Marketplaces are fallback inventory.
- Property nodes are mission surfaces, not MLS listings unless authorized.

The envelope should preserve the distinction between owned execution, partner execution, fallback inventory, field tests, and research targets.

## 3. Envelope Fields

Required envelope shape:

```json
{
  "request_id": "string",
  "user_context_mode": "anonymous | session | authenticated | internal",
  "lat": "number | null",
  "lng": "number | null",
  "h3_index": "string | null",
  "h3_resolution": "number | null",
  "geohash": "string | null",
  "region": "string | null",
  "country": "string | null",
  "nearby_corridors": ["string"],
  "nearby_operators": ["string"],
  "nearby_satellites": ["string"],
  "nearby_property_nodes": ["string"],
  "nearby_fallback_inventory": ["string"],
  "active_missions": ["string"],
  "operational_surface": "dcc_hub | satellite_surface | operator_surface | marketplace_fallback | field_test | property_mission | internal_governance | machine_surface",
  "proximity_affinity": {
    "primary": "string | null",
    "secondary": ["string"],
    "distance_miles": "number | null",
    "reason": "string | null"
  },
  "confidence_level": "low | medium | high",
  "source_surface": "string | null",
  "source_path": "string | null",
  "decision_corridor": "string | null",
  "allowed_actions": ["string"],
  "blocked_actions": ["string"],
  "compliance_notes": ["string"],
  "generated_at": "ISO-8601 string"
}
```

Field definitions:

`request_id`

A stable ID for the envelope generation event. It is not a booking ID and must not be treated as a checkout/session identifier.

`user_context_mode`

How much user context is available. `anonymous` means no durable identity. `session` means browser/session state exists. `authenticated` means known user state exists. `internal` means admin/governance use.

`lat` / `lng`

The request center. This can be user-provided, inferred from a place, derived from a property node, or null if unknown.

`h3_index`

The H3 cell identifier for spatial lookup. Null is allowed during contract/static examples.

`h3_resolution`

The H3 resolution used to generate `h3_index`. Higher resolution means more local precision.

`geohash`

Optional alternate spatial key for systems that do not use H3.

`region` / `country`

Human-legible jurisdiction context. Used for compliance, operator coverage, and fallback rules.

`nearby_corridors`

Governed DCC corridors near the request center, such as Red Rocks transport, Argo, Juneau excursions, or Wisconsin Dells group planning.

`nearby_operators`

Owned or partner operator surfaces that can execute or receive a governed handoff.

`nearby_satellites`

Satellite surfaces that can narrow the user once before execution.

`nearby_property_nodes`

Internal or authorized property mission nodes near the request center.

`nearby_fallback_inventory`

Fallback marketplace providers or cached fallback inventory relevant to the location.

`active_missions`

Current EarthOS missions eligible to answer the request.

`operational_surface`

The surface class that should answer or hold the request.

`proximity_affinity`

A compact explanation of what the request is closest to and why the envelope selected that relationship.

`confidence_level`

Confidence in the envelope. Low confidence should prefer research, internal governance, or fallback framing instead of direct execution claims.

`source_surface`

The source system or brand that created the request, such as DCC, WTA, WTS, PARR, EarthOS admin, social share, or machine surface.

`source_path`

The page or internal route that produced the request.

`decision_corridor`

The DCC corridor being evaluated, if known.

`allowed_actions`

Actions allowed under current governance. Examples: `show_operator`, `show_satellite`, `show_fallback`, `show_internal_property_node`, `show_field_test_note`, `render_bubbly_card`.

`blocked_actions`

Actions blocked by governance or compliance. Examples: `show_public_property_page`, `call_mls_api`, `change_checkout`, `claim_owned_execution`, `wire_field_test_telemetry`.

`compliance_notes`

Human-readable reasons for blocked actions, display limits, or special handling.

`generated_at`

ISO timestamp when the envelope was produced.

## 4. Operational Surface Vocabulary

`dcc_hub`

A DCC decision gate or hub page. DCC may decide the route, but it should not claim execution unless the downstream operator path is valid.

`satellite_surface`

A satellite brand or corridor page that narrows the user once.

`operator_surface`

An owned or partner execution surface responsible for booking, request, confirmation, customer support, or fulfillment.

`marketplace_fallback`

Fallback inventory such as Viator or GetYourGuide. It is not owned execution.

`field_test`

A manual or semi-manual test surface. It can collect observations but should not be wired into DCC telemetry as behavior proof prematurely.

`property_mission`

An internal or authorized property node mission. It can inform real estate broadcast context, but it is not an MLS listing unless authorized.

`internal_governance`

EarthOS admin, audit, report, control, approval, or parked-state review surface.

`machine_surface`

Machine-readable context such as sitemap, `llms.txt`, `agent.json`, JSON-LD, canonical URLs, feeds, or structured handoff metadata.

## 5. Mission Priority Logic

When one H3 cell contains multiple candidates, DCC ranks eligible missions in this order:

1. Protected owned execution.
2. Active paid/revenue corridor.
3. User-requested mission type.
4. Verified operator/satellite handoff.
5. Property mission if owner-authorized/manual.
6. Fallback marketplace.
7. Future target / research mode.

Rules:

- Protected money paths win over speculative discovery.
- A user-requested mission can win only if it does not violate protected execution or compliance boundaries.
- Property nodes can be shown internally before public approval, but they cannot override an active revenue corridor.
- Marketplace fallback can fill gaps, but it cannot be represented as owned execution.
- Research targets can appear in internal governance but should not be promoted publicly.

Examples:

Red Rocks cell with PARR plus property node:

PARR wins because it is protected owned execution with observed checkout/booking behavior. A nearby property node can be retained as an internal property mission or future Bubbly card context, but it must not distract from or modify PARR checkout/payment/order logic.

Argo cell with Shuttleya plus future property node:

Shuttleya wins if the operator/satellite handoff is verified. A future property node stays secondary unless the user explicitly requested a property mission and no active shuttle execution action is being taken.

Wisconsin Dells cell with Feastly/Dells/large-group rental opportunity:

If Feastly telemetry is invalid, it cannot be treated as truth. Dells group rental can be an internal property or field-test mission. Marketplace fallback may appear if owned execution is not available, but it is gap telemetry, not proof of corridor success.

Blue Hills field-test cell:

Field-test state wins only inside manual outreach/governance context. It should not generate DCC telemetry proof and should not be promoted as active owned execution until user behavior exists.

Unmapped cell with no owned execution:

DCC should choose future target/research mode or fallback marketplace if relevant. It should not invent an operator path or make execution claims.

## 6. Property Handling Rules

- Owner-submitted property nodes may appear as private/internal mission nodes.
- Public property display requires owner approval.
- MLS-derived property display requires authorized IDX, VOW, RESO, broker, or MLS access.
- No scraping.
- No exact public address exposure unless approved.
- No valuation/appraisal claims.
- No brokerage claims.
- No school, safety, appreciation, investment, rental-income, or guaranteed-buyer claims without compliant authorization and source support.
- Property nodes are mission surfaces and presentation candidates until authorization allows public listing behavior.

## 7. Fallback Inventory Rules

- Viator and GetYourGuide are fallback inventory, not owned execution.
- Marketplace fallback may be shown only when owned or controlled execution is unavailable, irrelevant, unapproved, or intentionally secondary.
- Marketplace clicks are gap/coverage telemetry, not proof of owned corridor success.
- Fallback inventory must preserve provider identity and should not be blended into operator claims.
- Fallback inventory should not override protected owned execution.

## 8. Bubbly/Social UI Relationship

Bubbly cards are presentation output from the envelope, not the source of truth.

Required presentation fields:

```json
{
  "display_label": "string",
  "vibe_tags": ["string"],
  "social_glow_state": "quiet | warm | lively | high_energy | scenic | parked",
  "share_context": {
    "share_id": "string | null",
    "broadcaster_id": "string | null",
    "channel": "string | null",
    "source_url": "string | null"
  },
  "card_priority": "number",
  "reason_shown": "string",
  "compliance_label": "string"
}
```

`display_label`

Short public or internal label. For property missions, this may need to hide exact address.

`vibe_tags`

Presentation tags derived from the envelope and governed vibe metadata.

`social_glow_state`

Visual energy setting for the card. This does not change routing truth.

`share_context`

Broadcaster or social source context. It is attribution, not commission proof.

`card_priority`

Presentation priority after governance and mission ranking.

`reason_shown`

Human-readable explanation of why this card appeared.

`compliance_label`

Required display caveat such as `internal only`, `owner submitted`, `MLS authorization required`, `fallback inventory`, or `field test`.

## 9. Example Envelopes

Red Rocks / PARR:

```json
{
  "request_id": "geo_req_red_rocks_001",
  "user_context_mode": "session",
  "lat": 39.6654,
  "lng": -105.2057,
  "h3_index": "89268c2e2b7ffff",
  "h3_resolution": 9,
  "geohash": "9xj7",
  "region": "Colorado",
  "country": "US",
  "nearby_corridors": ["red_rocks_transport"],
  "nearby_operators": ["party_at_red_rocks"],
  "nearby_satellites": [],
  "nearby_property_nodes": ["property_morrison_future_001"],
  "nearby_fallback_inventory": ["viator_red_rocks", "getyourguide_denver"],
  "active_missions": ["protect_parr_money_path"],
  "operational_surface": "operator_surface",
  "proximity_affinity": {
    "primary": "party_at_red_rocks",
    "secondary": ["red_rocks_transport"],
    "distance_miles": 0.1,
    "reason": "protected owned execution is available for Red Rocks shuttle intent"
  },
  "confidence_level": "high",
  "source_surface": "dcc",
  "source_path": "/red-rocks-transportation",
  "decision_corridor": "red_rocks_transport",
  "allowed_actions": ["show_operator", "preserve_decision_context"],
  "blocked_actions": ["change_checkout", "show_public_property_page", "treat_marketplace_as_owned_execution"],
  "compliance_notes": ["PARR checkout/payment/order logic is protected."],
  "generated_at": "2026-05-27T00:00:00.000Z"
}
```

Argo / Shuttleya:

```json
{
  "request_id": "geo_req_argo_001",
  "user_context_mode": "anonymous",
  "lat": 39.7425,
  "lng": -105.5166,
  "h3_index": "89268c05d2fffff",
  "h3_resolution": 9,
  "geohash": "9xhx",
  "region": "Colorado",
  "country": "US",
  "nearby_corridors": ["argo_transport"],
  "nearby_operators": ["shuttleya"],
  "nearby_satellites": ["shuttleya_argo"],
  "nearby_property_nodes": ["property_argo_future_001"],
  "nearby_fallback_inventory": ["viator_denver_mountains"],
  "active_missions": ["verify_argo_operator_handoff"],
  "operational_surface": "satellite_surface",
  "proximity_affinity": {
    "primary": "shuttleya_argo",
    "secondary": ["argo_transport"],
    "distance_miles": 0.4,
    "reason": "satellite route can narrow once toward operator execution"
  },
  "confidence_level": "medium",
  "source_surface": "dcc",
  "source_path": "/colorado/argo",
  "decision_corridor": "argo_transport",
  "allowed_actions": ["show_satellite", "show_operator_if_verified"],
  "blocked_actions": ["claim_property_execution", "treat_future_property_node_as_public_listing"],
  "compliance_notes": ["Future property node remains internal until owner authorization."],
  "generated_at": "2026-05-27T00:00:00.000Z"
}
```

Wisconsin Dells large-group property mission:

```json
{
  "request_id": "geo_req_dells_group_001",
  "user_context_mode": "internal",
  "lat": 43.6275,
  "lng": -89.7709,
  "h3_index": "892664c92dbffff",
  "h3_resolution": 9,
  "geohash": "dp8w",
  "region": "Wisconsin",
  "country": "US",
  "nearby_corridors": ["wisconsin_dells_groups"],
  "nearby_operators": [],
  "nearby_satellites": [],
  "nearby_property_nodes": ["property_dells_large_group_future_001"],
  "nearby_fallback_inventory": ["viator_wisconsin_dells", "getyourguide_wisconsin_dells"],
  "active_missions": ["large_group_rental_research", "feastly_telemetry_repair_parked"],
  "operational_surface": "internal_governance",
  "proximity_affinity": {
    "primary": "property_dells_large_group_future_001",
    "secondary": ["wisconsin_dells_groups"],
    "distance_miles": 1.2,
    "reason": "property mission is research/internal; Feastly telemetry is invalid"
  },
  "confidence_level": "low",
  "source_surface": "earthos_admin",
  "source_path": "/admin",
  "decision_corridor": "wisconsin_dells_groups",
  "allowed_actions": ["show_internal_property_node", "show_research_note", "show_fallback"],
  "blocked_actions": ["read_invalid_telemetry_as_truth", "show_public_property_page", "call_mls_api"],
  "compliance_notes": ["No MLS authorization. Feastly telemetry remains invalid until checkout lifecycle is repaired."],
  "generated_at": "2026-05-27T00:00:00.000Z"
}
```

Blue Hills field test:

```json
{
  "request_id": "geo_req_blue_hills_001",
  "user_context_mode": "internal",
  "lat": 45.4200,
  "lng": -91.1000,
  "h3_index": "8926c856d37ffff",
  "h3_resolution": 9,
  "geohash": "9z3v",
  "region": "Wisconsin",
  "country": "US",
  "nearby_corridors": ["blue_hills_outpost"],
  "nearby_operators": ["blue_hills_outpost"],
  "nearby_satellites": [],
  "nearby_property_nodes": [],
  "nearby_fallback_inventory": [],
  "active_missions": ["manual_distribution_field_test"],
  "operational_surface": "field_test",
  "proximity_affinity": {
    "primary": "blue_hills_outpost",
    "secondary": [],
    "distance_miles": 0.5,
    "reason": "manual field test is active but not DCC telemetry"
  },
  "confidence_level": "medium",
  "source_surface": "earthos_admin",
  "source_path": "/docs/traffic-outreach-queue",
  "decision_corridor": "blue_hills_outpost",
  "allowed_actions": ["show_field_test_note", "log_manual_send"],
  "blocked_actions": ["wire_field_test_telemetry", "claim_revenue_proof"],
  "compliance_notes": ["Outreach effort is not telemetry. Only user behavior is telemetry."],
  "generated_at": "2026-05-27T00:00:00.000Z"
}
```

Juneau / WTA partner handoff:

```json
{
  "request_id": "geo_req_juneau_001",
  "user_context_mode": "session",
  "lat": 58.3019,
  "lng": -134.4197,
  "h3_index": "8928308286fffff",
  "h3_resolution": 9,
  "geohash": "c3j7",
  "region": "Alaska",
  "country": "US",
  "nearby_corridors": ["juneau_excursions"],
  "nearby_operators": ["juneau_partner_operator"],
  "nearby_satellites": ["welcome_to_alaska"],
  "nearby_property_nodes": [],
  "nearby_fallback_inventory": ["viator_juneau", "getyourguide_juneau"],
  "active_missions": ["verify_wta_partner_handoff"],
  "operational_surface": "satellite_surface",
  "proximity_affinity": {
    "primary": "welcome_to_alaska",
    "secondary": ["juneau_partner_operator"],
    "distance_miles": 0.7,
    "reason": "satellite can narrow toward partner handoff if verified"
  },
  "confidence_level": "medium",
  "source_surface": "wta",
  "source_path": "/juneau",
  "decision_corridor": "juneau_excursions",
  "allowed_actions": ["show_satellite", "show_partner_handoff", "show_fallback_if_partner_unavailable"],
  "blocked_actions": ["claim_owned_execution_without_partner_confirmation"],
  "compliance_notes": ["Partner handoff must preserve source path and target URL."],
  "generated_at": "2026-05-27T00:00:00.000Z"
}
```

Unknown / unmapped H3 cell:

```json
{
  "request_id": "geo_req_unknown_001",
  "user_context_mode": "anonymous",
  "lat": 41.0000,
  "lng": -100.0000,
  "h3_index": "8926a800003ffff",
  "h3_resolution": 9,
  "geohash": "9x1",
  "region": "unknown",
  "country": "US",
  "nearby_corridors": [],
  "nearby_operators": [],
  "nearby_satellites": [],
  "nearby_property_nodes": [],
  "nearby_fallback_inventory": [],
  "active_missions": ["research_mode"],
  "operational_surface": "internal_governance",
  "proximity_affinity": {
    "primary": null,
    "secondary": [],
    "distance_miles": null,
    "reason": "no governed execution or fallback inventory is known"
  },
  "confidence_level": "low",
  "source_surface": "dcc",
  "source_path": null,
  "decision_corridor": null,
  "allowed_actions": ["show_research_note"],
  "blocked_actions": ["claim_coverage", "show_operator", "show_public_property_page"],
  "compliance_notes": ["No mapped operator, satellite, property authorization, or fallback inventory."],
  "generated_at": "2026-05-27T00:00:00.000Z"
}
```

## 10. Build Phases

Phase 0: contract only

Define envelope fields, vocabulary, examples, priorities, and hard boundaries. No code or UI is required.

Phase 1: static envelope examples

Add governed static examples for known cells and mission types. These examples should remain source-controlled and non-public unless approved.

Phase 2: internal envelope debugger

Build an internal-only tool to inspect generated envelopes and blocked actions.

Phase 3: H3-backed mission lookup

Resolve candidates by H3 cell, neighboring cells, corridor state, and operator coverage.

Phase 4: EarthOS map overlay

Render envelope-derived state on the parked EarthOS map only after protected money-path and telemetry risks are controlled.

Phase 5: BubblySocialListing presentation

Use envelope output to render social cards for authorized property missions. Cards remain presentation, not source of truth.

Phase 6: MLS/RESO integration only after authorization

MLS, IDX, VOW, RESO, broker, or MLS-provider data can be integrated only after authorization, compliance review, and source attribution rules are approved.

## 11. Hard Boundaries

- No PARR payment/checkout/order changes.
- No MLS scraping.
- No public MLS display.
- No brokerage/commission claims.
- No map UI yet.
- No public real estate pages yet.
- No fallback marketplace treated as owned execution.
- No field-test nodes wired into DCC telemetry prematurely.
- No property nodes treated as MLS listings without authorization.
- No invalid telemetry used as truth.
- No checkout/session refactor unparked by spatial routing work.

