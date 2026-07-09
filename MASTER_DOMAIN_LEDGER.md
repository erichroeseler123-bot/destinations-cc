# Master Domain Ledger

This file is the permanent source of truth for domain ownership, system layers, and operational boundaries across the DCC ecosystem.

Do not infer ownership from folder names, old app remnants, satellite code, or Vercel metadata alone. A domain is owned by the layer, Vercel project, and repository recorded here until this ledger is intentionally updated.

## System Layers

### 1. EarthOS

EarthOS is the map, time, and entity database. It owns the underlying place, entity, time, and relationship intelligence that other surfaces may consume.

EarthOS is not the public decision surface, not a satellite market renderer, and not a direct-service checkout business.

### 2. DCC (`destinationcommandcenter.com`)

DCC is the central decision brain, network registry, and authority surface.

DCC owns the command layer for routing decisions, network governance, authority pages, and system-level intelligence. It may contain bridge code, registry logic, proxy behavior, or support code for satellite and direct-service surfaces, but that does not automatically make DCC the live app owner for those brands.

### 3. TravelMarket (`dcc-v1-cut-clean`)

TravelMarket is the shared renderer for satellite SEO markets, including examples such as Juneau Flight Deck and Welcome to the Swamp.

TravelMarket markets are satellite SEO surfaces. They may be brand-facing and public, but they are not automatically independent operating businesses. Their domain ownership must be verified against this ledger and Vercel project mappings.

### 4. Direct-Service Businesses

Direct-Service Businesses are independent operational businesses with owned execution.

These brands are responsible for their own customer-facing execution paths, operational workflows, checkout/payment handling, service promises, and revenue risk. They must not be treated as generic TravelMarket skins unless this ledger explicitly says so.

## Operational Rules & Brand Restrictions

* Shuttleya: This brand must ONLY be used for the Mighty Argo Cable Car shuttle from Denver. It is a direct-service business, not a generic TravelMarket skin.
* Payment Operations: RedRocksFastPass, 420-Airport-Pickup, and related operational lanes use Square-based checkout (Square hosted payment links), NOT Stripe or Rezdy.
* Feastly Spread: This is group coordination infrastructure disguised as food. It provides operational relief and "Handled Abundance." Do not use any "high-end chef" or catering positioning.

## Domain Ledger

### Project-Level Quarantine Warning

> [!CAUTION]
> **v0-code-review** is a quarantine project used only for testing and staging. 
> No public custom domain is allowed to point to it under any circumstances unless explicitly documented in the ledger.

### Verified Domain Rows

| Domain | Canonical Host | Owner Layer | Intended Role | Current Vercel Project | Current Project ID | Current Deployment ID | Source Repo | Local Checkout Path | Live Verification Status | Verification Source | Robots Status | Sitemap Status | Booking/Handoff Status | Risk Notes | Last Verified Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **destinationcommandcenter.com / www.destinationcommandcenter.com** | `destinationcommandcenter.com` | DCC Authority | Central Decision / Route Governance | `destinations-cc` | `prj_pqvFn6jtJbbVgv1UsAsg3KtMl26s` | `dpl_FfN16LXUUqRnCndbAu1nMxWj4qTu` | `destinations-cc` | `/home/erichroeseler123/destinations-cc` | `needs-current-refresh` | `vercel-project-metadata` | Static sitemap URL | dynamic multi-host sitemap | Multi-provider / telemetry | None | 2026-06-22 |
| **dcc-v1-cut-clean.vercel.app** | `dcc-v1-cut-clean.vercel.app` | TravelMarket | Template engine reference / staging | `dcc-v1-cut-clean` | `prj_luX9tL1gnzWWmlz6qagw4H0rCiyC` | `unverified` | `blank-app` | `/home/erichroeseler123/blank-app` | `needs-current-refresh` | `vercel-project-metadata` | `unverified` | `unverified` | Shared template hydration | None | 2026-06-22 |
| **welcometoalaskatours.com / www.welcometoalaskatours.com** | `welcometoalaskatours.com` | Satellite Market | Alaska tour SEO entrance | `wta-ui` | `prj_BDwKdcDdB4uHALPxUdBYsxZAksLg` | `dpl_4gw4xCCovqz37vEeNaJVYfqQ8mqX` | `wta-renderer` | `None` | `needs-current-refresh` | `owner-memory` | Independent sitemap link | Independent sitemap | Direct detail routing | Standalone wta-ui project | 2026-06-22 |
| **partyatredrocks.com / www.partyatredrocks.com** | `www.partyatredrocks.com` | Direct-Service | Denver Red Rocks shuttle booking | `partyatredrocks` | `prj_cnUiR8KGviBKpKADWDwcK9Gqr6sH` | `unverified` | `partyatredrocks` | `None` | `do-not-touch` | `owner-memory` | `unverified` | `unverified` | Square checkout / events | revenue-sensitive; apex redirect/MCP mismatch should not be touched without explicit approval | 2026-06-22 |
| **shuttleya.com / www.shuttleya.com** | `shuttleya.com` | Direct-Service | Argo Denver shuttle | `v0-shuttleya` | `prj_SiiHW7Y8DpAzLWCELG8kqfASZM8a` | `dpl_AEhnvcyt659mL6nNjniU5ZGJQTtN` | `unverified` | `None` | `stale-ledger-correction-needed` | `owner-memory` | `unverified` | `unverified` | Argo lead capture | Repaired live; ledger stale | 2026-06-22 |
| **welcometotheswamp.com** | `www.welcometotheswamp.com` | Satellite Market | Swamp tour SEO entrance | `welcometotheswamp` | `prj_ZY5kkB2QvuIkvJWSGD9IZ0mvhBxx` | `unverified` | `welcometotheswamp` | `/home/erichroeseler123/destinations-cc/apps/welcometotheswamp` | `live-verified-native` | `vercel-project-metadata` | Static sitemap URL | dynamic multi-host sitemap | FareHarbor widgets | Apex-WWW DNS split corrected and repaired | 2026-07-06 |
| **welcometoneworleanstours.com** | `www.welcometoneworleanstours.com` | Satellite Market | New Orleans Tours Outpost | `destinations-cc` | `prj_pqvFn6jtJbbVgv1UsAsg3KtMl26s` | `dpl_FfN16LXUUqRnCndbAu1nMxWj4qTu` | `destinations-cc` | `/home/erichroeseler123/destinations-cc` | `live-verified-native` | `vercel-project-metadata` | Static sitemap URL | dynamic multi-host sitemap | Multi-provider / telemetry | None | 2026-06-29 |

