# New Orleans Restaurant Referral MVP

## Commercial model

The initial Dining Partner pilot uses a simple performance model:

- Default fee: **$5 per confirmed seated guest**.
- Upfront listing fee: **$0** during the pilot.
- Billing cadence: **monthly reconciliation**.
- A restaurant-specific written agreement can override the default fee.
- The site does not charge the visitor a restaurant referral fee.

## What is billable

A referral is billable only when all of the following are true:

1. Welcome to New Orleans Tours / New Orleans Concierge Desk originated the dining referral.
2. The referral is tied to a partner referral code and/or concierge referral record.
3. The restaurant confirms the party actually seated.
4. The seated guest count is known.
5. The referral is not a duplicate of a reservation that predates the referral.

The billable quantity is the number of guests actually seated, not the original reservation party size.

## What is not billable

- recommendation views
- outbound clicks
- reservation attempts
- cancellations
- no-shows
- duplicate reservations
- guests already reserved before the referral
- walk-ins that cannot reasonably be tied to the referral

## Referral states

Each referral should move through the following states:

- `referred` — recommendation or concierge handoff made
- `reservation_requested` — visitor attempted or requested a reservation
- `reserved` — restaurant/reservation system indicates a reservation exists
- `seated_confirmed` — restaurant confirms guest(s) actually seated
- `cancelled`
- `no_show`
- `duplicate`
- `disputed`

Only `seated_confirmed` generates a payable referral fee.

## Minimum referral ledger

For the pilot, keep one row per referred party with:

- referral ID
- created date/time
- dining partner ID
- partner referral code
- source (`food-page`, `concierge-call`, `concierge-text`, `tour-detail`, etc.)
- guest first name or booking name as needed for reconciliation
- requested date/time
- requested party size
- reservation confirmation/reference if available
- state
- confirmed seated guest count
- partner fee per seated guest
- calculated amount due
- reconciliation month
- notes/dispute reason

Avoid storing payment card data or unnecessary sensitive guest information.

## Monthly reconciliation

1. Export or review that month's restaurant referrals.
2. Send the restaurant the referral IDs, booking names/references, dates, and requested party sizes needed to identify the parties.
3. Restaurant marks each referral seated/cancelled/no-show/duplicate/disputed and supplies the confirmed seated guest count.
4. Calculate: `confirmed seated guests × agreed per-guest fee`.
5. Resolve disputed rows before invoicing.
6. Preserve the reconciled ledger as the audit record for that month.

## Public recommendation rules

- Never publish a restaurant as a Dining Partner before an agreement exists.
- Only `active` partners appear in paid-partner recommendation surfaces.
- Paid status must be disclosed near the recommendation.
- Partner payment does not guarantee a recommendation for every visitor.
- Recommendations should use visitor-fit factors such as timing, neighborhood, party size, meal type, accessibility constraints, and before/after-tour logistics.
- The restaurant remains responsible for reservations, service, menu, prices, taxes, availability, guest policies, and fulfillment.

## Pilot success metrics

Measure:

- referred parties
- requested covers
- confirmed seated covers
- referral-to-seated conversion rate
- revenue per referred party
- revenue per seated cover
- disputes/duplicates
- partner retention
- which visitor situations produce the most seated covers

Do not optimize for raw clicks. The revenue event is a confirmed seated diner.
