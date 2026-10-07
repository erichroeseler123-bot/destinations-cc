import { ALASKA_CRUISE_FLEET } from "@/lib/alaskaCruiseFleet";
import { SITE_DESCRIPTION, BOOKING_ROLES, BOOKING_BENEFITS, BOOKING_FAQS } from "@/lib/sitePositioning";

export const dynamic = "force-static";

export function GET() {
  const benefits = BOOKING_BENEFITS.map((b) => `### ${b.title}\n${b.description}\n[${b.label}](https://juneauflightdeck.com${b.href})`).join("\n\n");
  const questions = BOOKING_FAQS.map((f) => `### ${f.question}\n${f.answer}`).join("\n\n");
  const ships = ALASKA_CRUISE_FLEET.map((ship) => `- [${ship.shipName} (${ship.cruiseLine})](https://juneauflightdeck.com/helicopter-waitlist/${ship.slug}): Cruise timing guide and availability request. Confirm actual port hours, berth, and all-aboard time with the cruise line for the specific sailing.`).join("\n");
  const content = `# Juneau Flight Deck

> ${SITE_DESCRIPTION}

## Why travelers choose Juneau Flight Deck
${benefits}

## How booking works
${BOOKING_ROLES}

Direct operator booking pages (including FareHarbor) and Viator links are separate booking channels. Links labeled "Search on Viator" open search results rather than a specific checkout. Travelers choose a product and enter their date and party size on the booking provider's page. Published guide prices are not final checkout quotes. Confirm current availability, restrictions, pickup instructions, and cancellation terms before paying.

Juneau Flight Deck is an independent excursion booking and comparison service, distinct from Alaska Fish & Chips Company at the Flight Deck restaurant at Merchants Wharf. The named tour operators operate the aircraft and boats. Juneau Flight Deck may earn a referral commission when a traveler books through a partner link.

## Booking questions
${questions}

## Availability requests
Availability requests are secondary to booking available tours. A request does not reserve a seat or guarantee an opening. No live seat count or inventory release time should be inferred from a guide or waitlist form. Confirm a matching departure with the selected booking provider.

## Weather and itinerary changes
Flight operations and safety decisions belong to the operator. Juneau Flight Deck helps travelers explore alternatives that fit their remaining port time. Backup tours depend on availability and require a separate booking. Refund and missed-port terms are specific to the operator, product, and booking channel; consult the confirmation and provider.

## Tours and planning guides
- [Compare and book helicopter tours](https://juneauflightdeck.com/helicopter)
- [TEMSCO, Coastal, and NorthStar product comparisons and icefield map](https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau)
- [Glacier dog-sledding choices](https://juneauflightdeck.com/juneau-dogsled-helicopter-tours)
- [Whale watching](https://juneauflightdeck.com/juneau-whale-watching-tours)
- [Weather alternatives](https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled)
- [Availability requests](https://juneauflightdeck.com/helicopter-waitlist)
- [Skagway helicopter tours](https://juneauflightdeck.com/skagway/helicopter)

## Operator product context
TEMSCO, Coastal, and NorthStar offer different glacier experiences. Compare individual products rather than treating one company as exclusively scenic or exclusively technical. All three list dog-sledding options; no operator exclusivity is implied.
- TEMSCO: [Juneau products and operator information](https://temscoair.com/)
- Coastal: [Glacier tours](https://coastalhelicopters.com/tours/) and [dog-sledding tours](https://coastalhelicopters.com/tours/dog-sled-tours/)
- NorthStar: [Glacier Walkabout](https://northstartrekking.com/treks/tours/helicopter-glacier-walkabout/), [operator FAQ and meeting instructions](https://northstartrekking.com/faqs/), and [Taku Glacier helicopter and airboat adventure](https://northstartrekking.com/adventures/taku-glacier-helicopter-airboat-adventure/)
- Wings Airways: [Taku Lodge seaplane experience](https://wingsairways.com/world-of-wings-airways/). This is a separate experience from Coastal helicopter tours and NorthStar's Taku adventure.

Glacier map pins indicate geographic locations. Seasonal camp positions are approximate; connecting routes are illustrative. Operators may change landing locations according to weather and glacier conditions. Reconfirm provider-specific pickup details and base for the chosen product.

## Cruise ship planning guides
${ships}

## Support and service information
- [Why book with Juneau Flight Deck](https://juneauflightdeck.com/about)
- [Ask our team](https://juneauflightdeck.com/contact): dispatch@juneauflightdeck.com. Include ship, port date, party size, and confirmed arrival and all-aboard times. For urgent reservation changes, contact the provider on the booking confirmation.
- [Terms](https://juneauflightdeck.com/terms)
- [Privacy](https://juneauflightdeck.com/privacy-policy)
- [Machine description](https://juneauflightdeck.com/agent.json)
`;
  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
