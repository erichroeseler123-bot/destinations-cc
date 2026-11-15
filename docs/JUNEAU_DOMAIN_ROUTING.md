# Juneau Domain Role Separation & Redirect Policy

## Specialist Site Roles in Juneau

To prevent SEO cannibalization and traveler confusion across our Alaska properties, Juneau traffic is split intentionally by **activity vertical and recovery state**:

1. **Destination Command Center (`destinationcommandcenter.com/juneau/...`)**
   - **Role:** Port-day timing authority, CLAA berth/all-aboard evaluator (`2-hour / 120-minute` canonical gangway return buffer), and live Juneau Tours Rezgo inventory check (`/juneau/whale-watching-tours`).
2. **Last Frontier Shore Excursions (`lastfrontiershoreexcursions.com/juneau/...`)**
   - **Role:** Canonical commercial storefront for standard Juneau surface shore excursions, including **Auke Bay whale watching** (`/juneau/whale-watching`), Mendenhall Glacier combos, and port-wide excursion comparison.
3. **Juneau Flight Deck (`juneauflightdeck.com`)**
   - **Role:** Dedicated **Part 135 helicopter glacier landing, dog-sledding, and floatplane flightseeing** specialist (`/`, `/juneau-dogsled-helicopter-tours`, `/helicopter-waitlist`, `/dispatch`).
   - **Exception — Same-Day Flight Cancellation Backup Flow ("Whale Deck"):** When low ceiling or visibility in Juneau (`PAJN` METAR) grounds a traveler's helicopter or floatplane flight, Juneau Flight Deck serves an emergency same-day marine backup flow at `/juneau-whale-watching-tours?flight_canceled=1` (or with an operator-issued `?cancel_ref=...` parameter).

---

## Why `juneauflightdeck.com/juneau-whale-watching-tours` Redirects Without `?flight_canceled=1`

In `apps/juneauflightdeck/next.config.mjs` (lines 28–39) and enforced by `tests/governance/north-star-route-and-wta-guardrails.test.ts` (`documentedLegacyRedirectExceptions`), two conditional `308 Permanent Redirect` rules are configured:

- `/whale-deck` (when query parameter `flight_canceled` is **missing**) $\rightarrow$ `https://www.lastfrontiershoreexcursions.com/juneau/whale-watching`
- `/juneau-whale-watching-tours` (when query parameter `flight_canceled` is **missing**) $\rightarrow$ `https://www.lastfrontiershoreexcursions.com/juneau/whale-watching`

### Rationale
- **Consolidates organic whale-watching authority on Last Frontier:** Standard whale-watching shoppers and search crawlers land on `lastfrontiershoreexcursions.com/juneau/whale-watching` rather than splitting ranking signals with an aviation domain.
- **Preserves same-day aviation recovery on Juneau Flight Deck:** Travelers whose flight was canceled (`?flight_canceled=1`) stay on `juneauflightdeck.com/juneau-whale-watching-tours?flight_canceled=1` where aviation weather context (`PAJN` METAR) and backup surface departures are presented together.

---

## Linking Rules Across DCC, Cruise Promenade, and Storefronts

1. **Standard Whale-Watching Storefront CTAs:** Always link directly to `https://www.lastfrontiershoreexcursions.com/juneau/whale-watching` (never to bare `juneauflightdeck.com/juneau-whale-watching-tours` without `?flight_canceled=1`, which would cause an unnecessary `308` redirect).
2. **Same-Day Flight-Canceled Recovery CTAs:** Always include `flight_canceled=1` (e.g., `https://juneauflightdeck.com/juneau-whale-watching-tours?flight_canceled=1&src=...`) and label the CTA clearly as the flight-canceled backup deck.
3. **Helicopter & Aviation CTAs:** Link directly to `https://juneauflightdeck.com/` or `https://juneauflightdeck.com/juneau-dogsled-helicopter-tours`.
