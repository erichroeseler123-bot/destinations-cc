# Save On The Strip

Standalone Vegas satellite for `saveonthestrip.com`.

## Goals

- monetize Vegas tours with FareHarbor
- monetize Vegas shows with affiliate ticket links
- keep DCC as the attribution and lifecycle hub without leaking DCC branding into the public site

## Required env

- `DCC_SAVEONTHESTRIP_WEBHOOK_TOKEN`
- `TICKETMASTER_API_KEY`
- `TICKETMASTER_AFFILIATE_DEEPLINK_BASE` optional, use `{url}` placeholder for wrapped Ticketmaster affiliate links
- `SEATGEEK_AFFILIATE_DEEPLINK_BASE` optional, use `{url}` placeholder for wrapped SeatGeek affiliate links
- `SEATGEEK_CLIENT_ID` or `SEATGEEK_API_KEY`
- `FAREHARBOR_API` read-only FareHarbor API user key, or JSON payload with `appName`, `userKey`, and optional `companies`
- `FAREHARBOR_COMPANIES` optional comma-separated company shortnames for Vegas-area operators
- `FAREHARBOR_APP_NAME` optional FareHarbor app header value, defaults to `saveonthestrip`

## Deployment contract

1. Deploy `apps/saveonthestrip` as its own Vercel project root.
2. Use `.github/workflows/deploy-saveonthestrip.yml` to create or reuse the isolated `saveonthestrip` project and publish the standalone app.
3. Pin only `saveonthestrip.com` and `www.saveonthestrip.com` to that project; do not reuse the legacy DCC project that also carries other portfolio domains.
4. Keep title, application name, Open Graph, and Twitter metadata explicitly Save On The Strip branded.
5. Add required commercial/API environment variables to the isolated project as those integrations are enabled.
