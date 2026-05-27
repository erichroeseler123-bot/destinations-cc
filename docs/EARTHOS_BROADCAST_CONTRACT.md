# EarthOS Broadcast Contract

Status: contract only

EarthOS Broadcast extends the map contract for a free-to-list, social-first real estate broadcast network. A property listing is treated as a governed map node whose sales story is powered by destination intelligence, not by unverified hype.

This contract does not create a public listing marketplace, booking engine, MLS replacement, database migration, public API, or payment path.

## 1. Purpose

EarthOS Broadcast gives homeowners and broadcasters a bubbly social-sharing experience for property discovery while preserving governance boundaries.

MLS data supplies baseline facts: address, beds, baths, square footage, lot size, price, listing status, brokerage attribution, and compliance fields.

EarthOS supplies the narrative layer: attraction proximity, neighborhood energy, food and drink density, trail/outdoor access, event access, transit/shuttle convenience, and destination-style vibe metadata.

The goal is to make a house feel shareable, legible, and locally alive without turning vibe language into a false execution or revenue claim.

## 2. Relationship To EarthOS Map

`property_listing` is an EarthOS map node type. It extends the required node fields defined in `docs/EARTHOS_MAP_CONTRACT.md` and adds real estate, vibe, social asset, and broadcaster attribution fields.

A property node can connect to:

- destination nodes such as Denver, Juneau, New Orleans, or Blue Hills.
- attraction nodes such as venues, restaurants, trailheads, districts, waterfronts, parks, and social hubs.
- decision gates that explain neighborhood fit or relocation intent.
- machine surfaces such as canonical listing URLs, JSON-LD, sitemap entries, and dynamic OG assets.
- broadcaster attribution edges that explain how social traffic arrived.

The property node is not proof of sale, not proof of buyer intent, and not owned execution unless a separate compliant real estate transaction system exists.

## 3. Node Type: property_listing

`property_listing`

A home, condo, cabin, land parcel, rental-ready property, or seller-submitted listing that can be placed on the EarthOS map and shared through social broadcast assets.

Required base fields from the EarthOS map contract still apply:

```json
{
  "id": "property_denver_lodo_001",
  "label": "LoDo Loft Near Union Station",
  "node_type": "property_listing",
  "lat": 39.7521,
  "lng": -105.0005,
  "region": "Colorado",
  "country": "US",
  "canonical_domain": "destinationcommandcenter.com",
  "canonical_paths": ["/admin/real-estate"],
  "related_operator": null,
  "related_satellite": null,
  "execution_owner": "listing_owner_or_agent",
  "decision_owner": "EarthOS Broadcast",
  "fallback_provider": "MLS baseline source",
  "status": "parked",
  "revenue_state": "no_proof",
  "telemetry_state": "admin scaffold only",
  "machine_understanding_state": "contracted, not public",
  "do_not_touch": false,
  "next_action": "validate vibe scoring against existing attraction data",
  "last_verified_at": "2026-05-27"
}
```

## 4. MLS Baseline Fields

MLS or seller-provided baseline facts must remain separate from vibe metadata.

```json
{
  "mls_id": "string | null",
  "listing_source": "mls | owner | agent | manual_seed",
  "listing_status": "draft | active | pending | sold | withdrawn | expired",
  "street_address": "string",
  "city": "string",
  "state": "string",
  "postal_code": "string",
  "price": "number | null",
  "beds": "number | null",
  "baths": "number | null",
  "square_feet": "number | null",
  "lot_size": "string | null",
  "property_type": "house | condo | townhome | cabin | land | multifamily | other",
  "listing_agent": "string | null",
  "brokerage": "string | null",
  "compliance_notes": ["string"]
}
```

Baseline facts are factual listing data. Vibe fields are editorial routing metadata and must not contradict MLS facts.

## 5. Vibe Metadata

Vibe metadata explains why a property may feel desirable in social language. It must be calculated from declared features, attraction proximity, existing destination intelligence, and visible map relationships.

Core vibe fields:

```json
{
  "vibe_tags": ["cozy", "foodie-proximity", "trail-access"],
  "vibe_scores": {
    "cozy": 72,
    "high_energy": 83,
    "trail_access": 58,
    "foodie_proximity": 91,
    "nightlife": 76,
    "family_easy": 54,
    "event_access": 88,
    "shuttle_access": 67,
    "quiet_retreat": 41,
    "weekend_basecamp": 69
  },
  "primary_vibe": "foodie_proximity",
  "secondary_vibes": ["event_access", "high_energy"],
  "vibe_summary": "A food-and-events base near Union Station, LoDo restaurants, and downtown venues.",
  "vibe_evidence": [
    {
      "kind": "attraction_proximity",
      "label": "Union Station",
      "distance_miles": 0.2,
      "tags": ["walkable", "food", "mobility-hub"]
    }
  ],
  "vibe_confidence": "low | medium | high",
  "vibe_last_scored_at": "ISO-8601 string"
}
```

