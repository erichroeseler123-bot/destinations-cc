# New Orleans Venue Map

Purpose: document the canonical mapping between live-provider venue identities and DCC graph venue IDs for the New Orleans events adapter.

## Rules

- `graph_venue_id` must use the canonical DCC namespace: `new-orleans/{venue-slug}`.
- `ticketmaster_venue_id` is provider identity and must never replace the DCC graph ID.
- Add provider identity to venue metadata as `sameAs` / source identity after a real live pull confirms it.
- Do not guess Ticketmaster venue IDs.
- Unknown venues remain deterministic fallback IDs until reviewed and mapped.
- Events stay live; venues are stable graph entities.

## Mapping table

| ticketmaster_venue_id | ticketmaster_venue_name | graph_venue_id | lat | lng | sameAs | status | notes |
|---|---|---|---:|---:|---|---|---|
| _populate from live pull_ | _populate from live pull_ | _review before promotion_ |  |  |  | pending | No guessed IDs |

## Promotion workflow

1. Pull real events through `/v1/destinations/new-orleans/events`.
2. Capture Ticketmaster venue ID, name, coordinates, and source URL.
3. Resolve the venue to an existing DCC entity when one exists.
4. Otherwise assign a canonical `new-orleans/{venue-slug}` graph ID after review.
5. Store provider identity as source metadata / `sameAs`.
6. Keep deterministic fallback IDs only until the canonical mapping is approved.

## Coverage checks

Track:

- total events returned
- unique Ticketmaster venue IDs
- percent resolved to canonical graph venues
- percent still on fallback IDs
- radius-filtered event count
- duplicate event count

The goal is to improve mapping coverage from real provider data without making provider IDs the canonical identity layer.
