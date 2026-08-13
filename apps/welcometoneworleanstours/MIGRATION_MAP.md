# WNO migration ownership map

## Current production ownership

- Vercel project: `welcometoneworleanstours`
- Vercel project ID: `prj_G4aMmGzfGoWKyVZ9wTgUPf5D7rrS`
- Current Git source: `erichroeseler123-bot/destinations-cc`
- Current production branch: `main`
- Current production source snapshot at extraction start: `42da037c8ea8cc298693d5c95ebbe184f4db818d`
- Current domains on the Vercel project include `www.welcometoneworleanstours.com` plus Vercel aliases.

## Secondary/legacy Vercel projects discovered

These are not the canonical production owner and should not become the new source of truth:

- `v0-welcometoneworleans` — `prj_XoQ97bnmJUnVlNacoJVUzLpOHkyS` — no current deployment/domain
- `destinations-cc-nola-visual-preview` — `prj_fIIVr5D7QcR9OwJn2DvM3AlIsRev` — preview-only historical project

## Why extraction is required

The canonical WNO Vercel project is connected to the giant `destinations-cc` repository. As a result, unrelated suite commits can trigger WNO deployments. Recent WNO project deployments have been caused by commits concerning DCC handoffs, Cruise Promenade, Juneau Flight Deck, GoSno and SaveOnTheStrip.

## Source areas confirmed to contain WNO material

- `app/new-orleans/**` — principal storefront implementation
- `apps/welcometoneworleanstours/app/agent.json/**` — WNO machine-readable endpoint
- `apps/welcometoneworleanstours/app/llms.txt/**` — WNO AI-readable endpoint
- `src/data/new-orleans-city-site.ts` — New Orleans data outside the principal route tree
- `docs/wno/**` — WNO audit/status governance
- WNO-specific tests/scripts scattered in the repository

## Known mixed-ownership problem

`app/new-orleans/**` is not pure WNO. Some New Orleans routes there are DCC-only. Extraction must follow the WNO host router and production consumer graph rather than copying by folder name alone.

## Target

A dedicated repository named `erichroeseler123-bot/welcometoneworleanstours` should become the only Git source for Vercel project `welcometoneworleanstours` after parity verification. The domain should stay on the existing Vercel project during the source switch.