Suggested vibe tag vocabulary:

- `cozy`: intimate, warm, smaller-scale, quiet, nestable, cabin-like, or soft social energy.
- `high-energy`: close to nightlife, live events, restaurants, districts, stadiums, music, or dense activity.
- `trail-access`: close to trails, parks, trailheads, ski access, bike paths, lakes, or outdoor routes.
- `foodie-proximity`: close to restaurants, food halls, cafes, markets, breweries, or strong dining districts.
- `event-access`: close to music venues, arenas, amphitheaters, theaters, stadiums, convention centers, or shuttle routes to events.
- `family-easy`: close to parks, attractions, low-friction logistics, schools, safe routes, or calmer activity clusters.
- `quiet-retreat`: away from dense nightlife or high-energy nodes, with stronger rest, scenic, or cabin-like positioning.
- `weekend-basecamp`: useful as a launch point for excursions, mountain routes, water, trails, or event weekends.
- `shuttle-access`: close to known shuttle pickup, transit, mobility, or operator handoff nodes.
- `social-ready`: easy to explain in a share card because the listing has a clear lifestyle hook.

## 6. Social Asset Schema

Bubbly social assets are dynamic share cards, not listing truth. They should make the property easy to share while linking back to canonical listing context.

The dynamic OG image generator should accept this JSON shape:

```json
{
  "asset_id": "og_property_denver_lodo_001_bubbly",
  "template": "bubbly_property_listing_v1",
  "canonical_url": "https://example.com/listings/property_denver_lodo_001",
  "background": {
    "kind": "property_photo | neighborhood_photo | generated_gradient | map_texture",
    "url": "https://example.com/image.jpg",
    "alt": "LoDo loft living room",
    "dominant_color": "#1f2937",
    "safe_crop": {
      "x": 0.5,
      "y": 0.45,
      "zoom": 1.1
    }
  },
  "vibe_overlay": {
    "primary_vibe": "foodie_proximity",
    "headline": "LoDo loft with dinner plans built in",
    "subheadline": "Steps from Union Station, cocktail bars, food halls, and downtown event energy.",
    "badges": ["Foodie", "Event Access", "Walkable"],
    "score": 86,
    "palette": {
      "accent": "#ff7ab6",
      "secondary": "#6ee7f9",
      "text": "#ffffff",
      "scrim": "rgba(0,0,0,0.48)"
    }
  },
  "attraction_proximity_map_snippet": {
    "center": { "lat": 39.7521, "lng": -105.0005 },
    "radius_miles": 1.5,
    "pins": [
      {
        "id": "union-station",
        "label": "Union Station",
        "kind": "mobility-hub",
        "lat": 39.7527,
        "lng": -105.0008,
        "distance_miles": 0.2
      }
    ],
    "caption": "Nearby food, transit, and event energy"
  },
  "attribution": {
    "listing_source": "MLS baseline",
    "earthos_source": "EarthOS attraction graph",
    "broadcaster_id": "bc_123",
    "share_id": "share_456"
  },
  "compliance": {
    "display_price": true,
    "display_address": "full | approximate | hidden",
    "mls_disclaimer": "MLS data supplied by source of record.",
    "last_verified_at": "2026-05-27T00:00:00.000Z"
  }
}
```

## 7. Referral Loop: Broadcaster Attribution

A Broadcaster is a user or partner who shares a listing and sends traffic back to the network.

Broadcaster attribution is not a real estate commission system by default. It is a traffic attribution model. Any reward, payout, referral fee, or commission must comply with applicable real estate, advertising, platform, and brokerage rules before activation.

Required attribution fields:

```json
{
  "broadcaster_id": "bc_123",
  "share_id": "share_456",
  "property_node_id": "property_denver_lodo_001",
  "channel": "instagram | facebook | tiktok | sms | email | direct | other",
  "source_url": "string | null",
  "landing_path": "/listings/property_denver_lodo_001",
  "utm_campaign": "bubbly_listing_denver_lodo_001",
  "first_seen_at": "ISO-8601 string",
  "last_seen_at": "ISO-8601 string",
  "traffic_count": 0,
  "qualified_action_count": 0,
  "conversion_count": 0,
  "reward_state": "not_eligible | pending_review | approved | rejected | paid",
  "compliance_hold": true
}
```

