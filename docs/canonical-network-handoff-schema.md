# Canonical Network Handoff Schema

## Purpose

This document defines the shared cross-site handoff contract for:

- `destinationcommandcenter.com` (`DCC`)
- `partyatredrocks.com` (`PARR`)
- `welcometoalaskatours.com` (`WTA`)
- `gosno.co` (`GOSNO`)

DCC is the authority layer, analytics hub, and system of record. Satellites execute booking flows. All material handoff and partner-forward activity must be visible to DCC.

## Topology

### DCC <-> WTA

- Purpose: Alaska authority and shore-excursion execution
- DCC sends:
  - `handoffId`
  - `port`
  - `topic`
  - optional `ship`
  - optional `ship_slug`
  - optional `date`
  - `dcc_return`
- WTA posts back:
  - `handoff_viewed`
  - `lead_captured`
  - `booking_started`
  - `booking_completed`
  - `booking_failed`
  - `traveler_returned`

### DCC <-> PARR

- Purpose: Red Rocks and Colorado concert transport execution
- DCC sends:
  - `handoffId`
  - `venue`
  - `source_page`
  - optional `event`
  - optional `artist`
  - optional `date`
  - optional `qty`
  - `dcc_return`
- PARR posts back:
  - `handoff_viewed`
  - `lead_captured`
  - `booking_started`
  - `booking_completed`
  - `booking_failed`
  - `traveler_returned`

### DCC <-> GOSNO

- Purpose: Colorado ski and mountain transfer execution
- DCC sends:
  - `handoffId`
  - `corridor` or normalized city context
  - `source_page`
  - optional `date`
  - optional `qty`
  - `dcc_return`
- GOSNO posts back:
  - `handoff_viewed`
  - `lead_captured`
  - `booking_started`
  - `booking_completed`
  - `booking_failed`
  - `traveler_returned`

### Satellite-to-satellite links

- `PARR <-> GOSNO`
- `WTA <-> PARR`
- `WTA <-> GOSNO`

These are allowed only if DCC remains visible to the full timeline.

## Mandatory Network Rules

1. DCC creates the canonical `handoffId`.
2. Every site preserves that same `handoffId`.
3. Every major event is posted back to DCC.
4. If site A forwards to site B, DCC must be notified.
5. DCC stores the full timeline across all sites.
6. DCC remains the system of record for authority and analytics.

## Event Endpoint

- Method: `POST`
- URL: `https://destinationcommandcenter.com/api/internal/satellite-handoffs/events`
- Header: `x-dcc-satellite-token: <satellite-specific-token>`
- Content-Type: `application/json`

The live validator and storage model are implemented in [satelliteHandoffs.ts](/home/ewrewr12/destinations-cc/lib/dcc/satelliteHandoffs.ts).

## Canonical Event Types

### Base lifecycle events

- `handoff_viewed`
- `lead_captured`
- `booking_started`
- `booking_completed`
- `booking_failed`
- `booking_cancelled`
- `status_updated`
- `traveler_returned`

### Degradation and bottleneck events

- `inventory_low`
- `inventory_unavailable`
- `response_degraded`
- `booking_failure_rate_high`
- `temporarily_paused`

These let DCC rebalance traffic away from weak lanes.

### Satellite-to-satellite visibility events

- `forwarded_to_partner`
- `accepted_from_partner`
- `partner_booking_completed`
- `partner_booking_failed`

These are required for any direct satellite-to-satellite routing that DCC needs to measure.

## Canonical Payload

### Required fields

- `handoffId: string`
- `satelliteId: "partyatredrocks" | "gosno" | "welcome-to-alaska"`
- `eventType`

### Recommended core fields

- `source`
- `sourcePath`
- `externalReference`
- `status`
- `stage`
- `message`
- `occurredAt`

### Optional nested objects

- `traveler`
  - `email`
  - `phone`
  - `name`
  - `partySize`
- `attribution`
  - `sourceSlug`
  - `sourcePage`
  - `topicSlug`
- `booking`
  - `venueSlug`
  - `portSlug`
  - `citySlug`
  - `productSlug`
  - `eventDate`
  - `quantity`
  - `currency`
  - `amount`
- `partner`
  - `fromSite`
  - `toSite`
  - `partnerHandoffId`
  - `reason`
- `metadata`
  - optional extra debugging or partner-specific fields

## Normalization Rules

- `currency` must be uppercase 3-letter form, e.g. `USD`
- `eventDate` should be `YYYY-MM-DD`
- Use canonical DCC slugs wherever possible
- Keep the same `handoffId` from first landing through final outcome
- `externalReference` should identify the local partner-side record when one exists

## Canonical Payload Example

```json
{
  "handoffId": "ho_123456789",
  "satelliteId": "welcome-to-alaska",
  "eventType": "booking_completed",
  "source": "wta",
  "sourcePath": "/checkout/success",
  "externalReference": "ord_abc123",
  "status": "booked",
  "stage": "confirmed",
  "message": "optional note",
  "traveler": {
    "email": "traveler@example.com",
    "phone": "+1-555-555-5555",
    "name": "Jane Traveler",
    "partySize": 4
  },
  "attribution": {
    "sourceSlug": "dcc-cruises-port",
    "sourcePage": "/cruises/port/juneau",
    "topicSlug": "shore-excursions"
  },
  "booking": {
    "venueSlug": "red-rocks-amphitheatre",
    "portSlug": "juneau-alaska",
    "citySlug": "denver-colorado",
    "productSlug": "juneau-helicopter-glacier-tour",
    "eventDate": "2026-07-12",
    "quantity": 4,
    "currency": "USD",
    "amount": 899
  },
  "partner": {
    "fromSite": "welcome-to-alaska",
    "toSite": "partyatredrocks",
    "partnerHandoffId": "ho_123456789",
    "reason": "cross-sell"
  },
  "occurredAt": "2026-03-17T18:30:00.000Z"
}
```