### Unverified / Proposed / Needs-Owner-Decision Rows

| Domain | Canonical Host | Owner Layer | Intended Role | Current Vercel Project | Current Project ID | Current Deployment ID | Source Repo | Local Checkout Path | Live Verification Status | Verification Source | Robots Status | Sitemap Status | Booking/Handoff Status | Risk Notes | Last Verified Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **gosno.co** | `gosno.co` | Direct-Service | Ski and winter mountain transport | `gosno` | `prj_vXDUvqAXza3XNca9gFCQ3wTa0124` | `unverified` | `unverified` | `None` | `unverified` | `unverified` | `unverified` | `unverified` | Shuttle Booking / Dispatch | Needs Vercel/repo check | `not-live-verified` |
| **welcometothedells.com** | `www.welcometothedells.com` | Satellite Market | Wisconsin Dells SEO entrance | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `proposed` | `unverified` | `unverified` | `unverified` | Missing from master ledger | `not-live-verified` |
| **juneauflightdeck.com** | `juneauflightdeck.com` | Satellite Market | Juneau helicopter SEO entrance | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `proposed` | `unverified` | `unverified` | `unverified` | Missing from master ledger | `not-live-verified` |
| **lastfrontiershoreexcursions.com** | `www.lastfrontiershoreexcursions.com` | Satellite Market | Alaska excursions SEO entrance | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `proposed` | `unverified` | `unverified` | `unverified` | Missing from master ledger | `not-live-verified` |
| **frenchquarterorientation.com** | `www.frenchquarterorientation.com` | Satellite Market | New Orleans orientation guide | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `proposed` | `unverified` | `unverified` | `unverified` | Missing from master ledger | `not-live-verified` |
| **saveonthestrip.com** | `www.saveonthestrip.com` | Satellite Market | Las Vegas SEO entrance | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `proposed` | `unverified` | `unverified` | `unverified` | Missing from master ledger | `not-live-verified` |
| **shuttletosomersetamphitheater.com** | `www.shuttletosomersetamphitheater.com` | Direct-Service | Somerset private shuttle | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `needs-owner-decision` | `proposed` | `unverified` | `code-supports-host-aware-sitemap / live-unverified` | Private group lead form | Alias shift unverified | `not-live-verified` |
| **ectomsp.com** | `ectomsp.com` | Direct-Service | Eau Claire to MSP airport ride | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `needs-owner-decision` | `proposed` | `unverified` | `unverified` | Airport transport booking | Spelling: ectomsp.com / ectoMSP | `not-live-verified` |
| **bluehillsoutpost.com** | `bluehillsoutpost.com` | Local Drop | Outpost supply booking | `unverified` | `unverified` | `unverified` | `unverified` | `unverified` | `parked-or-unresolved` | `proposed` | `unverified` | `unverified` | Manual booking / local drop | Non-travel classification | `not-live-verified` |
| **cruisepromenade.com / www.cruisepromenade.com** | `cruisepromenade.com` | Satellite Market | Social cruise planning & excursions | `cruisepromenade` | `unverified` | `unverified` | `cruisepromenade` | `/home/erichroeseler123/.gemini/antigravity/scratch/cruisepromenade` | `live-verified-native` | `vercel-project-metadata` | Static sitemap URL | dynamic sitemap | Direct detail routing / roster | None | 2026-07-08 |

## Governance Rule

Any future change to domain ownership, Vercel project ownership, repository ownership, or operational layer classification must update this ledger in the same change set.

Do not move domains, deploy new ownership, or repurpose a brand before checking this file.
