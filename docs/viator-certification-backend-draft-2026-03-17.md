# Viator API Certification - Back-End Checks Draft

Date: 2026-03-17

This draft is based on the current implementation in this repository. It is written to be accurate, not aspirational. Any booking, hold, amendment, cancellation, exchange-rate, or supplier-cancellation workflow that is not implemented is marked as not implemented.

Recommended positioning when sending this:

- classify the current implementation as `Affiliate API`, website, B2C
- describe it as a search/discovery plus PDP integration with ingestion readiness
- do not imply booking-capable certification unless those flows are actually built and tested first

## General questions

What is your company name?

Your response:
Destination Command Center

Is this a B2B or B2C implementation, or both?

Your response:
B2C

Is this implementation for desktop, mobile, or app?

Your response:
Website implementation for desktop and mobile web.

How many destinations do you support? Which destinations do you exclude, if any, and why?

Your response:
The implementation is designed to support Viator destinations broadly, using the destination taxonomy and search flows. Current live coverage on the site is focused on destinations already mapped into our route and content system. We do not intentionally exclude destinations for policy reasons, but practical coverage depends on destination mapping and content rollout.

How many products do you currently support? If you filter out certain products, what criteria is that based on? Do you plan to add more products after launch?

Your response:
We currently display hundreds of Viator-linked products across supported destination pages. We plan to expand product coverage after launch. At the moment we do not run a fully productionized ingestion-time exclusion policy yet; current display coverage is based on destination relevance, local route mapping, and available cached/live product data.

## Endpoint usage

Please provide this information in the table below for all endpoints that are used:

| Endpoint | Ingestion | Real-time | Additional notes |
|---|---|---|---|
| `/products/modified-since` | Every 15-30 min planned in production after initial full ingest | No | Used for product content ingestion and delta refreshes only. |
| `/products/bulk` | No | No | Not currently used. |
| `/products/{product-code}` | No | On PDP load when live detail hydration is needed | Used for single-product detail hydration only, not for bulk ingestion. |
| `/availability/schedules/modified-since` | Every 15-30 min planned in production after initial full ingest | No | Used for availability/pricing schedule ingestion and delta refreshes only. |
| `/availability/schedules/bulk` | No | No | Not currently used. |
| `/availability/schedules/{product-code}` | No | Not currently active in the customer-facing flow | Client support exists, but it is not currently wired into the live UX. |
| `/products/search` | No | User-driven, typically 1 request per SRP load or filter update | Used for real-time discovery/search only. Pagination is limited to customer-driven result loading. |
| `/search/freetext` | No | No | Not currently used. |
| `/products/tags` | Monthly full refresh, plus manual taxonomy sync runs | No | Used for cached auxiliary taxonomy data. |
| `/products/booking-questions` | No | No | Not currently used. |
| `/locations/bulk` | No | No | Not currently used. |
| `/exchange-rates` | No | No | Not currently used. |
| `/reviews/product` | No bulk ingestion | On-demand cache fill for selected PDPs only | Used only for selected products when review cache is missing or manually refreshed. |
| `/suppliers/search/product-codes` | No | No | Not currently used. |
| `/destinations` | Monthly full refresh, plus manual taxonomy sync runs | No | Used for cached destination taxonomy data. |
| `/attractions/search` | No | No | Not currently used. |
| `/attractions/{attraction-id}` | No | No | Not currently used. |
| `/products/recommendations` | No | No | Not currently used. |
| `/availability/check` | No | No | Not currently implemented yet. |
| `/bookings/hold` | No | No | Not currently implemented. |
| `/bookings/book` | No | No | Not currently implemented. |
| `/bookings/cart/hold` | No | No | Not currently implemented. |
| `/bookings/cart/book` | No | No | Not currently implemented. |
| `/v1/checkoutsessions/{sessionToken}/paymentaccounts` | No | No | Not currently implemented. |
| `/bookings/status` | No | No | Not currently implemented. |
| `/bookings/modified-since` | No | No | Not currently implemented. |
| `/bookings/modified-since/acknowledge` | No | No | Not currently implemented. |
| `/bookings/cancel-reasons` | No | No | Not currently implemented. |
| `/bookings/{booking-reference}/cancel-quote` | No | No | Not currently implemented. |
| `/bookings/{booking-reference}/cancel` | No | No | Not currently implemented. |
| `/amendment/check/{booking-reference}` | No | No | Not currently implemented. |
| `/amendment/quote` | No | No | Not currently implemented. |
| `/amendment/amend/{quote-reference}` | No | No | Not currently implemented. |
| `/v1/taxonomy/destinations` | No | No | Deprecated endpoint not used. |
| `/v1/taxonomy/attractions` | No | No | Deprecated endpoint not used. |
| `/v1/search/attractions` | No | No | Deprecated endpoint not used. |
| `/v1/attraction` | No | No | Deprecated endpoint not used. |
| `/v1/attraction/products` | No | No | Deprecated endpoint not used. |
| `/v1/support/customercare` | No | No | Deprecated endpoint not used. |
| `/v1/product/photos` | No | No | Deprecated endpoint not used. |

