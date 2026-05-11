# Environment Contract

This repo has moved past "a few API keys" and now has a real platform configuration layer.

The point of this contract is control:

- secrets must be rotated if local env files are exposed
- only a small set of integrations should be treated as active by default
- external APIs can enrich lanes, but they must not define site structure

## Immediate Rule

Treat local `.env.local` and `.env.production.local` as sensitive secret stores.

If those files have been copied, pasted, synced, or exposed outside your machine:

1. rotate payment credentials
2. rotate database credentials
3. rotate webhook tokens
4. rotate provider API keys

## Active Stack

Primary:

- DCC core
- Viator
- Ticketmaster
- FareHarbor
- Square

Secondary:

- SeatGeek
- GetYourGuide

Optional by default:

- Bandsintown
- Foursquare
- Amadeus
- Travelpayouts
- OpenSky

## Groups

`core`

- database and internal auth
- DCC origins, router, edge config, webhook tokens
- anything that can break the network if misconfigured
- EarthOS mission snapshot and publication persistence

`revenue`

- Square
- Stripe
- Resend / operational email
- FareHarbor
- KV-backed booking state

`providers_primary`

- Viator
- Ticketmaster
- FareHarbor
- GetYourGuide

`providers_optional`

- SeatGeek
- Bandsintown
- Foursquare
- Amadeus
- Travelpayouts
- OpenSky

## Operating Rules

1. External APIs must never define structure.
   They can fill pages and enrich decisions, but they do not get to create routes, sitemaps, or publishing policy.

2. Volatile APIs stay in volatile lanes.
   Ticketmaster and SeatGeek belong in live entertainment lanes, not in the core evergreen publishing system.

3. Stable APIs can power evergreen discovery.
   Viator is appropriate for durable discovery and decision inventory.

4. Optional providers must be safe when absent.
   Missing optional keys should degrade capability, not break the app.

5. Canonical names win.
   Avoid alias sprawl. Prefer one canonical env name per value.

6. EarthOS must degrade cleanly.
   Missing workflow or database config should fall back to seeded/local Mission Control behavior instead of breaking the dashboard.

## EarthOS-Specific Environment

Database:

- `DCC_DATABASE_URL`
- `DATABASE_URL`
- `POSTGRES_URL`

EarthOS uses the same Postgres / Neon resolution order as the rest of the repo. The new durable tables are:

- `earthos_missions`
- `earthos_mission_steps`
- `earthos_publications`

Workflow / Vercel:

- `VERCEL_TOKEN`
- `WORKFLOW_VERCEL_TOKEN`
- `VERCEL_PROJECT_ID`
- `WORKFLOW_VERCEL_PROJECT_ID`
- `VERCEL_TEAM_ID`
- `WORKFLOW_VERCEL_TEAM_ID`
- `VERCEL_PROJECT_NAME`
- `WORKFLOW_VERCEL_PROJECT_NAME`
- `WORKFLOW_VERCEL_ENV`
- `VERCEL_ENV`
- `VERCEL_TARGET_ENV`

Operational rule:

- prefer canonical `VERCEL_*` values when present
- use `WORKFLOW_VERCEL_*` as explicit EarthOS overrides
- if neither is present, local Mission Control should still function in degraded mode

## Square Environment Normalization

Square is a money-surface integration. Normalize names in code first, then remove legacy Vercel aliases only after a production deploy and checkout smoke confirm no fallback usage.

Canonical root DCC / shared Square names:

- `SQUARE_ENVIRONMENT`
- `SQUARE_APP_ID`
- `NEXT_PUBLIC_SQUARE_APP_ID`
- `SQUARE_LOCATION_ID`
- `NEXT_PUBLIC_SQUARE_LOCATION_ID`
- `SQUARE_ACCESS_TOKEN`

Canonical 420 pickup Square names:

- `SQUARE_ENVIRONMENT_420_PICKUP`
- `SQUARE_APP_ID_420_PICKUP`
- `NEXT_PUBLIC_SQUARE_APPLICATION_ID_420_PICKUP`
- `SQUARE_LOCATION_ID_420_PICKUP`
- `NEXT_PUBLIC_SQUARE_LOCATION_ID_420_PICKUP`
- `SQUARE_ACCESS_TOKEN_420_PICKUP`

Temporary legacy aliases:

- `SQUARE_access_token` -> `SQUARE_ACCESS_TOKEN`
- `SQUARE_sandbox_access_token` -> `SQUARE_ENVIRONMENT + SQUARE_ACCESS_TOKEN`
- `SQUARE_Sandbox_App_ID` -> `SQUARE_ENVIRONMENT + SQUARE_APP_ID`
- `SQUARE_access_token_420_pickup` -> `SQUARE_ACCESS_TOKEN_420_PICKUP`
- `SQUARE_location_id` -> `SQUARE_LOCATION_ID`
- `NEXT_PUBLIC_SQUARE_APPLICATION_ID` -> `NEXT_PUBLIC_SQUARE_APP_ID`

Runtime rule:

- code must prefer canonical names first
- legacy aliases may be used only as fallback
- fallback usage must log `DRIFT_DETECTED` with the alias name and canonical replacement only
- no warning may print secret values
- 420 pickup overrides must remain route-specific and must not be flattened into root DCC Square keys

Deletion criteria:

1. production deploy succeeds with canonical-first code
2. checkout smoke passes for DCC/PARR, Argo/Shuttleya, 420 pickup, and Red Rocks Fast Pass where applicable
3. production logs show no `DRIFT_DETECTED` Square fallback usage
4. only then remove temporary legacy aliases from Vercel

## Checks

The checked-in contract starts in [.env.example](/home/ewrewr12/destinations-cc/.env.example).

Structure validation:

```bash
npm run dcc:env:check:ci
```

Local contract validation:

```bash
npm run dcc:env:check
```

Runtime health snapshot:

```bash
curl -H "x-internal-secret: $INTERNAL_API_SECRET" \
  http://localhost:3000/api/internal/env-health
```

EarthOS schema apply:

```bash
pnpm drizzle-kit push
```

EarthOS workflow + persistence verification:

```bash
pnpm exec tsc --noEmit --incremental false
```

## What To Clean Up Next

1. rotate secrets that may have been exposed locally
2. remove legacy env aliases from deployed environments
3. keep `.env.example` aligned with `scripts/dcc/env-contract.mjs`
4. disable optional providers by default in production until explicitly needed
5. keep EarthOS workflow and database env present together in production so Mission Control does not fall back to local-only behavior
