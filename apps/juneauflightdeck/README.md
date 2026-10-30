# Juneau Flight Deck

Standalone Juneau helicopter-tour satellite for `juneauflightdeck.com`.

## Goals

- show date-first Juneau helicopter suitability and options from DCC
- keep the flow focused on one cruise day only
- route visitors into Viator partner bookings (`pid=P00058396`) with accurate Viator Terms of Use Section 20 Worry-free Shore Excursion positioning

## Required env

- `DCC_ORIGIN` optional, defaults to `https://www.destinationcommandcenter.com`

## First integration steps

1. Link this directory to the target Vercel project.
2. Add the production domain `juneauflightdeck.com`.
3. Verify the DCC Juneau evaluation and handoff endpoints are returning verified helicopter suitability and Viator handoff URLs.
4. Confirm Viator partner attribution (`pid=P00058396`, `mcid=42383`, `medium=api`) is preserved across product and search referrals.

## Deployment verification

Production builds from `main` with Vercel Root Directory set to `apps/juneauflightdeck`. The dedicated `deploy-juneauflightdeck.yml` workflow enforces that root and pins both `juneauflightdeck.com` and `www.juneauflightdeck.com` to the standalone production deployment.

Use `/api/health` after each production deployment to confirm the standalone Juneau app is serving before changing public-domain routing. Unrelated `destinations-cc` commits are filtered by the Juneau ignored-build guard so they do not rebuild this property.
