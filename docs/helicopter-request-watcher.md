# Demand-driven helicopter watch

Only submitted tours, port dates, traveler ages and optional departure windows are monitored. The first check runs on intake. Requests farther than 21 Alaska calendar days out are checked daily; inside 21 days they become due every 15 minutes. A protected five-minute cron drains a bounded queue. This lead-in catches releases around the owner's roughly two-week reconciliation window; it is not a guaranteed operator release schedule. Provider outages and queue capacity can delay checks.

Live Viator discovery and availability checks are used without sample-data fallbacks. The service sees inventory supplied to Viator, not private cruise allocations or every operator's direct system. No bookings or holds are made. Ship return timing, duration, pickup, weights and individual cancellation terms require owner review.

All automated recipients are fixed to erichroeseler123@gmail.com. Travelers get no automated messages. Owner receipts and opening alerts contain request details and a signed control link. Keep control links private; pause or mark filled when seats are no longer needed.

The existing DCC database stores requests, catalog metadata, rate limits and an email outbox. The additive migration is checked in alongside its idempotent initializer. Row leases recover after interruptions. Availability-state updates and alert insertion are atomic. Partial API failures retain previous state for failed products rather than counting them as unavailable. Unchanged open departures do not repeat alerts; new departures and reopened inventory can alert again.

Resend sends use persistent idempotency keys and recorded provider IDs. Failed sends retry. Entries older than 23 hours require review to avoid duplicates outside the provider's idempotency window. Provider acceptance is not proof of inbox delivery.

Production requires the existing database, Viator and verified Resend configuration, CRON_SECRET, and INTERNAL_API_SECRET (or cron secret) for owner controls. The cron fails closed without authentication. Intake validates requests and uses database-backed rate limits. GET never mutates request state.

Run `node --import tsx --test tests/helicopter-watch.test.ts` for request, date, age-band, matching and owner-token checks. Verify production by creating a clearly labeled owner test, confirming Gmail receipt and signed controls, observing a subsequent cron check, and marking that test filled.

Associated deployment compatibility repairs move reusable helpers out of Next.js route exports, use async Next.js 16 parameters, scope WNO variables to its shell and use Node.js for Telnyx-backed actions. They preserve existing endpoint behavior.
