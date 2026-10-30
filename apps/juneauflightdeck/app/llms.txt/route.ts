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

Product-specific Viator links (such as Coastal Helicopters' Icefield Excursion, product code 6251SHOREXICEWALK) open the exact Viator tour listing, while links labeled "Search on Viator" open search results rather than a specific checkout. Only products expressly marked "Worry-free Shore Excursion" on Viator (tagId 367649) qualify for Viator's back-to-ship protection under Viator Terms of Use Section 20 (https://www.viator.com/support/termsAndConditions). DCC's cruise-timing buffer calculation is an independent planning check and is not itself a back-to-ship guarantee. Published guide prices are not final checkout quotes. Confirm final price and availability in Viator before paying.

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

## Cruise ship planning guides
${ships}

## Support and service information
- [Why book with Juneau Flight Deck](https://juneauflightdeck.com/about)
- [Ask our team](https://juneauflightdeck.com/contact): dispatch@juneauflightdeck.com. Include ship, port date, party size, and confirmed arrival and all-aboard times. For urgent reservation changes, contact the provider on the booking confirmation.
- [Terms](https://juneauflightdeck.com/terms)
- [Privacy](https://juneauflightdeck.com/privacy-policy)
- [Machine description](https://juneauflightdeck.com/agent.json)
- [Canonical DCC truth record](https://www.destinationcommandcenter.com/api/public/truth-feed?id=juneau-flight-deck)
`;
  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
