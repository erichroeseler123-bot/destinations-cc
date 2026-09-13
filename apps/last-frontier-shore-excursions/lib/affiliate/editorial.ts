export interface EditorialInsight {
  whyThisFits: string;
  timingRisks: string;
  meetingPointExplanation: string;
  weatherReality: string;
  whoShouldChoose: string[];
  whoShouldAvoid: string[];
  bestBackupOption: string;
  methodology: string;
  sourcesAndTimestamps: { name: string; date: string; url?: string }[];
}

export const PORT_EDITORIAL_INSIGHTS: Record<string, Partial<EditorialInsight>> = {
  "juneau": {
    whyThisFits: "Juneau is the operational capital of Alaska shore excursions, offering the highest density of marine wildlife operators and direct access to the 1,500-square-mile Juneau Icefield.",
    timingRisks: "The primary timing bottleneck is AJ Dock, located 1 mile south of downtown. If your ship docks at AJ Dock, you must factor in a 15-20 minute continuous port shuttle ride each way to reach the Mount Roberts Tramway departure plaza.",
    meetingPointExplanation: "Over 85% of independent Juneau shore excursions stage departures from the parking lot plaza beneath the Mount Roberts Tramway, located steps from Franklin Dock and 7 minutes walk from Marine Dock.",
    weatherReality: "Southeast Alaska is a temperate rainforest with over 60 inches of annual precipitation. Rain does not stop marine wildlife or ground excursions; however, low cloud ceilings frequently ground helicopter and floatplane operations over the icefield.",
    bestBackupOption: "If alpine flights cancel due to cloud ceiling, pivot immediately to a ground-based Mendenhall Glacier express shuttle or a downtown Juneau whale watching safari.",
    methodology: "Every recommended excursion is evaluated against our Last Frontier 45-Minute Planning Standard: Tour end time + transfer buffer + 45 minutes must be earlier than your cruise ship's scheduled all-aboard time.",
    sourcesAndTimestamps: [
      { name: "City & Borough of Juneau Docks and Harbors", date: "2026-05-01" },
      { name: "U.S. Forest Service Tongass National Forest", date: "2026-04-15" },
      { name: "Viator & GetYourGuide Editorial Partner Research", date: "2026-09-13" },
    ],
  },
  "skagway": {
    whyThisFits: "Skagway's compact grid is custom-built for port day efficiency. The White Pass & Yukon Route railway provides direct dockside boarding at the Railroad Dock, eliminating downtown transfer times.",
    timingRisks: "Klondike Highway tours crossing into Canada (Fraser, Carcross, or Whitehorse) require passing through Canada Border Services Agency (CBSA) and U.S. Customs. Long vehicle queues can delay return times by 20–45 minutes during peak port days.",
    meetingPointExplanation: "Ships berthed at Railroad Dock have direct dockside train boarding. Ships at Ore Dock and Broadway Dock have a short 5- to 10-minute flat walk directly into the historic Broadway district.",
    weatherReality: "Skagway lies in the rain shadow of the Coast Mountains, receiving only 26 inches of rain annually. However, the 2,865-foot White Pass Summit frequently experiences dense mountain fog, high winds, and rapid temperature drops.",
    bestBackupOption: "If White Pass Summit visibility drops to zero, opt for a lower-elevation Klondike Gold Rush historic walking tour, streetcar tour, or a scenic drive staying below the cloud ceiling.",
    methodology: "We calculate border clearance buffers and dockside track availability to ensure all rail and highway tours return travelers safely with at least 45 minutes of pier margin.",
    sourcesAndTimestamps: [
      { name: "Municipality of Skagway Port Department", date: "2026-05-01" },
      { name: "White Pass & Yukon Route Railway Operations", date: "2026-04-10" },
      { name: "Viator & GetYourGuide Editorial Partner Research", date: "2026-09-13" },
    ],
  },
  "ketchikan": {
    whyThisFits: "Known as Alaska's 'First City,' Ketchikan offers direct waterfront access to Misty Fjords National Monument, world-renowned totem pole parks, and rich coastal salmon streams.",
    timingRisks: "Ships docking at Ward Cove Mill (7 miles north of town) require a complimentary 20–30 minute motorcoach shuttle into downtown Ketchikan. Travelers docked at Ward Cove must add at least 60–75 minutes of total transit buffer.",
    meetingPointExplanation: "Downtown Berths 1, 2, 3, and 4 drop travelers directly onto the Ketchikan boardwalk promenade near the Visitors Bureau and Creek Street. Ward Cove passengers disembark at the mill and take the shuttle to the downtown transit hub.",
    weatherReality: "With over 150 inches of annual rain, precipitation is very frequent. Rain gear is essential, but rain rarely cancels boat tours. Low maritime clouds over Behm Canal can delay or reroute Misty Fjords floatplane flights.",
    bestBackupOption: "If floatplanes are grounded by cloud cover, switch to a high-speed catamaran cruise into Misty Fjords or visit Saxman Native Village and Totem Bight State Historical Park.",
    methodology: "Dock-specific routing logic differentiates downtown berths from Ward Cove shuttles to support disciplined compliance with the 45-minute return buffer.",
    sourcesAndTimestamps: [
      { name: "City of Ketchikan Port Operations", date: "2026-05-01" },
      { name: "U.S. Forest Service Misty Fjords National Monument", date: "2026-04-20" },
      { name: "Viator & GetYourGuide Editorial Partner Research", date: "2026-09-13" },
    ],
  },
  "sitka": {
    whyThisFits: "Situated on the outer coast of Baranof Island, Sitka combines deep Russian-American history with the most productive sea otter kelp beds in Southeast Alaska.",
    timingRisks: "Large cruise ships berth at the Sitka Sound Cruise Terminal (Old Sitka), located 5 miles north of town. Complimentary shuttle coaches run continuously every 10–15 minutes, but return lines can peak 60 minutes before all-aboard.",
    meetingPointExplanation: "Old Sitka Terminal features a private tour dock directly alongside the cruise berths for marine wildlife tours. Downtown cultural tours depart from Harrigan Centennial Hall in town.",
    weatherReality: "Sitka faces the open Pacific Ocean, bringing frequent maritime squalls and swells. Protected inside passages like Middle Channel remain calm, while outer coastal boat trips can be choppy.",
    bestBackupOption: "If outer sound water conditions are rough, explore the Alaska Raptor Center, Sitka National Historical Park totem loop, and the Sheldon Jackson Museum in town.",
    methodology: "We track terminal shuttle queue intervals and boat dock departure points to protect your return gangway clearance.",
    sourcesAndTimestamps: [
      { name: "City and Borough of Sitka Harbors", date: "2026-05-01" },
      { name: "Sitka Sound Cruise Terminal Operations", date: "2026-04-18" },
      { name: "Viator & GetYourGuide Editorial Partner Research", date: "2026-09-13" },
    ],
  },
  "icy-strait-point": {
    whyThisFits: "Icy Strait Point (Hoonah) is the only privately owned, Native-operated cruise destination in Alaska, situated on Chichagof Island adjacent to Point Adolphus—Alaska's densest humpback feeding channel.",
    timingRisks: "ISP is very compact with flat boardwalks and the Transporter Gondola. Timing risks are minimal, though boat tours departing Hoonah City Harbor require a short 10-minute van transfer.",
    meetingPointExplanation: "Most excursions depart directly from the Icy Strait Point Excursion Hub adjacent to the Adventure Dock and Cannery Complex, accessible via the free Transporter Gondola from the Wilderness Dock.",
    weatherReality: "Chichagof Island experiences typical maritime rain and fog. Whale watching boats operate in nearly all conditions; heavy swells in Icy Strait are infrequent during summer months.",
    bestBackupOption: "If an offshore whale tour cancels, book a coastal bear search in the Spasski River Valley or experience the Cannery Museum and Native Tlingit heritage performances.",
    methodology: "Our planning standard accounts for gondola transit intervals between docks to ensure effortless ship return.",
    sourcesAndTimestamps: [
      { name: "Huna Totem Corporation / Icy Strait Point Port Operations", date: "2026-05-01" },
      { name: "Alaska Department of Fish and Game (ADFG)", date: "2026-04-12" },
      { name: "Viator & GetYourGuide Editorial Partner Research", date: "2026-09-13" },
    ],
  },
};

