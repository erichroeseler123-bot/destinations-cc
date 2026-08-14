# St. Thomas Venue Map

Purpose: define the normalization contract for future live-event providers serving St. Thomas without inventing provider coverage or static driver relationships.

## Rules

- `graph_venue_id` must use the canonical DCC namespace: `st-thomas/{venue-slug}`.
- Provider venue IDs remain source identities only.
- Add `sameAs` / source metadata only after a real provider response confirms the venue identity.
- Do not guess Ticketmaster or local-provider venue IDs.
- Unknown venues keep deterministic destination-scoped fallback IDs until reviewed.
- Venue entities are stable; events and driver availability remain runtime data.

## Mapping table

| provider | provider_venue_id | provider_venue_name | graph_venue_id | lat | lng | sameAs | status | notes |
|---|---|---|---|---:|---:|---|---|---|
| _live source_ | _populate from live pull_ | _populate from live pull_ | _review before promotion_ |  |  |  | pending | No guessed IDs |

## Promotion workflow

1. Pull real provider events for St. Thomas.
2. Capture provider venue ID, name, coordinates, and source URL.
3. Resolve to an existing DCC place/venue entity where possible.
4. Otherwise create a canonical `st-thomas/{venue-slug}` ID after review.
5. Retain provider identity as metadata for dedupe and future joins.

Do not use this venue registry to encode Vibe driver availability. Driver availability remains a runtime Vibe query.
