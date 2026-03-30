# Juneau Flight Deck

Standalone Juneau helicopter-tour satellite for `juneauflightdeck.com`.

## Goals

- show date-first Juneau helicopter availability from DCC
- keep the flow focused on one cruise day only
- route visitors into direct provider bookings through FareHarbor

## Required env

- `DCC_ORIGIN` optional, defaults to `https://www.destinationcommandcenter.com`

## First integration steps

1. Link this directory to the target Vercel project.
2. Add the production domain `juneauflightdeck.com`.
3. Verify the DCC Juneau live-slot endpoint is returning real helicopter inventory.
4. Replace any placeholder FareHarbor assumptions with real provider routing if needed.
