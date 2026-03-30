# Welcome To The Swamp

Standalone New Orleans swamp-tour satellite for `welcometotheswamp.com`.

## Goals

- show live swamp-tour availability from DCC
- route visitors into direct provider bookings through FareHarbor
- keep the flow mobile-first and brutally simple

## Required env

- `DCC_ORIGIN` optional, defaults to `https://www.destinationcommandcenter.com`

## First integration steps

1. Link this directory to the target Vercel project.
2. Add the production domain `welcometotheswamp.com`.
3. Verify the DCC live-slot endpoint is returning real swamp inventory.
4. Replace any placeholder FareHarbor assumptions with real provider routing if needed.
