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

| Domain | Layer | Vercel Project | Repo | Status |
| :--- | :--- | :--- | :--- | :--- |
| destinationcommandcenter.com | DCC Authority | destinations-cc | destinations-cc | LIVE / Verified |
| dcc-v1-cut-clean.vercel.app | TravelMarket | dcc-v1-cut-clean | blank-app | LIVE / Template Engine |
| welcometoalaskatours.com | Satellite Market | wta-ui | wta-renderer | LIVE / Verified |
| partyatredrocks.com | Direct-Service | partyatredrocks | partyatredrocks | LIVE / Revenue |
| gosno.co | Direct-Service | gosno | Unknown | LIVE |
| shuttleya.com | Direct-Service | v0-code-review (WRONG) | Unknown | HIGH RISK / Mismapped |
| welcometotheswamp.com | Satellite Market | dcc-v1-cut-clean | blank-app | HIGH RISK / Apex-WWW Split |

## Governance Rule

Any future change to domain ownership, Vercel project ownership, repository ownership, or operational layer classification must update this ledger in the same change set.

Do not move domains, deploy new ownership, or repurpose a brand before checking this file.
