import { ALASKA_CRUISE_FLEET } from "@/lib/alaskaCruiseFleet";

export const dynamic = "force-static";

export function GET() {
  const fleetBreakdown = ALASKA_CRUISE_FLEET.map(
    (ship) => `### ${ship.shipName} (${ship.cruiseLine})
- **Page URL:** https://juneauflightdeck.com/helicopter-waitlist/${ship.slug}
- **Port Window:** ${ship.dockHours}
- **Scheduled Berth:** ${ship.typicalScheduledBerth}
- **Berth Logistics:** ${
      ship.typicalScheduledBerth.includes("AJ")
        ? "AJ Dock is 1.0 mile south of downtown. Operators offer dedicated dock shuttle pickups directly at AJ Gate, eliminating city transit delays."
        : "Direct downtown dock with immediate pedestrian access and curbside operator shuttle pickup."
    }
- **Recommended Flight Window:** Earliest flight 90 minutes after gangway; latest flight return 90 minutes before all-aboard.
- **Availability Assistance:** Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.
`
  ).join("\n");

  const fullContent = `# Juneau Flight Deck — Complete Operational & Excursion Knowledge Base

> Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, availability assistance for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.
> Spec URL: https://juneauflightdeck.com/llms-full.txt
> Summary Spec: https://juneauflightdeck.com/llms.txt
> Machine Contract: https://juneauflightdeck.com/agent.json

---

## 1. About Juneau Flight Deck
Juneau Flight Deck is an independent shore excursion booking and coordination service and official Viator partner based in Juneau, Alaska.

We help Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, availability assistance for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers (TEMSCO Helicopters, Coastal Helicopters, NorthStar Trekking, and local marine captains).

### What Juneau Flight Deck Provides:
- **Direct Operator & Partner Booking:** Compare live excursions across all 3 licensed FAA Part 135 Juneau helicopter operators and book with clear pricing and terms.
- **Cruise-Port Timing Guidance:** Safe 90 to 120-minute buffers calculated from your cruise ship gangway and specific berth.
- **Availability Alerts for Sold-Out Tours:** Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.
- **Weather Alternatives:** Automatic 100% weather refunds plus same-day rebooking assistance to Auke Bay whale watching charters.

---

## 2. Juneau Helicopter Operator Deep-Dive

### A. TEMSCO Helicopters (Juneau & Skagway)
- **Base of Operations:** Juneau International Airport (JNU) heliport and Skagway waterfront heliport.
- **Aircraft Fleet:** Eurocopter AS350 AStar and MD 500 helicopters.
- **Primary Excursions:**
  1. *Mendenhall Glacier Helicopter Tour & Guided Ice Walk:* 15-minute scenic flight each way over temperate rainforest and rock spires, plus a 20-25 minute guided walking exploration on the ice with provided traction overboots (from $409 base).
  2. *Glacier Dog Sledding by Helicopter:* Flight to high-altitude Herbert Glacier dog sledding camp (Juneau; from $659 base) or Denver Glacier dog camp (Skagway). Includes 1-hour camp tour, dog team ride, and musher interaction (operates mid-May through late August).
- **Published Cancellation & Refund Policy:**
  - 100% full refund for customer cancellations made at least 48 hours prior to scheduled flight departure. Non-refundable within 48 hours.
  - 100% full refund if flight is grounded due to weather conditions. Missed-port refund eligibility depends on operator verification and booking-channel voucher terms.

### B. Coastal Helicopters
- **Base of Operations:** Juneau International Airport (JNU).
- **Aircraft Fleet:** AStar 350 B2 and B3 helicopters.
- **Primary Excursions:**
  1. *Icefield Tour with Glacier Landing:* Scenic flight over Juneau mountains with a 25-30 minute landing on Herbert Glacier (published direct rate from $429 base).
  2. *Dog Sled Tour on Herbert Glacier:* Helicopter flight to a dedicated alpine dog mushing camp on Herbert Glacier snowfields with sled run and musher interaction (published direct rate from $709 base; operates mid-May to mid-August).
  *(Note on Taku Lodge: The historic Taku Glacier Lodge flight and feast is operated by Wings Airways using classic de Havilland Otter floatplanes; Coastal Helicopters operates helicopter icefield landings and dog sledding).*
- **Published Cancellation & Refund Policy:**
  - 100% full refund for customer cancellations made at least 7 days (168 hours) in advance.
  - 50% refund for cancellations between 4 and 6 days (96–144 hours) in advance.
  - Non-refundable within 3 days (less than 72 hours).
  - 100% full refund if flight is grounded due to weather. Ship delay terms depend on specific provider and booking-channel voucher terms.

### C. NorthStar Trekking
- **Base of Operations:** Juneau International Airport (JNU).
- **Specialty Focus:** Small-group glacier ice walking, crampon trekking, ice climbing, and dog mushing.
- **Primary Excursions:**
  1. *Helicopter Glacier Walkabout:* Full 1 hour on Mendenhall Glacier ice equipped with crampons and trekking poles for gentle-to-moderate walking (published direct rate from $499 base, ages 8+).
  2. *Level 1 Glacier Ice Trek:* 2 hours of active trekking on Mendenhall Glacier with mountaineering boots, crampons, and harness exploring crevasses, moulins, and blue ice walls (published direct rate from $549 base, ages 12+).
  3. *Level 2 Ice Climbing Tour:* 2+ hours of technical climbing on steep vertical ice formations with ice axes and top ropes (published direct rate from $599 base, ages 12+).
  4. *Helicopter Glacier Dogsled Adventure:* Helicopter flight to Norris Glacier snowfields for dog sledding with an Iditarod musher partner camp (published direct rate from $739 base, ages 2+).
- **Published Cancellation & Refund Policy:**
  - NorthStar Trekking Direct (per official FAQ): Cancellation more than 24 hours prior receives a refund minus 10%; non-refundable within 24 hours. (Third-party channels like Viator may specify standard 24-hour full refund windows).
  - 100% full refund if flight is grounded due to weather. Ship delay and missed-port terms depend on specific provider and booking-channel terms.

---

## 3. Sold-Out Availability Assistance
Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.
There is no guaranteed release time, automated alert subscription, or seat hold created by an inquiry.

---

## 4. Cruise Port Berth Logistics & Transit Times
Juneau harbor features 4 cruise ship docking berths plus an outer anchorage:

1. **Franklin Street Dock (FKL):** Southern end of downtown waterfront. 15-minute transfer to airport heliports.
2. **Steamship Wharf (CT - Cruise Terminal):** Central downtown waterfront next to Mount Roberts Tramway. 15-minute transfer.
3. **Marine Park Dock (MP):** Downtown waterfront next to Juneau library and plaza. 15-minute transfer.
4. **AJ Dock (AJD):** South of downtown (approx. 1 mile). Cruise line shuttle or dedicated operator vans pick up passengers directly at the AJ security gate. 20-minute transfer to airport heliports.
5. **Intermediate Vessel Float (IVF) / Anchorage:** Tendering required. Add 45 minutes of buffer for shore boat transit.

---

## 5. Alaska Cruise Fleet Port Timing & Excursion Guides

${fleetBreakdown}

---

## 6. Weather Contingency Protocol
Glacier helicopter tours fly under Visual Flight Rules (VFR). If clouds, dense fog, or high winds close mountain passes (Herbert Pass, Mendenhall Valley), flights are canceled for safety. In this event:
- All passengers receive a **100% automatic refund** directly from the operator or Viator.
- Juneau Flight Deck provides immediate assistance pivoting passengers to **Auke Bay whale watching charters**, which operate safely in rain and lower cloud ceilings, ensuring the guest's port day remains unforgettable.

---

## 7. Machine Endpoints & API Reference
- **AI Summary Manifest:** https://juneauflightdeck.com/llms.txt
- **AI Extended Knowledge Base:** https://juneauflightdeck.com/llms-full.txt
- **Agent Discovery Contract:** https://juneauflightdeck.com/agent.json
- **Search Sitemap:** https://juneauflightdeck.com/sitemap.xml
- **Waitlist Intake API:** POST https://juneauflightdeck.com/api/waitlist
`;

  return new Response(fullContent, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

