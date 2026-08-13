# WelcomeToNewOrleansTours standalone extraction

Status: IN PROGRESS on `extract/wno-standalone`.

## Production safety

- Production remains on `main` and the existing Vercel project/domain.
- No production domains or Vercel Git settings are changed by this branch.
- The source snapshot is commit `42da037c8ea8cc298693d5c95ebbe184f4db818d` (`Fix WNO www canonical routing`).

## Canonical source to extract

Primary WNO application:
- `app/new-orleans/**`

WNO machine-readable routes already staged historically under this app directory:
- `apps/welcometoneworleanstours/app/agent.json/**`
- `apps/welcometoneworleanstours/app/llms.txt/**`

Shared dependencies must be copied only when they are reachable from the WNO production graph. The broad dependency roots to audit are:
- `components/**`
- `lib/**`
- `data/**`
- `config/**`
- `src/**`
- `public/**`

## Classification rules

Each copied file must be classified as one of:
- KEEP — production WNO
- KEEP-CONSOLIDATE — overlapping WNO implementation that must end with one owner
- PARK — preserved but excluded from production/import graph
- LEAVE-DCC — New Orleans code that belongs to Destination Command Center
- DROP — dead/duplicate code with no intended consumer

## Known KEEP systems

- storefront homepage and `/tours`
- live FareHarbor product/variant inventory
- marketplace category routes
- active recommendation/chooser flow
- tour detail pages
- comparison pages
- public guides and intent SEO routes
- French Quarter orientation/welcome-stop surfaces
- phone/FareHarbor conversion tracking
- canonical WNO structured-data helpers
- sitemap/robots/AI-readable endpoints
- legal/support pages
- WNO tests and inventory governance docs

## Known PARK / legacy systems

- `components/MyTrip/**` until intentionally revived
- legacy chooser implementations with no production consumer

## Known LEAVE-DCC warning

Not every route under `app/new-orleans/**` belongs to WNO. DCC-only New Orleans guide/stub routes must not be pulled into the commercial WNO public route graph merely because they share the folder name.

## Cutover gate

Do not reconnect Vercel until the standalone project passes:
1. production route parity
2. FareHarbor URL/variant integrity
3. homepage/tour/category routing
4. canonical + sitemap + robots validation
5. structured-data validation
6. analytics/phone conversion checks
7. mobile 390px and desktop smoke checks
8. no DCC-only public routes
9. no unresolved imports outside the standalone project

## Final ownership target

`erichroeseler123-bot/welcometoneworleanstours` -> Vercel project `welcometoneworleanstours` -> `welcometoneworleanstours.com` and `www.welcometoneworleanstours.com`.
