# DCC Live Domain Routing

This document records the live production domain-to-project topology across the Destination Command Center (`erichroeseler123-bot/destinations-cc`) monorepo, connected specialist apps, external operator repos, and contained/retired surfaces.

## 1. Root Authority & Machine Layer (`destinations-cc`)

- **Canonical Domain**: `https://www.destinationcommandcenter.com` (apex `destinationcommandcenter.com` 308 -> `www`)
- **Repository Root**: `/` (`erichroeseler123-bot/destinations-cc`, tracking `main`)
- **Role**: Coordinate-first travel reference (`39.6654,-105.2057`), Machine Layer v0.3 (`/.well-known/dcc`, `/agent.json`, `/llms.txt`, `/openapi.json`, `/.well-known/mcp.json`, `/api/v1/mcp`), dynamic `629`-port cruise shore excursion catalog, and Unified Operator Inbox (`/admin/inbox` + `POST /api/internal/specialist-inquiries`).
- **Merchant Boundary**: DCC performs suitability evaluation, inquiry routing, and disclosed handoffs only (`0` external OCTO operators `live_authorized`; no autonomous booking or delegated payment capture).

## 2. Monorepo-Linked Specialist Surfaces (`apps/*`)

Monorepo build skipping is governed by `scripts/vercel-ignore-monorepo.mjs` (rebuilding whenever an app's directory or `lib/dcc/shared/**` changes), and cross-app edge token redemption / PII URL scrubbing / inquiry forwarding use zero-Neon helpers in `lib/dcc/shared/`:

| Vercel Project / App | Monorepo Directory | Live Production Domain | Specialist Inquiry / Outbound Contract |
| --- | --- | --- | --- |
| `last-frontier-shore-excursions` | `apps/last-frontier-shore-excursions` | `https://www.lastfrontiershoreexcursions.com` | `/contact` -> `POST /api/inquiries` (`lastfrontiershoreexcursions-inquiry`); disclosed Viator (`NEXT_PUBLIC_VIATOR_PID`) & FareHarbor (`asn=welcometoalaskatours`) exits |
| `saveonthestrip` | `apps/saveonthestrip` | `https://saveonthestrip.com` | `POST /api/help-request` (`saveonthestrip-help-request`); Alaska partner handoff `308` -> `https://www.lastfrontiershoreexcursions.com` |
| `welcometothedells` | `apps/welcometothedells` | `https://welcometothedells.com` | `/contact` -> `POST /api/inquiries` (`welcometothedells-inquiry`); `/out/wisconsin-dells/[slug]` `302` operator exits |
| `welcometoneworleanstours` | `apps/welcometoneworleanstours` | `https://www.welcometoneworleanstours.com` | `welcometoneworleanstours-inquiry`; legacy `/things-to-do-*` `308` redirects preserved in `proxy.ts` |
| `juneauflightdeck` | `apps/juneauflightdeck` | `https://juneauflightdeck.com` | `POST /api/waitlist` -> `juneauflightdeck-inquiry` |
| `french-quarter-orientation` | `apps/frenchquarterorientation` | `https://frenchquarterorientation.com` | 30-minute first-hour French Quarter arrival orientation (`/.well-known/dcc-site`, `/about`) |
| `welcometotheswamp` | `apps/welcometotheswamp` | `https://welcometotheswamp.com` | `welcometotheswamp-inquiry` + `wts_waitlist_submissions` bridge |
| `420-airport-pickup` | `apps/420-airport-pickup` | `https://420friendlyairportpickup.com` | Private airport transfer discovery & operator handoff |

## 3. Connected External Operator & Planning Surfaces

- `https://gosno.co` (`gosno-dispatch` -> DCC Unified Operator Inbox; Colorado private airport-to-mountain transfers; `bigsky.gosno.co` prelaunch)
- `https://www.partyatredrocks.com` (`parr-inquiry` -> DCC Unified Operator Inbox; private Red Rocks concert transportation only, `shared_seat_service: false`)
- `https://cruisepromenade.com` (private shared cruise-group planning)
- `https://vibearoundtown.com` (local private driver request-and-acceptance marketplace)
- `https://feastlyspread.com` (2 existing booking path markets: Wisconsin Dells & Door County; 16 coverage-request markets)
- `https://brinkberry.com` (regional event & group-stay feeder)

## 4. Contained & Retired Surfaces

- **`wta-ui` (`welcometoalaskatours.com`)**: Contained legacy storefront excluded from `DCC_PORTFOLIO_NETWORK_SITES` (`404` on `/.well-known/dcc-site?site=welcometoalaskatours.com`). Zero active outbound links or fallback redirects from DCC or specialist apps target `welcometoalaskatours.com`; all Alaska cruise-port excursion handoffs route to `https://www.lastfrontiershoreexcursions.com` and `https://juneauflightdeck.com`.
- **`shuttleya.com` / Mighty Argo Shuttle**: `shuttleya.com` operates strictly as a non-carrier transportation discovery surface (`takes_direct_payment: false`), and the Denver-to-Mighty-Argo scheduled shuttle is `retired_not_operating` (`argo-day-transport` deprecated; zero active checkout endpoints).