Qualified actions may include listing view, save, share, request-info click, agent contact click, open house RSVP, or handoff to compliant brokerage flow. A home sale is not attributed to a broadcaster unless a legally approved transaction attribution model exists.

## 8. Decision Routing Rules

EarthOS Broadcast may route a property listing to:

- a canonical listing page.
- a dynamic OG asset.
- an internal read-only admin mission page.
- a neighborhood guide.
- a nearby attraction guide.
- a compliant agent/broker contact path.
- a future public share card after governance approval.

EarthOS Broadcast must not route directly to payment, escrow, mortgage, or purchase execution. It must not present MLS data as EarthOS-owned data when the source is MLS. It must not overstate school, safety, appreciation, rental income, or investment claims.

## 9. Machine-Readable Assets

Property listings may reference these machine-readable assets after approval:

- canonical listing URL.
- JSON-LD `RealEstateListing`, `Residence`, `Place`, or governed schema variant.
- sitemap entry if public and indexable.
- `llms.txt` summary if the listing is intended for machine retrieval.
- `agent.json` instructions for compliant agent handoff.
- dynamic OG image payload.
- `decision_*` params for handoff continuity from neighborhood guides or social shares.

Machine-readable assets must identify the difference between MLS facts, EarthOS vibe metadata, user-generated broadcaster content, and fallback partner data.

## 10. Example Property Node

```json
{
  "id": "property_denver_lodo_001",
  "label": "LoDo Loft Near Union Station",
  "node_type": "property_listing",
  "lat": 39.7521,
  "lng": -105.0005,
  "region": "Colorado",
  "country": "US",
  "canonical_domain": "destinationcommandcenter.com",
  "canonical_paths": ["/admin/real-estate"],
  "related_operator": null,
  "related_satellite": null,
  "execution_owner": "listing_owner_or_agent",
  "decision_owner": "EarthOS Broadcast",
  "fallback_provider": "MLS baseline source",
  "status": "parked",
  "revenue_state": "no_proof",
  "telemetry_state": "read-only scaffold",
  "machine_understanding_state": "broadcast contract only",
  "do_not_touch": false,
  "next_action": "score vibe from nearby Denver attraction graph",
  "last_verified_at": "2026-05-27",
  "mls": {
    "mls_id": null,
    "listing_source": "manual_seed",
    "listing_status": "draft",
    "street_address": "Approximate LoDo sample",
    "city": "Denver",
    "state": "CO",
    "postal_code": "80202",
    "price": null,
    "beds": 2,
    "baths": 2,
    "square_feet": 1200,
    "property_type": "condo"
  },
  "vibe": {
    "primary_vibe": "foodie_proximity",
    "secondary_vibes": ["event_access", "high_energy"],
    "vibe_summary": "A walkable food and event base near Union Station and downtown Denver venues."
  }
}
```

## 11. Build Phases

Phase 0: contract only

Define `property_listing`, vibe metadata, social asset schema, and broadcaster attribution. No public UI.

Phase 1: read-only admin mission scaffold

Render potential property nodes in `/admin/real-estate` from source-only sample data and existing attraction graph inputs.

Phase 2: static broadcast config

Add governed static config for property nodes, vibe scoring inputs, and social asset payloads. No database migration.

Phase 3: internal Bubbly OG preview

Generate internal preview payloads for dynamic OG images. No public indexing.

Phase 4: broadcaster attribution proof

Measure social traffic and qualified actions without implying commission, sale credit, or revenue proof.

Phase 5: public listing approval

Publish only after compliance, source attribution, machine-readable assets, and governance review are complete.

## 12. Hard Boundaries

- Do not modify PARR checkout, payment, orders, Square routes, booking tokens, or success pages.
- Do not use property broadcasts as proof of revenue.
- Do not treat MLS facts as EarthOS-owned facts.
- Do not make school, safety, appreciation, rent, investment, or guaranteed buyer claims.
- Do not reward broadcasters for real estate conversion unless the reward model is legally approved.
- Do not build public-facing listing UI before governance approval.
- Do not create database migrations for this scaffold.
- Do not wire property listings into DCC telemetry as truth before a valid event lifecycle exists.

## 13. Current Parking Rule

EarthOS Broadcast remains a governed docs/source scaffold until PARR payment-flow risk is controlled and EarthOS map implementation is approved beyond contract/static-config phases.

