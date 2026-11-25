# Hosted cruise blocked-source review — November 25, 2026

Review recorded at `2026-11-25T16:02:13Z` (9:02 AM America/Denver).
Method: assistant inspection of visible official pages in the connected browser,
including event detail tables and the public booking interface. No booking,
organizer message, or signed-in customer account access was performed.

The November 23 failed automated probes remain in the ledger. Browser access does
not prove that those automated fetches now succeed. This review resolves the five
content checks against the reviewed catalog fingerprint and source-check date.
Normal 7-day / 14-day freshness limits remain in force.

| Record | Confirmed departure | Evidence and availability at review time |
| --- | --- | --- |
| Pied Piper Alaska | Brilliant Lady, Aug 24–Sep 2, 2027, Seattle round trip | [Event and port-clock table](https://www.piedpipertravel.com/gaygroupcruises/cruise-info.php?id=820), [pricing](https://www.piedpipertravel.com/gaygroupcruises/cruise-pricing.php?id=820). Some categories show fares and a reservation link; some are sold out. |
| GaySail Thailand | Mar 20–27, 2027, 52-foot Lagoon catamaran | [Official event 44](https://gaysail.com/program/gaynudesail-exclusive/44-gaysail-exclusive-thailand-2027). EUR 1,595–2,295; 7 spots displayed. Clothing-optional departure. |
| GayNudeSail Thailand | Mar 27–Apr 3, 2027, 52-foot Lagoon catamaran, Patong to Phuket Yacht Haven | [Official event 45](https://gaysail.com/program/gaynudesail-exclusive/45-gaynudesail-exclusive-thailand-2027). EUR 1,595–2,295; 8 spots displayed. Nude departure. |
| GaySail Split–Hvar–Dubrovnik | Jun 19–26, 2027, 42-foot Lagoon catamaran(s), Trogir/Split to Dubrovnik | [Official event 51](https://gaysail.com/program/gaysail-exclusive/51-gaysail-exclusive-split-hvar-dubrovnik-2027). EUR 1,695–2,395; 7 spots displayed. |
| 70000TONS OF METAL | Freedom of the Seas, Jan 14–18, 2027, Miami–Puerto Plata–Miami | [Exact event booking](https://book.70000tons.com/en/events/70000tons-of-metal-2027), [five-day voyage](https://70000tons.com/voyage/?lang=en), [ship facts](https://70000tons.com/ship-facts/?lang=en). Private Cabin / Single Ticket booking choices offered. |

## Source discrepancies and corrections

- 70000TONS' November 14 news post on [its homepage](https://70000tons.com/home/)
  says January 14–19. The exact 2027 booking event says January 14–18; the five-day
  itinerary, header banner and November 4 post agree with January 14–18. Keep the
  existing January 18 return, and retain the conflicting news text in the review
  note. No date change or schedule hold is inferred from that single conflicting
  post.
- GaySail's search metadata contains old 2026 dates. The live H1 headings and
  departure/return tables consistently identify the three 2027 editions above.
- GaySail prices are published in EUR. Remove the catalog's unsupported USD
  conversions from these three records. No exchange-rate approximation is stored
  as `verifiedStartingPriceUsd`.
- The metal-cruise booking interface is publicly readable before sign-in. Remove
  the old account-gated/historical-base-fare description; retain the visible
  $100 single-ticket supplement and refer current cabin prices to the operator.
- Displayed GaySail spot counts are observations at review time. They are not
  exposed as live inventory. The source's differing capacity/body descriptions
  do not establish an exact passenger capacity or named individual yacht.

## Scope and safeguards

- Five sailing source-check dates refreshed; no other source-check dates reset.
- No new sailings, removed sailings, new organizers or changed sailing identity.
- DCC snapshot version advances to `v10.1-browser-source-review` so a consumer can
  identify the review separately from the original v10 expansion.
- CP's deployed snapshot and frozen 2027 report are not edited by this DCC change.
- A review clears a blocked-probe item only if its fingerprint matches the current
  sailing, its timestamp follows the failed probe, the catalog contains that
  check, and the review is not in the future. A changed fact or later blocked
  probe requires another review. Ordinary freshness expiry still produces an
  overdue alert.
- Regression coverage checks historical pending state, all five resolutions,
  queue auto-clear, changed facts, later blocked probes, and both freshness limits.
