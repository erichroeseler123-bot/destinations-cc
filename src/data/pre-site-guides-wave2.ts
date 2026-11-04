import { getGoSnoRouteSnapshotDisplayPricing } from "@/lib/dcc/applicability";
import type { PreSiteGuide } from "@/src/data/pre-site-guides";

export const PRE_SITE_GUIDES_WAVE2: PreSiteGuide[] = [
  {
    slug: "can-you-do-two-excursions-in-one-cruise-port-day",
    category: "cruise",
    eyebrow: "Cruise port planning",
    title: "Can you realistically do two excursions in one cruise port day?",
    description: "A practical way to decide whether two activities create a great port day or an itinerary with no recovery room.",
    answer: "Sometimes, but only when the first activity, transfer between activities, and return-to-ship plan all leave real slack. Two excursions should be treated as one connected itinerary with a single ship-clock deadline, not as two separate bookings that happen to fit on paper.",
    matters: ["Actual time off the ship", "Transfer time between activities", "Whether either activity can run late", "Distance back to the pier", "A conservative final return buffer"],
    tradeoffs: [
      { label: "Two scheduled activities", body: "More variety, but delays compound and the second activity inherits every problem from the first." },
      { label: "One anchor plus flexible time", body: "Less packed, but easier to protect and easier to adapt when the day changes." },
      { label: "Two nearby activities", body: "Can work well when both are close together and neither depends on a fragile transfer." },
    ],
    questions: ["How much uncommitted time exists between the two activities?", "What happens if the first activity ends late?", "Is the second activity refundable or movable?", "What is the latest time you are willing to start heading back to the ship?"],
    nextStep: { label: "Put the port day into the group plan", body: "If the itinerary still makes sense after the timing check, add the anchors to the shared cruise plan so everyone sees the same version.", href: "https://cruisepromenade.com" },
  },
  {
    slug: "should-a-cruise-group-split-up-for-different-excursions",
    category: "cruise",
    eyebrow: "Group cruise planning",
    title: "Should a cruise group split up for different excursions?",
    description: "Keep the group flexible without creating confusion about meeting times, port logistics, or who is doing what.",
    answer: "Yes, when people genuinely want different experiences. The key is to coordinate the few shared consequences: who is in each plan, the return-to-ship deadline, the regroup point, and any dinner or activity that everyone must reach afterward.",
    matters: ["Who is participating in each excursion", "Return times", "Regroup location", "Phone connectivity", "Any shared reservation later that day"],
    tradeoffs: [
      { label: "Everyone stays together", body: "Simpler coordination, but some people may spend a port day doing something they did not really want." },
      { label: "Split into smaller groups", body: "Better personal fit, but everyone needs a clear shared version of the important times." },
      { label: "Meet only at the ship", body: "Maximum independence, but the group gives up a shared port-day moment." },
    ],
    questions: ["Which plans actually require everyone?", "Where will the groups regroup?", "What happens if one group runs late?", "Who needs to know about changes?"],
    nextStep: { label: "Coordinate the shared anchors", body: "Cruise Promenade can hold the separate plans and the few shared times without turning the whole cruise into one rigid schedule.", href: "https://cruisepromenade.com" },
  },
  {
    slug: "when-is-it-better-not-to-book-a-cruise-excursion",
    category: "cruise",
    eyebrow: "Cruise port strategy",
    title: "When is it better not to book a cruise excursion?",
    description: "Not every port day needs a ticketed activity. Decide when flexibility is more valuable than another reservation.",
    answer: "Skip a formal excursion when the destination is easy to explore close to the port, the group needs a low-commitment day, or the value of flexibility is higher than the value of a scheduled experience. The decision should still include a return plan and a realistic understanding of the port area.",
    matters: ["How walkable the port area is", "How tired the group is", "Weather", "Whether anything is truly must-do", "How easy it is to improvise locally"],
    tradeoffs: [
      { label: "Book an excursion", body: "You lock in an experience and reduce day-of decision-making, but give up some flexibility." },
      { label: "Explore independently", body: "You can follow the group's energy, but you own the logistics and timing." },
      { label: "Stay aboard", body: "The ship can be quieter and easier to enjoy, but you give up the destination entirely." },
    ],
    questions: ["Is there one experience you would regret missing?", "Can you comfortably explore near the port without a complex transfer?", "Does the group need a recovery day?", "What would make a flexible day feel successful?"],
    nextStep: { label: "Keep the flexible day visible", body: "Use Cruise Promenade to mark the port day as intentionally open while preserving meeting points or group anchors.", href: "https://cruisepromenade.com" },
  },
  {
    slug: "how-does-group-size-change-airport-transportation",
    category: "transportation",
    eyebrow: "Airport transportation",
    title: "How does group size (such as 7 people) change the best airport transportation option?",
    description: "Compare airport transportation by total group movement and ski/luggage volume instead of looking at one passenger at a time.",
    get answer() {
      const vail = getGoSnoRouteSnapshotDisplayPricing({ routeId: "DEN-VAIL" });
      return `As a group reaches 6 to 7+ people, passenger seat count and luggage/ski-bag volume must be evaluated separately. A standard private SUV (Suburban/Yukon XL) caps at 5–6 passengers max (and only 4–5 with ski bags), so a group of 7 people with ski bags cannot fit in a single SUV or 7-seat minivan. For 7 travelers from DEN to a mountain resort like Vail, compare: (1) a private passenger van up to 10 passengers (on GoSno, SUVs cap at 6 pax for ${vail.suvPriceLabel} DEN–Vail while private vans carry up to 10 passengers subject to luggage and ski-gear fit and availability, with ${vail.vanPriceLabel} published on gosno.co/vail and quoteOnly: true on /api/availability; groups of 11+ exceed a single GoSno van); (2) per-seat shared shuttles (e.g., Epic Mountain Express, where published DEN–Vail rates vary by travel date and peak/holiday periods from $59–$129/guest to Vail Transfer Center or $69–$139/guest door-to-door before 20% Epic Pass discount, allowing 2 baggage items including a ski/snowboard bag plus 1 small personal item per guest, best when arrivals are staggered); (3) two AWD/4WD rental SUVs with ski racks (subject to Colorado I-70 Traction Law C.R.S. § 42-4-106 and double overnight resort parking fees); or (4) public transit (RTD A-Line $10.50 + CDOT Bustang West Line $17 to Vail Transportation Center).`;
    },
    verifiedAt: "2026-11-03",
    get assumptionsAndUnknowns() {
      const vail = getGoSnoRouteSnapshotDisplayPricing({ routeId: "DEN-VAIL" });
      return [
        "Unknown: Total count of ski/snowboard bags and large suitcases — 7 passengers with ski bags exceed a 6-passenger SUV and require an up-to-10-passenger van (subject to luggage and ski-gear fit; 11+ passengers exceed a single GoSno van), shared shuttle seats, or two vehicles.",
        "Unknown: Travel date, flight arrival times, and whether all 7 travelers arrive on the same flight (shared shuttle rates vary by travel date and peak/holiday periods).",
        `Unknown: Live van availability and dispatch confirmation — GoSno private vans carry up to 10 passengers subject to luggage and ski-gear fit (${vail.vanPriceLabel} published on gosno.co/vail; quoteOnly: true on /api/availability).`,
      ];
    },
    get citations(): PreSiteGuide["citations"] {
      const vail = getGoSnoRouteSnapshotDisplayPricing({ routeId: "DEN-VAIL" });
      return [
        {
          id: "col-gosno-catalog",
          label: "GoSno Private Mountain Transfer — Vehicle Capacity & Quote-Only Van Rule",
          organization: "GoSno LLC (CO PUC LL-03577)",
          url: "https://gosno.co/vail",
          checkedAt: "2026-11-03",
          claimSupported: `GoSno private SUVs hold up to 6 passengers (${vail.suvPriceLabel} DEN–Vail baseline) while private vans hold up to 10 passengers, subject to luggage and ski-gear fit (${vail.vanPriceLabel} published on gosno.co/vail; quoteOnly: true on /api/availability; 11+ passengers exceed a single GoSno van).`,
        },
        {
          id: "col-epic-shuttle",
          label: "Epic Mountain Express — Official Shuttle Service Rates & Bag Policy",
          organization: "Epic Mountain Express",
          url: "https://www.epicmountainexpress.com/shuttle-rates",
          checkedAt: "2026-11-02",
          claimSupported: "Published DEN–Vail shared shuttle rates vary by travel date and peak/holiday periods ($59–$129/guest to Vail Transfer Center; $69–$139/guest door-to-door), with 2 baggage items (including a ski/snowboard bag) plus 1 small personal item per guest.",
        },
        {
          id: "col-cdot-bustang",
          label: "CDOT Bustang West Line — Denver Union Station to Vail",
          organization: "Colorado Department of Transportation (CDOT)",
          url: "https://www.codot.gov/travel/bustang",
          checkedAt: "2026-10-23",
          claimSupported: "Public motorcoach service from Denver Union Station ($10.50 RTD A-Line from DEN) to Vail Transportation Center ($17 one-way).",
        },
      ];
    },
    matters: ["Number of passengers (7 exceeds a 6-pax SUV; GoSno vans cap at 10 passengers subject to gear fit)", "Luggage & ski-bag volume", "Whether the group lands on the same flight", "Child car-seat or mobility needs", "Number of vehicles required"],
    tradeoffs: [
      { label: "Private up-to-10 pax van", body: "Keeps 7–10 people and ski gear in one door-to-door vehicle, subject to luggage and ski-gear fit and availability (11+ passengers exceed a single GoSno van)." },
      { label: "Shared shuttle (per seat)", body: "Consolidates staggered flight arrivals with a clear 2-baggage-item (including ski bag) + 1 personal item allowance, though per-seat rates vary by travel date ($59–$139/guest) and 7 peak seats can approach a private van." },
      { label: "Two AWD rental SUVs", body: "Provides independent driving, but requires two vehicles for 7 people with ski bags and doubles I-70 winter driving and resort parking costs." },
    ],
    questions: ["Why won't 7 people with ski bags fit in a single standard SUV?", "How many total ski bags and suitcases are coming?", "Does everyone arrive on the same flight?", "Have you confirmed luggage/ski-gear fit and availability for an up-to-10-passenger van?"],
    nextStep: { label: "Check the private-van transfer fit", body: "For Colorado airport and resort trips, continue to GoSno's Vail route page to check an up-to-10-passenger private van (subject to luggage/ski-gear fit) or compare SUV capacity.", href: "https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van" },
  },
  {
    slug: "why-event-transportation-should-start-with-the-return-trip",
    category: "transportation",
    eyebrow: "Event transportation",
    title: "Why should you choose event transportation based on the return trip first?",
    description: "The ride to a crowded event is often the easy half. Compare options by what happens when everyone leaves at once.",
    answer: "Start with the exit because that is where demand, meeting points, tired passengers, road controls, and group separation create the most friction. If the return plan is clear, the outbound ride is usually easier to solve around it.",
    matters: ["Where pickup happens after the event", "Whether the group leaves together", "Expected crowd concentration", "How long people are willing to wait", "Where the night should end"],
    tradeoffs: [
      { label: "Scheduled round trip", body: "More certainty around the exit, with less flexibility if people want to leave at different times." },
      { label: "Rideshare", body: "Flexible before the event, but high-demand exits can make pickup more complicated." },
      { label: "Designated driver", body: "Maximum control, but one person owns parking, driving, and the post-event traffic problem." },
    ],
    questions: ["Where exactly will you meet the return ride?", "Does everyone leave together?", "What is the fallback if phones or rideshare are unreliable?", "Where should everyone be dropped at the end of the night?"],
    nextStep: { label: "Solve the Red Rocks return plan", body: "For Red Rocks concerts, Party at Red Rocks is the specialist transaction site once scheduled transportation fits the group.", href: "https://partyatredrocks.com" },
  },
  {
    slug: "how-ski-gear-changes-colorado-airport-transfer-choice",
    category: "colorado",
    eyebrow: "Colorado mountain travel",
    title: "How should ski bags and luggage change your Denver-to-Vail airport transfer decision?",
    description: "Transportation capacity is not just a passenger count when a winter group (such as 7 people) is carrying ski bags, snowboards, boots, and winter suitcases.",
    get answer() {
      const vail = getGoSnoRouteSnapshotDisplayPricing({ routeId: "DEN-VAIL" });
      return `Plan around physical cargo volume—not just seat belts. A 6-passenger full-size SUV comfortably holds only 4–5 passengers once 6-foot ski/snowboard bags and winter duffels are loaded, and 7 passengers with ski bags physically cannot fit in any single SUV or 7-seat minivan. For 7 people traveling from Denver Airport (DEN) to Vail with ski bags, your viable options are: (1) a private passenger van up to 10 passengers (on GoSno, private SUVs cap at 6 passengers for ${vail.suvPriceLabel} DEN–Vail, while private vans carry up to 10 passengers subject to luggage and ski-gear fit and availability; 11+ passengers exceed a single GoSno van); (2) a per-seat shared shuttle such as Epic Mountain Express (published DEN–Vail rates vary by travel date and peak/holiday periods from $59–$129/guest to Vail Transfer Center or $69–$139/guest door-to-door before 20% Epic Pass discount, allowing 2 baggage items including a ski/snowboard bag plus 1 small personal item per guest); (3) two AWD/4WD rental SUVs with ski racks (which must satisfy Colorado Statutory Traction Law C.R.S. § 42-4-106 Sept 1–May 31 and pay $40–$65+/night per-vehicle Vail Village parking, even though Town of Vail in-town buses are free); or (4) RTD A-Line ($10.50) + CDOT Bustang West Line ($17) motorcoach to Vail Transportation Center.`;
    },
    verifiedAt: "2026-11-03",
    get assumptionsAndUnknowns() {
      const vail = getGoSnoRouteSnapshotDisplayPricing({ routeId: "DEN-VAIL" });
      return [
        "Unknown: Exact number and length of ski/snowboard bags plus checked bags.",
        `Unknown: Travel date, flight arrival times, and live private-van availability (GoSno private vans carry up to 10 passengers subject to luggage and ski-gear fit, with ${vail.vanPriceLabel} published on gosno.co/vail and quoteOnly: true on /api/availability; shared shuttle rates vary by travel date and peak/holiday periods).`,
        "Planning Assumption: I-70 winter traction requirements (C.R.S. § 42-4-106 Code 15, Sept 1–May 31) apply to all rental and private vehicles.",
      ];
    },
    get citations(): PreSiteGuide["citations"] {
      const vail = getGoSnoRouteSnapshotDisplayPricing({ routeId: "DEN-VAIL" });
      return [
        {
          id: "col-gosno-catalog",
          label: "GoSno Private Mountain Transfer — DEN to Vail SUV vs. Van Capacity",
          organization: "GoSno LLC (CO PUC LL-03577)",
          url: "https://gosno.co/vail",
          checkedAt: "2026-11-03",
          claimSupported: `GoSno private SUVs cap at 6 passengers (${vail.suvPriceLabel} DEN–Vail); private vans carry up to 10 passengers, subject to luggage and ski-gear fit (${vail.vanPriceLabel} published on gosno.co/vail; quoteOnly: true on /api/availability; 11+ passengers exceed a single GoSno van).`,
        },
        {
          id: "col-epic-shuttle",
          label: "Epic Mountain Express — Official Shuttle Service Rates & Bag Policy",
          organization: "Epic Mountain Express",
          url: "https://www.epicmountainexpress.com/shuttle-rates",
          checkedAt: "2026-11-02",
          claimSupported: "Published DEN–Vail shared shuttle rates vary by travel date ($59–$129/guest to Vail Transfer Center; $69–$139/guest door-to-door), and each guest is allowed 2 baggage items (including a ski/snowboard bag) plus 1 small personal item.",
        },
        {
          id: "col-cdot-traction",
          label: "CDOT Passenger Vehicle Traction & Chain Laws (C.R.S. § 42-4-106)",
          organization: "Colorado Department of Transportation (CDOT)",
          url: "https://www.codot.gov/travel/winter-driving/tractionlaw",
          checkedAt: "2026-10-23",
          claimSupported: "Mandatory AWD/4WD or M+S/3PMSF winter tires with >= 3/16-inch tread depth on I-70 (MP 133 to MP 259) from Sept 1 to May 31.",
        },
      ];
    },
    matters: ["Number of ski or snowboard bags", "Large checked luggage", "Passenger count (7 people + ski bags cannot fit in a 6-seat SUV; GoSno vans cap at 10 passengers subject to gear fit)", "Vehicle cargo layout (up-to-10 pax van vs. 2 SUVs)", "I-70 Traction Law & Vail parking costs"],
    tradeoffs: [
      { label: "Private up-to-10 pax van", body: "Holds 7–10 passengers plus ski bags in one door-to-door vehicle, subject to luggage and ski-gear fit and availability (11+ passengers exceed a single GoSno van)." },
      { label: "Shared shuttle (per seat)", body: "Explicitly allows 2 baggage items (including a ski bag) + 1 small personal item per guest and works well for staggered flights, though rates vary by travel date ($59–$139/guest) and 7 tickets add up." },
      { label: "Two AWD rental SUVs", body: "You control cargo across two vehicles, but pay for two rentals, two Vail parking spaces ($40–$65+/night each), and winter I-70 driving." },
    ],
    questions: ["How many oversized ski/snowboard bags are coming?", "Would the luggage fit if all 7 seats in a standard vehicle were occupied (no—requires a van or 2 SUVs)?", "Do you need a car in Vail when in-town Vail buses are free?", "Have you confirmed luggage/ski-gear fit and availability for an up-to-10-passenger private van?"],
    nextStep: { label: "Match your group & ski gear to a GoSno Vail transfer", body: "Continue to GoSno's dedicated Vail route page to check an up-to-10-passenger private van (subject to luggage and ski-gear fit; SUVs cap at 6 passengers).", href: "https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van" },
  },
  {
    slug: "wisconsin-dells-adults-trip-vs-family-trip",
    category: "wisconsin",
    eyebrow: "Wisconsin Dells trip design",
    title: "How should an adults trip to Wisconsin Dells differ from a family trip?",
    description: "The Dells does not have to be the same itinerary for every group. Start with who is traveling and what kind of energy they want.",
    answer: "Build an adults trip around pace, dining, nightlife, scenery, relaxation, and a few chosen attractions instead of assuming the trip needs to revolve around family waterpark scheduling. A family trip usually benefits more from predictable meal windows, downtime, and age-compatible activity blocks.",
    matters: ["Who is traveling", "Nightlife interest", "Waterpark priority", "Dining expectations", "Desired pace"],
    tradeoffs: [
      { label: "Adults-focused trip", body: "More room for dining, bars, scenery, and spontaneous plans, with less need to optimize around children's energy." },
      { label: "Family-focused trip", body: "More predictable structure can reduce friction, but requires more attention to ages, meals, and downtime." },
      { label: "Mixed-age group", body: "Works best with a few shared anchors and permission for smaller groups to split." },
    ],
    questions: ["Is the lodging itself part of the entertainment?", "How important are nightlife and dining?", "How much scheduled attraction time does the group actually want?", "Would separate adult and family blocks make the trip easier?"],
    nextStep: { label: "Explore the Dells for your group", body: "Welcome to the Dells can take over once the shape of the trip is clear.", href: "https://welcometothedells.com" },
  },
  {
    slug: "how-to-plan-wisconsin-dells-for-a-large-group",
    category: "wisconsin",
    eyebrow: "Wisconsin Dells groups",
    title: "How should a large group plan Wisconsin Dells without over-scheduling everyone?",
    description: "Coordinate the parts that create consequences for the group and leave the rest flexible.",
    answer: "Use shared anchors instead of a shared minute-by-minute itinerary. Lodging, one or two group meals, transportation-sensitive activities, and any hard reservations need coordination. Most other activities can be optional blocks that people join based on interest and energy.",
    matters: ["Group meals", "Transportation", "Hard reservation times", "Age ranges", "Where people regroup"],
    tradeoffs: [
      { label: "Everyone does everything", body: "Simple on paper, but slow decisions and different energy levels can make the trip frustrating." },
      { label: "Everyone improvises", body: "Maximum freedom, but meals and transportation become harder to coordinate." },
      { label: "Shared anchors", body: "Protects the important group moments while letting smaller groups choose their own activities." },
    ],
    questions: ["Which moments truly need everyone?", "Which bookings have hard capacities or times?", "Where can the group split without creating transportation problems?", "What is the simplest regroup point?"],
    nextStep: { label: "Build the Dells options around the group", body: "Use Welcome to the Dells after the shared anchors are clear to narrow attractions and activities.", href: "https://welcometothedells.com" },
  },
];
