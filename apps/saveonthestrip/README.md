# Save On The Strip

Standalone Vegas satellite for `saveonthestrip.com`.

## Goals

- monetize Vegas tours with FareHarbor
- monetize Vegas shows with affiliate ticket links
- keep DCC as the attribution and lifecycle hub

## Required env

- `DCC_SAVEONTHESTRIP_WEBHOOK_TOKEN`
- `TICKETMASTER_API_KEY`
- `TICKETMASTER_AFFILIATE_DEEPLINK_BASE` optional, use `{url}` placeholder for wrapped Ticketmaster affiliate links
- `SEATGEEK_AFFILIATE_DEEPLINK_BASE` optional, use `{url}` placeholder for wrapped SeatGeek affiliate links
- `SEATGEEK_CLIENT_ID` or `SEATGEEK_API_KEY`
- `FAREHARBOR_API` read-only FareHarbor API user key, or JSON payload with `appName`, `userKey`, and optional `companies`
- `FAREHARBOR_COMPANIES` optional comma-separated company shortnames for Vegas-area operators
- `FAREHARBOR_APP_NAME` optional FareHarbor app header value, defaults to `saveonthestrip`

## First integration steps

1. Link this directory to the target Vercel project.
2. Add the DCC webhook token to both DCC and this project.
3. Add the production domain `saveonthestrip.com`.
4. Replace placeholder shows/tours pages with real inventory and affiliate wiring.
