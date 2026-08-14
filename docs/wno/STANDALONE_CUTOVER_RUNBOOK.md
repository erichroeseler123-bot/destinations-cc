# WelcomeToNewOrleansTours Standalone Cutover Runbook

## Goal
Move WelcomeToNewOrleansTours.com out of the `destinations-cc` monolith into a dedicated repository without changing visitor-facing behavior, FareHarbor attribution, phone/text flows, or canonical URLs.

## Final topology

- GitHub: `erichroeseler123-bot/welcometoneworleanstours`
- Vercel project: existing `welcometoneworleanstours`
- Vercel Root Directory: repository root
- Production domains retained:
  - `welcometoneworleanstours.com`
  - `www.welcometoneworleanstours.com`

## Production protection rule
Do not repoint the existing Vercel production project until the standalone preview passes every parity gate below. The current production deployment remains authoritative until cutover.

## Required route families

### Storefront
- `/`
- `/tours`
- `/tours/[slug]`
- category routes including swamp, airboat, covered-boat, plantation, riverboat, ghost, food and city-tour families

### Decision engine
- `/help-me-choose`
- `/compare`
- `/compare/[slug]`
- `/guides/[slug]`

### Human help
- `/french-quarter-welcome-stop`
- `/guides/french-quarter-orientation`
- `/contact`

### Visitor-fit and area intent
- `/areas/[slug]`
- `/tours-for/[slug]`

### Support / trust
- `/about`
- `/faq`
- `/booking-help`
- `/cancellation-policy`
- `/affiliate-disclosure`
- `/privacy`
- `/terms`
- `/accessibility`

### Machine-readable / discovery
- sitemap
- robots
- `llms.txt`
- `agent.json`
- canonical structured-data owner

## Legacy redirects / aliases that must survive cutover

- `/guides/tour-catalog` -> `/tours`
- `/guides/restaurant-partners` -> `/guides/where-to-eat`
- `/guides/new-orleans-tours-tonight` -> `/guides/tonight`
- `/guides/new-orleans-tours-for-grandparents-and-kids` -> `/guides/new-orleans-tours-for-families`
- `/guides/french-quarter-tour-timing` -> `/guides/french-quarter-orientation`
- `/guides/tour-planning` -> `/help-me-choose`
- `/guides/pre-cruise-new-orleans-tours` -> `/guides/new-orleans-tours-with-transportation` until a dedicated cruise-passenger guide is published
- `/guides/post-cruise-new-orleans-tours` -> `/guides/new-orleans-tours-with-transportation` until a dedicated cruise-passenger guide is published

## Commercial invariants

- Keep the current 21 live storefront parent products as the factual commercial center.
- Preserve FareHarbor operator/item/flow/ASN attribution exactly unless separately audited and intentionally changed.
- Do not create fake bookability or generic `Book Now` behavior where no current product exists.
- Fulfillment priority remains:
  1. FareHarbor/direct approved inventory
  2. approved direct operator
  3. Viator/GetYourGuide affiliate gap-fill
  4. editorial-only when no product exists
- Preserve phone/text CTA behavior and the New Orleans Concierge Desk flows.
- Preserve the $5 French Quarter Orientation behavior and disclosure.

## Architecture target

Standalone WNO should have one authoritative implementation for each of these concepts:

1. Product registry / normalized product facts
2. Category registry
3. Public route manifest
4. Recommendation engine
5. Structured-data/schema owner
6. Analytics event vocabulary
7. Human-help service registry
8. Demand-taxonomy-to-fulfillment mapping

The storefront, Help Me Choose, comparisons, intent guides, schema and AI/search discovery should consume the same normalized product facts instead of maintaining competing copies.

## Extraction rule

### KEEP
- WNO storefront and FareHarbor inventory
- recommendation flows
- product detail pages
- category pages
- comparisons
- governed guides
- area / traveler-fit pages
- orientation / concierge / contact
- support and legal pages
- structured data
- analytics
- WNO sitemap/robots/AI endpoints
- WNO tests and fixtures
- required WNO assets

### KEEP, CONSOLIDATE
- duplicate product facts
- duplicate category definitions
- duplicate guide route lists
- redirects / aliases
- metadata definitions

### PARK
- MyTrip / saved-plan work until after standalone parity
- legacy chooser implementations not used by current public routes

### LEAVE IN DCC
- DCC-only destination intelligence routes
- unrelated destination apps
- GoSno, Cruise Promenade, Vibe, Alaska, Dells and other portfolio code

## Preview parity gates

Do not cut over until all are green:

1. `next build` succeeds from repo root.
2. Homepage visual smoke test passes on mobile and desktop.
3. `/tours` returns the same live catalog count and product identities.
4. Representative FareHarbor booking links match production attribution.
5. Representative category pages return 200.
6. Representative tour-detail pages return 200.
7. Help Me Choose works end to end.
8. Comparison hub and representative detail pages return 200.
9. Governed guide routes return expected 200/redirect behavior.
10. All legacy redirects in this document resolve correctly.
11. Orientation and Concierge Desk phone/text flows remain intact.
12. Support/legal routes return 200.
13. Canonicals point only to `www.welcometoneworleanstours.com` or the intentionally selected canonical hostname.
14. Sitemap contains only intended public WNO URLs.
15. Robots rules are correct.
16. Structured data contains WNO entities only; remove stray DCC WebPage/schema ownership.
17. No imports resolve outside the standalone repository.
18. No DCC-only routes are exposed.
19. Production runtime error smoke test is clean on preview.
20. Existing production remains untouched until all above pass.

## Cutover sequence

1. Create empty GitHub repo `erichroeseler123-bot/welcometoneworleanstours`.
2. Populate it with the audited standalone tree.
3. Connect a non-production Vercel preview to the new repo root.
4. Run route, booking, schema, SEO and mobile/desktop parity tests.
5. Freeze WNO changes in the monolith during final parity comparison.
6. Repoint the existing Vercel `welcometoneworleanstours` project Git connection to the standalone repo.
7. Set Root Directory to repository root.
8. Confirm production environment variables required by WNO only.
9. Deploy production.
10. Verify apex + www, routes, FareHarbor checkout, phone/text, sitemap, robots, schema and runtime logs.
11. Only after successful production verification, retire WNO deployment responsibility from `destinations-cc`.

## Rollback

If any cutover verification fails, reconnect/redeploy the last known-good monolith-backed WNO production deployment. Do not change domains, inventory attribution, or booking links as part of rollback.
