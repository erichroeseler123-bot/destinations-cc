# Juneau Venue Map

Purpose: define the normalization contract for future Juneau live-event providers while keeping venue identity stable and provider data live.

## Rules

- `graph_venue_id` must use the canonical DCC namespace: `juneau/{venue-slug}`.
- Provider venue IDs are source identities, not canonical DCC IDs.
- Add `sameAs` / provider metadata only after a real response confirms the mapping.
- Do not guess Ticketmaster, city-calendar, or venue-feed IDs.
- Unknown venues keep deterministic destination-scoped fallback IDs until reviewed.
- Venue entities are stable; Event entities remain live/runtime data.

## Mapping table

| provider | provider_venue_id | provider_venue_name | graph_venue_id | lat | lng | sameAs | status | notes |
|---|---|---|---|---:|---:|---|---|---|
| _live source_ | _populate from live pull_ | _populate from live pull_ | _review before promotion_ |  |  |  | pending | No guessed IDs |

## Promotion workflow

1. Pull real Juneau events from the configured provider.
2. Capture provider venue ID, name, coordinates, and source URL.
3. Resolve to an existing DCC entity where one already exists.
4. Otherwise assign a canonical `juneau/{venue-slug}` graph ID after review.
5. Preserve provider identity as metadata for dedupe and future source joins.

Juneau provider coverage should be established from real source availability rather than assumed from another destination.
