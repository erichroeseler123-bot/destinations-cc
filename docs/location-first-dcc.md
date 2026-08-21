# Location-First DCC

Status: implementation slice in preview

## Product rule

Destination Command Center opens on the user's current location when browser permission is available. The user can replace that location with any searched place. Coordinates are the primary input to the live data layer.

## Public flow

`device/search -> location resolver -> coordinates -> public live feeds -> normalized live payload -> DCC location view`

## Current implementation

- `app/components/dcc/LocationFirstHome.tsx`
  - browser geolocation
  - last-selected-location fallback
  - place search
  - live coordinate-driven view
- `app/api/public/location-resolve/route.ts`
  - text search to coordinates
  - reverse coordinates to human-readable place
  - OpenStreetMap Nominatim adapter
- `app/api/public/city-live/route.ts`
  - existing coordinate-driven live data endpoint
  - Open-Meteo weather
  - machine feeds
  - coastal/water feeds
  - configured event provider
  - derived CityNow state

## Architecture direction

DCC is the public location interface.

EarthOS is the underlying location/source/observation infrastructure and orchestration layer. Existing travel decision corridors remain a commercial subsystem rather than the definition of DCC.

## Guardrails

- Do not require hand-built city pages for the core live view.
- Coordinates determine source applicability.
- Public facts must remain inspectable and provider-attributed.
- AI or derived summaries may interpret structured observations but must not invent source facts.
- Existing domain-host overrides must remain intact.
- Prime-season operator booking surfaces remain untouched.

## Next implementation slices

1. Replace city-slug conditionals with geographic source coverage rules.
2. Introduce a normalized observation contract across weather, alerts, traffic, transit, water, earth, events, airports, cruise and future feeds.
3. Build a provider/source registry with coverage, refresh, health, attribution and auth metadata.
4. Add more no-key public endpoint adapters.
5. Separate internal EarthOS network-governance views from the public DCC location experience.
