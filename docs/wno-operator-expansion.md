# New Orleans operator expansion

Six operator profiles and ten verified Viator product links added, checked September 30, 2026. Existing Airboat Adventures, NOLA Ghost Riders and FareHarbor storefront booking paths remain intact.

FareHarbor is preferred whenever a confirmed product URL with approved WNO attribution is configured. No verified attributed FareHarbor connection is configured for these six additions, so they use Viator fallback with the existing public WNO affiliate parameters (pid P00306962, mcid 42383). Prices, times and availability are confirmed on the partner product page. WNO does not claim a shared cart, a direct operator contract or live on-site inventory for these links.

## Research sources

- Cajun Encounters: https://www.cajunencounters.com/
- Cajun Pride Swamp Tours: https://www.cajunprideswamptours.com/tours/swamp-tours
- Haunted History Tours: https://hauntedhistorytours.com/our-tours/
- City Sightseeing New Orleans: https://citysightseeingneworleans.com/tours/hop-on-hop-off/
- Doctor Gumbo Tours: https://doctorgumbo.com/tours/
- New Orleans Kayak Swamp Tours: https://neworleanskayakswamptours.com/tours/

## Search demand and next commercial step

Monthly branded Google search volumes have not been verified. This first batch prioritizes distinct visitor needs and identifiable brands with active official tour/booking sites; it is not a search-volume ranking. Gray Line and New Orleans Steamboat Company are already present in the inventory.

Use Keyword Planner or another authorized search-volume source to compare the exact operator names and spelling variants before prioritizing the next batch. Verify supplier identity, attribution and product URLs before adding another experience. Research candidates for the next batch include New Orleans School of Cooking, Two Chicks Walking Tours, and Royal Carriages.

## Verified Viator products

- https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour/d675-6953SWAMP
- https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour-With-Transport/d675-6953SWAMPTRANS
- https://www.viator.com/tours/New-Orleans/Drive-Out-Swamp-Tour/d675-141126P1
- https://www.viator.com/tours/New-Orleans/Swamp-Tour-with-Transportation/d675-141126P2
- https://www.viator.com/tours/New-Orleans/New-Orleans-Haunted-History-Ghost-Tour/d675-3252_1
- https://www.viator.com/tours/New-Orleans/New-Orleans-Vampire-Tour/d675-3252_5
- https://www.viator.com/tours/New-Orleans/City-Sightseeing-New-Orleans-Hop-On-Hop-Off-Tour/d675-5694NOHOHO
- https://www.viator.com/tours/New-Orleans/New-Orleans-Food-and-History-Tour/d675-6484NOLAFOOD
- https://www.viator.com/tours/New-Orleans/Combo-Cocktail-and-Food-History-Tour/d675-6484P3
- https://www.viator.com/tours/New-Orleans/Manchac-Mystic-Wildlife-Kayak-Tour/d675-22050P2

## Validation

- WNO test suite: 156 passed, zero failures.
- Full WNO satellite TypeScript check passed after installing declared dependencies.
- Hosted WNO preview build passed for commit b19b45ef.
- Rendered HTTP checks passed for /operators and all six profiles: HTTP 200, canonical metadata, ItemList schema, and attributed booking links. The sitemap includes all new profiles and the existing Airboat Adventures and NOLA Ghost Riders pages.
- Diff whitespace validation passed.
- Automated visual browser checks could not run because this workspace could not download a usable browser. Responsive layouts use the site's existing mobile grid breakpoints; no screenshot-based verification is claimed.
- The broad DCC system check reported missing DCC payment/telemetry/email configuration and unrelated portfolio endpoint failures. That check targets DCC deployment, rather than this standalone WNO content release.
