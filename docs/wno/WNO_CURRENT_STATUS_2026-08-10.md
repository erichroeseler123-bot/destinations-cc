# WelcomeToNewOrleansTours.com — Current Flagship Status

**Updated:** 2026-08-10  
**Authority:** This file records status changes made after `WNO_FULL_SITE_INVENTORY_2026-08-10.md`. When a classification here differs from that baseline audit, this current-status ledger controls.

## Commercial category truth

### ACTIVE-PUBLIC / indexable
- `/city-tours`
- `/swamp-tours`
- `/airboat-tours`
- `/covered-swamp-boat-tours`
- `/plantation-tours`
- `/riverboat-cruises`
- `/ghost-tours`
- `/food-tours`

`/riverboat-cruises`, `/ghost-tours`, and `/food-tours` are now real commercial hubs with live storefront inventory, homepage/footer discovery, breadcrumb coverage, and sitemap inclusion.

### DRAFT / blocked from promotion
- `/combo-tours`

Combo content is prepared but remains draft/noindex and is not in the WNO sitemap because the host router does not yet expose `/combo-tours`. The working public Full-Day Combos surface remains `/tours#combo-tours`.

## Route truth

Homepage Today/Tonight navigation uses canonical `/guides/...` routes rather than blocked top-level implementation aliases.

Evergreen public city-planning surfaces explicitly included in WNO sitemap discovery include:
- `/guides/whats-happening`
- `/guides/tonight`
- `/guides/this-weekend`
- `/guides/where-to-eat`
- `/guides/restaurant-partners`

## Conversion truth

### ACTIVE — `PhoneCta`
Managed WNO phone actions use the canonical phone conversion event and preserve placement/product context. Raw `tel:` links are captured by the generalized funnel tracker without double-counting managed PhoneCta links.

### ACTIVE — mobile tour-detail conversion layer
`StickyMobileBookingBar.tsx` is no longer parked/unused.

It is mounted through `WnoMobileConversionMount.tsx` and activates only on approved public `/tours/<slug>` detail routes.

Current mobile behavior:
- direct-book tour: `Call us` + tracked FareHarbor `Check availability`
- multi-variant tour: `Call us` + `View booking options`
- multi-variant action scrolls to the existing top-of-page variant choices
- removed the former dead `#booking-variants` anchor
- category, guide, homepage, and unrelated WNO routes do not receive the sticky booking bar

Phone placement for the mobile tour bar: `WTONOT-MOBILE-TOUR-CALL`.

## Schema truth

### ACTIVE canonical WNO schema owner
`app/new-orleans/lib/structuredData.ts` is the canonical WNO structured-data helper for:
- Organization
- WebSite
- WebPage
- BreadcrumbList
- FAQPage
- Service/TouristTrip product graphs
- CollectionPage/category graphs

`app/new-orleans/lib/schema.ts` is compatibility-only and re-exports canonical builders rather than owning a competing schema implementation.

### Operator identity
Category and product schema resolve the storefront product's real `operatorName` by slug. Do not emit `provider.name = "Unknown"` when a storefront operator is known.

Verified examples:
- Evening/Daytime/Brunch/CITY riverboat products → New Orleans Steamboat Company
- Ghosts & Spirits → Gray Line

### Tour-detail host identity
The shared tour-detail implementation must keep host identities separate:
- WNO host → WNO WebPage ID, WNO WebSite/Organization IDs, WNO breadcrumb URLs
- DCC host → DCC WebPage/breadcrumb identities

WNO tour metadata uses an absolute branded title so the WNO layout title template does not append `Welcome to New Orleans Tours` twice.

## Recommendation / chooser truth

ACTIVE production recommendation surfaces:
- `ExpandedChooserEntry`
- `NewOrleansRecommendationFlow`
- `HelpMeChooseDrawer`

UNUSED / legacy unless intentionally revived:
- `NewOrleansChooser`
- `TourMatchChooser`

Tests should protect active chooser/recommendation surfaces, not old components.

## Parked systems

`components/MyTrip/` remains PARKED/UNFINISHED. It is not an active customer planner and must not be advertised as such.

## Commercial inventory baseline

- 21 live storefront parent products
- 6 explicitly draft products
- draft inventory must not be presented as bookable until its status, operator relationship, and checkout path are confirmed

## Operating rule

The flagship rule remains: **nothing unknown**.

Before creating a WNO route, category, schema helper, analytics event, chooser, conversion bar, product registry, or SEO template, check:
1. baseline inventory audit,
2. this current-status ledger,
3. host router,
4. data registries,
5. live production consumer,
6. tests,
7. sitemap/indexability implications.