## Partner-forward Payload Templates

### `forwarded_to_partner`

Emit this from the sending satellite when it forwards a traveler to another satellite.

```json
{
  "handoffId": "ho_rr_123",
  "satelliteId": "partyatredrocks",
  "eventType": "forwarded_to_partner",
  "source": "parr",
  "sourcePath": "/book/red-rocks-amphitheatre/private",
  "externalReference": "parr-order-123",
  "status": "forwarded",
  "stage": "partner_handoff",
  "message": "Forwarded traveler from PARR to GOSNO",
  "attribution": {
    "sourceSlug": "red-rocks-amphitheatre",
    "sourcePage": "/red-rocks-shuttle",
    "topicSlug": "private-rides"
  },
  "booking": {
    "venueSlug": "red-rocks-amphitheatre",
    "eventDate": "2026-08-01",
    "quantity": 2
  },
  "partner": {
    "fromSite": "partyatredrocks",
    "toSite": "gosno",
    "partnerHandoffId": "ho_rr_123",
    "reason": "traveler_reuse"
  }
}
```

### `accepted_from_partner`

Emit this from the receiving satellite after it accepts the forwarded handoff and renders a usable landing page.

```json
{
  "handoffId": "ho_rr_123",
  "satelliteId": "gosno",
  "eventType": "accepted_from_partner",
  "source": "gosno",
  "sourcePath": "/transfers/denver-vail",
  "externalReference": "gosno-session-789",
  "status": "accepted",
  "stage": "partner_landing",
  "message": "Accepted traveler from PARR",
  "attribution": {
    "sourceSlug": "denver-vail",
    "sourcePage": "/transfers/denver-vail",
    "topicSlug": "ski-transfer"
  },
  "booking": {
    "citySlug": "denver-colorado",
    "eventDate": "2026-08-01",
    "quantity": 2
  },
  "partner": {
    "fromSite": "partyatredrocks",
    "toSite": "gosno",
    "partnerHandoffId": "ho_rr_123",
    "reason": "traveler_reuse"
  }
}
```

### `partner_booking_completed`

Emit this from the destination satellite when a forwarded traveler completes booking there.

```json
{
  "handoffId": "ho_rr_123",
  "satelliteId": "gosno",
  "eventType": "partner_booking_completed",
  "source": "gosno",
  "sourcePath": "/checkout/complete",
  "externalReference": "gosno-booking-456",
  "status": "booked",
  "stage": "partner_confirmed",
  "booking": {
    "citySlug": "denver-colorado",
    "eventDate": "2026-08-01",
    "quantity": 2,
    "amount": 480,
    "currency": "USD"
  },
  "partner": {
    "fromSite": "partyatredrocks",
    "toSite": "gosno",
    "partnerHandoffId": "ho_rr_123",
    "reason": "traveler_reuse"
  }
}
```

### `partner_booking_failed`

Emit this from the destination satellite when a forwarded traveler fails or abandons partner checkout.

```json
{
  "handoffId": "ho_rr_123",
  "satelliteId": "gosno",
  "eventType": "partner_booking_failed",
  "source": "gosno",
  "sourcePath": "/checkout",
  "externalReference": "gosno-session-789",
  "status": "failed",
  "stage": "partner_checkout",
  "message": "Traveler abandoned partner checkout",
  "booking": {
    "citySlug": "denver-colorado",
    "eventDate": "2026-08-01",
    "quantity": 2
  },
  "partner": {
    "fromSite": "partyatredrocks",
    "toSite": "gosno",
    "partnerHandoffId": "ho_rr_123",
    "reason": "traveler_reuse"
  }
}
```

## Site-specific Mapping

### PARR

- `satelliteId: "partyatredrocks"`
- Prefer `booking.venueSlug`, e.g. `red-rocks-amphitheatre`
- Prefer `attribution.sourcePage`, e.g. `/red-rocks-shuttle`
- Good `topicSlug` values:
  - `shuttle`
  - `private-rides`
  - `concert-transportation`

### WTA

- `satelliteId: "welcome-to-alaska"`
- Prefer `booking.portSlug`, e.g. `juneau-alaska`
- Good `topicSlug` values:
  - `shore-excursions`
  - `cruise-port`
  - `alaska-itinerary`

### GOSNO

- `satelliteId: "gosno"`
- Prefer `booking.citySlug` or normalized corridor context
- Good `topicSlug` values:
  - `ski-transfer`
  - `mountain-transport`
  - `colorado-corridor`

## Priority Order

1. `DCC <-> WTA`
2. `DCC <-> PARR`
3. `DCC <-> GOSNO`
4. `PARR <-> GOSNO`
5. `WTA <-> PARR`
6. `WTA <-> GOSNO`
