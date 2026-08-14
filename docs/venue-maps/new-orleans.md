# New Orleans Venue Map

Purpose: document the canonical mapping between live-provider venue identities and DCC graph venue IDs for the New Orleans events adapter.

## Rules

- `graph_venue_id` must use the canonical DCC namespace: `new-orleans/{venue-slug}`.
- `ticketmaster_venue_id` is provider identity and must never replace the DCC graph ID.
- Add provider identity to venue metadata as `sameAs` / source identity after a real live pull confirms it.
- Do not guess Ticketmaster venue IDs.
- Unknown venues remain deterministic fallback IDs until reviewed and mapped.
- Events stay live; venues are stable graph entities.

## First live pull

Captured from the Vercel preview environment on 2026-08-14 using a 48-hour New Orleans Ticketmaster Discovery query. The pull returned 17 events across 9 unique Ticketmaster venue IDs. No provider key value is stored here.

| ticketmaster_venue_id | ticketmaster_venue_name | graph_venue_id | lat | lng | sameAs | status | observed events |
|---|---|---|---:|---:|---|---|---:|
| `rZ7HnEZ174zuz` | Snug Harbor Jazz Bistro | `new-orleans/snug-harbor-jazz-bistro` | 29.964167 | -90.057912 | `ticketmaster:rZ7HnEZ174zuz` | approved | 6 |
| `ZFr9jZa7va` | Le Petit Theatre | `new-orleans/le-petit-theatre` | 29.968 | -90.065002 | `ticketmaster:ZFr9jZa7va` | approved | 3 |
| `rZ7HnEZ17aKef` | Gasa Gasa | `new-orleans/gasa-gasa` | 29.937978 | -90.107145 | `ticketmaster:rZ7HnEZ17aKef` | approved | 2 |
| `rZ7HnEZ17j_8N` | NO DICE | `new-orleans/no-dice` | 29.9685473 | -90.0556928 | `ticketmaster:rZ7HnEZ17j_8N` | approved | 1 |
| `rZ7HnEZadkE` | Tipitina's | `new-orleans/tipitinas` | 29.9172719 | -90.1007669 | `ticketmaster:rZ7HnEZadkE` | approved | 1 |
| `rZ7HnEZ17qkPV` | Chickie Wah Wah | `new-orleans/chickie-wah-wah` | 29.9667574 | -90.0896109 | `ticketmaster:rZ7HnEZ17qkPV` | approved | 1 |
| `rZ7HnEZ17a_FA` | The Den at Howlin' Wolf | `new-orleans/howlin-wolf-den` | 29.946457 | -90.065947 | `ticketmaster:rZ7HnEZ17a_FA` | approved | 1 |
| `KovZpZA6tdnA` | Caesars Superdome | `new-orleans/caesars-superdome` | 29.950971 | -90.081091 | `ticketmaster:KovZpZA6tdnA` | approved | 1 |
| `KovZpZAE6vtA` | House of Blues New Orleans | `new-orleans/house-of-blues-new-orleans` | 29.9531499 | -90.0661687 | `ticketmaster:KovZpZAE6vtA` | approved | 1 |

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