export function getEditorialInsight(portSlug: string, activitySlug: string): EditorialInsight {
  const base = PORT_EDITORIAL_INSIGHTS[portSlug] || PORT_EDITORIAL_INSIGHTS["juneau"];

  // Tailored audience recommendations based on activity type
  const isAviation = activitySlug.includes("flight") || activitySlug.includes("heli") || activitySlug.includes("seaplane");
  const isWater = activitySlug.includes("whale") || activitySlug.includes("boat") || activitySlug.includes("catamaran") || activitySlug.includes("kayak");
  const isRail = activitySlug.includes("rail") || activitySlug.includes("train");

  const whoShouldChoose = isAviation
    ? [
        "Travelers seeking bucket-list aerial views of remote glaciers and alpine icefalls",
        "Photographers wanting unobstructed perspective on vast wilderness terrain",
        "Visitors with flexible schedules who have a low-elevation backup tour in mind",
      ]
    : isWater
    ? [
        "Wildlife enthusiasts and birders looking for high-probability marine wildlife encounters",
        "Multi-generational families wanting heated indoor cabins with outdoor viewing decks",
        "Cruisers who prefer rain-safe tours that operate regardless of precipitation",
      ]
    : isRail
    ? [
        "History buffs fascinated by the Klondike Gold Rush and 1898 engineering feats",
        "Cruisers wanting relaxed, seated sightseeing with direct dockside train boarding",
        "Travelers of all mobility levels, including seniors and young children",
      ]
    : [
        "Cruisers looking to immerse themselves in local Alaska Native culture and history",
        "Travelers seeking relaxed pacing and accessible walking paths",
        "Budget-conscious visitors wanting high port-day value without aviation costs",
      ];

  const whoShouldAvoid = isAviation
    ? [
        "Travelers with severe vertigo, fear of flying, or strict budget limitations",
        "Cruisers with port windows under 4 hours who cannot afford weather delay margins",
        "Guests unable to step up into small aircraft or walk on uneven glacier ice",
      ]
    : isWater
    ? [
        "Individuals prone to acute motion sickness on open water (though Inside Passage waters are generally protected)",
        "Cruisers wanting rigorous hiking or strenuous backcountry workouts",
      ]
    : isRail
    ? [
        "Travelers wanting active physical hiking or wildlife encounters",
        "Those seeking fast-paced exploration rather than a gentle 2.5-hour seated ride",
      ]
    : [
        "Visitors looking for extreme backcountry adrenaline or glacier hiking",
      ];

  return {
    whyThisFits: base.whyThisFits || "Premier Alaska cruise excursion matching port strengths.",
    timingRisks: base.timingRisks || "Factor in dock traffic and gangway clearance before tour departure.",
    meetingPointExplanation: base.meetingPointExplanation || "Meeting points are coordinated near cruise docks.",
    weatherReality: base.weatherReality || "Rain is common in Southeast Alaska; dress in waterproof layers.",
    whoShouldChoose,
    whoShouldAvoid,
    bestBackupOption: base.bestBackupOption || "Ground-based historic walking tour or museum.",
    methodology: base.methodology || "Every tour evaluated against our Last Frontier 45-Minute Planning Standard.",
    sourcesAndTimestamps: base.sourcesAndTimestamps || [
      { name: "Last Frontier Shore Excursions Editorial Board", date: "2026-09-13" },
    ],
  };
}
