# Corridor QA: 420 Friendly Airport Pickup

## Case: 420-1 Red Rocks arrival
URL:
`/?dcc_handoff_id=qa_420_1&source_page=/red-rocks/getting-in-from-denver&requested_lane=private-transfer&resolved_lane=event-transfer&topic=red-rocks-airport-arrival&subtype=private&date=2026-08-14&port=denver`

Expected first render:
- headline: `Best Denver airport arrival option before Red Rocks`
- CTA: `Check Red Rocks pickup options`
- highlighted package: `airport-red-rocks`
- date prefilled: `2026-08-14`

Expected next event:
- `handoff_viewed`
- `shortlist_rendered`
- `booking_opened`
- `checkout_started`

Fail if:
- generic airport pickup package remains first
- Red Rocks-specific headline does not render
- checkout link drops `dcc_handoff_id` or `product_slug=airport-red-rocks`

Canonical decision URL:
`/?dcc_handoff_id=qa_420_decision_1&source_page=/red-rocks/getting-in-from-denver&decision_corridor=red-rocks-airport-arrival&decision_action=book_transfer&decision_option=event-transfer&decision_product=airport-red-rocks&decision_entry=act&decision_state=committed&date=2026-08-14&port=denver`

## Case: 420-2 Dispensary stop
URL:
`/?dcc_handoff_id=qa_420_2&source_page=/denver/420-arrival&requested_lane=private-transfer&resolved_lane=airport-dispensary&topic=dispensary-stop&subtype=420&date=2026-08-14&product_slug=airport-dispensary`

Expected first render:
- headline references curated dispensary stop
- CTA: `Check dispensary-stop options`
- highlighted package: `airport-dispensary`

Fail if:
- Red Rocks package remains first
- checkout link does not preserve `product_slug=airport-dispensary`

Canonical decision URL:
`/?dcc_handoff_id=qa_420_decision_2&source_page=/denver/420-arrival&decision_corridor=airport-420-pickup&decision_action=book_transfer&decision_option=airport-dispensary&decision_product=airport-dispensary&decision_entry=act&decision_state=committed&date=2026-08-14`

## Case: 420-3 Mountain transfer
URL:
`/?dcc_handoff_id=qa_420_3&source_page=/denver/mountain-arrival&requested_lane=private-transfer&resolved_lane=airport-mountain&topic=ski-transfer&subtype=mountain-route&date=2026-12-20&product_slug=airport-mountain`

Expected first render:
- headline references mountain-bound arrival
- highlighted package: `airport-mountain`

Fail if:
- mountain-specific state is missing
- checkout link does not preserve `product_slug=airport-mountain`

## Case: 420-4 Low-confidence fallback
URL:
`/?dcc_handoff_id=qa_420_4&source_page=/random&requested_lane=unknown&resolved_lane=unknown&topic=arrival&subtype=misc`

Expected first render:
- base headline: `Private Denver airport pickup with optional dispensary stop`
- CTA: `Check pickup options`
- highlighted package: `airport-pickup`

Fail if:
- a specialized Red Rocks, dispensary, or mountain package wins without a strong signal

## Case: 420-5 Conflicting signals
URL:
`/?dcc_handoff_id=qa_420_5&source_page=/red-rocks/getting-in-from-denver&requested_lane=private-transfer&resolved_lane=event-transfer&topic=red-rocks-airport-arrival&subtype=420&date=2026-08-14&product_slug=airport-dispensary`

Expected first render:
- highlighted package: `airport-dispensary`
- CTA: `Check dispensary-stop options`
- date prefilled: `2026-08-14`

Expected behavior:
- explicit dispensary intent may override the more general Red Rocks lane
- checkout link preserves `product_slug=airport-dispensary`

Fail if:
- the page renders a contradictory generic CTA
- checkout starts with `airport-red-rocks` despite the explicit dispensary package request