## Booking flow

Please share a diagram or a write-up of your booking flow with endpoints used in the booking process.

Your response:
The current implementation is not a booking-capable API flow. The traveler flow today is:

1. User lands on a destination tours page or search results page.
2. User views a product detail page on Destination Command Center.
3. User clicks through to the Viator partner URL to continue live availability review and checkout on the partner side.

At this time we do not have an implemented API booking flow using `/availability/check`, booking hold, booking, payment tokenization, or booking status endpoints.

Please share your logs for a successful booking made in sandbox. Please include all requests and responses from the booking flow (starting from the `/availability/check` request).

Your response:
Not available at this time because the booking API flow is not currently implemented.

## Product search

Do you provide search results to customers that are returned by our search endpoint or do you return search results directly from your database?

Your response:
Both, depending on the surface and data availability. The implementation supports real-time search results from `/products/search` and also uses local cached/catalog fallback data for some destination surfaces.

If you’re using the search endpoint(s), can you confirm that the pagination has been applied in your implementation and you’re not requesting more than 50 products at a time, and making additional requests only when the customer wants to see more products?

Your response:
Yes. The implementation is intended to keep `/products/search` as a real-time discovery endpoint only and to paginate customer-facing results rather than attempt ingestion through search. We do not intend to request more than 50 products per request and additional calls should be customer-driven only.

## Attractions

Do you use attraction data from the API? If so, could you confirm that it’s not indexed?

Your response:
No. Attraction API endpoints are not currently used in this implementation.

## Reviews

Do you display Viator or Tripadvisor reviews from the API? If so, could you confirm that this data is not indexed?

Your response:
Yes, selected product pages may display cached review content from the API. This review content is treated as non-indexable proprietary content and the PDP metadata helper is configured accordingly.

If the reviews or review scoring from the API are used on your site, do you indicate the provider of the reviews (Viator/Tripadvisor)?

Your response:
Yes. We disclose the provider context and use policy text indicating that total review count and overall rating are based on Viator and Tripadvisor reviews.

## Exchange rates

Do you use the Viator exchange rates from the `/exchange-rates` endpoint? If so, can you confirm that the exchange rates are cached and refreshed following the expiry timestamp from the response?

Your response:
No. We are not currently using the `/exchange-rates` endpoint.

## Locations

Do you have access to Google Places API to retrieve details of Google locations using the providerReference from the `/locations/bulk` response?

Your response:
No. We are not currently using `/locations/bulk` in this implementation.

## Recommendations

Do you use the `/products/recommendations` endpoint? If so, could you explain how it's used?

Your response:
No. We do not currently use `/products/recommendations`.

Which product content endpoint do you use to retrieve product content details for products returned in the `/products/recommendations` response? How many products do you request information for when generating a single recommendation?

Your response:
Not applicable, because `/products/recommendations` is not currently used.

Which availability endpoint do you use to retrieve the availability or pricing details for products returned in the `/products/recommendations` response? How many products do you request information for when generating a single recommendation?

Your response:
Not applicable, because `/products/recommendations` is not currently used.

## Real-time availability and pricing

Do you conduct availability and pricing checks in real-time prior to booking? If so, at what stage of the booking flow and what endpoint do you use for this?

Your response:
Not currently implemented. We do not yet use `/availability/check`.

Can you confirm that the `/availability/check` endpoint is used when a specific date and passenger mix (age bands) are selected?

Your response:
Not yet. This flow is not currently implemented.

In case of pricing differences between previously quoted price and the new price from the `/availability/check` response, do you apply the new price?

Your response:
This is not currently applicable because `/availability/check` is not yet implemented.

## Contact details

Do you include customer contact details (email, phone) in the booking request, your own contact details, or both?

Your response:
Not currently applicable because booking requests are not yet implemented.

Is the phone number submitted in the correct format: plus symbol at the beginning, followed by the country code, followed by the remaining numerals?

Your response:
Not currently applicable because booking requests are not yet implemented.

If you are a merchant partner, do you include your company details in the booking request (additionalBookingDetails schema) in order to display this information on vouchers? If not, do you have another way of sharing your contact details with customers?

Your response:
Not applicable. This is not a merchant booking implementation.

Could you please confirm whether you provide 24-hour customer support to your customers?

Your response:
Not applicable to the current implementation because booking support flows are not yet implemented via API.

## Booking questions

Do you support all booking questions? If not, which booking questions are not supported and why?

Your response:
Not currently implemented. Booking-question handling is not yet active.

## Booking hold

Which endpoint is used to make a booking hold: `/bookings/hold` or `/bookings/cart/hold`?

Your response:
Neither. Booking hold is not currently implemented.

At what stage of the booking process are you calling the `/bookings/hold` or the `/bookings/cart/hold` endpoint?

Your response:
Not applicable. Booking hold is not currently implemented.

Do you verify the timestamps returned for both availability and pricing hold? Would another hold be made in case the previous one expires?

Your response:
Not applicable. Booking hold is not currently implemented.

If you’re not using the hold functionality please confirm that you will verify the availability and the price in real-time with the `/availability/check` endpoint right before making the booking to ensure that the pricing hasn’t changed.

Your response:
This is the intended requirement for any future booking-capable implementation, but it is not currently implemented because booking is not yet enabled.

All remaining affiliate payment / iframe hold questions:

Your response:
Not applicable. `/bookings/cart/hold` and payment submission flows are not currently implemented.

## Making a booking

Merchant booking questions:

Your response:
Not applicable. Merchant booking flow is not implemented.

Affiliate API payments / iframe booking questions:

Your response:
Not applicable. Booking and payment token flows are not currently implemented.

Please share a booking example from sandbox where all the requirements listed above are met.

Your response:
Not available at this time because booking is not currently implemented.

If you are an affiliate partner with full + booking API access, please confirm if you’re planning to use your customer’s card details to process payments or your own card details...

Your response:
Not applicable at this time because booking access is not currently implemented.

If you are an affiliate partner with full + booking API access, please confirm if you’re going to use LoyaltyProgramDetails...

Your response:
Not applicable at this time.

## Timeout

Have you implemented a timeout for API services on your end? If so, how long is it?

Your response:
We do not yet have a productionized booking API timeout policy because booking endpoints are not currently implemented. Any future booking-capable implementation will be aligned to the required 120-second minimum.

## Checking booking status

How do you check if the booking has been confirmed?

Your response:
Not currently applicable. `/bookings/status` is not yet implemented.

What’s your process in case the `/bookings/book` or `/bookings/cart/book` endpoint returns an error or the request times out?

Your response:
Not currently applicable because booking endpoints are not implemented yet.

Please confirm that, in the event of an error returned by the `/book` endpoint, you will call the `/status` endpoint...

Your response:
This is not yet implemented because booking is not yet active.

## Vouchers

How are you going to share the voucher with customers?

Your response:
Not applicable in the current implementation because API booking is not yet implemented.

Could you confirm that customers will be provided only with the Viator voucher (unmodified)?

Your response:
If and when API booking is implemented, the Viator voucher would be shared unmodified. This is not currently active.

Secure voucher redemption for restricted bookings:

Your response:
Not applicable at this time.

## Traveler cancellations

Do you use the `/cancel-quote` endpoint every time before the cancellation is processed to verify the refund amount? Can you confirm that you check the `refundAmount` field?

Your response:
No. Cancellation API workflow is not currently implemented.

Please share a log showing that a booking has been successfully canceled using API services.

Your response:
Not available because the cancellation API workflow is not currently implemented.

## Supplier cancellations and amendments

Do you have an automated process for supplier cancellations and amendments with the `/bookings/modified-since` endpoint? If so, could you confirm how frequently you’re making calls to this endpoint?

Your response:
No. This is not currently implemented.

Do you use the `/bookings/modified-since/acknowledge` endpoint to acknowledge...

Your response:
No. This is not currently implemented.

## Traveler-initiated amendments

Have you automated the flow for processing traveler-initiated amendments using the amendment endpoints?

Your response:
No. Amendment endpoints are not currently implemented.

Please confirm that all stages of the amendment process have been implemented in the correct order...

Your response:
Not applicable because amendment flows are not implemented.

Please confirm that the customer will always be informed of any potential pricing changes resulting from the amendment before it is processed.

Your response:
Not applicable because amendment flows are not implemented.

## Manual confirmation type products

Do you support manual confirmation type products?

Your response:
We do not currently support API booking flows for manual confirmation products.

If manual confirmation type products are supported, how often do you verify the booking status of PENDING bookings with the `/bookings/status` endpoint?

Your response:
Not applicable.

If manual confirmation type products are not supported, do you have a logic to filter them out?

Your response:
Not yet as a finalized production rule. If we activate booking-capable flows, we would either filter unsupported manual-confirmation products using `confirmationType` or build the required pending-status handling.

## HTTPS

Does your platform have a valid HTTPS security certificate during all stages of the checkout process?

Your response:
Yes, the website is served over HTTPS.

## PCI DSS compliance

If you are an affiliate partner with full + booking API access, please share PCI DSS Attestation of Compliance (AOC).

Your response:
Not applicable at this time because full + booking API access is not currently implemented in this integration.

## Recommended note before submission

If the current goal is certification for a search/discovery affiliate implementation only, the answers above are honest and consistent with the codebase.

If the goal is full booking certification, this form should not be submitted yet without first implementing and testing:

- `/availability/check`
- booking questions
- hold/book/payment flow
- `/bookings/status`
- cancellations
- amendments if required
- timeout and polling logic
