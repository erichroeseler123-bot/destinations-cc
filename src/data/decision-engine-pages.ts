import {
  DecisionEnginePageSchema,
  type DecisionEnginePage,
} from "@/lib/dcc/decision/schema";

const pages: DecisionEnginePage[] = [
  {
    id: "venue-red-rocks-amphitheatre",
    canonicalPath: "/venues/red-rocks-amphitheatre",
    nodeType: "venue",
    title: "Red Rocks Amphitheatre Ultimate Guide + Decision Engine",
    hero: {
      eyebrow: "DCC Venue Decision Engine",
      summary:
        "Authority-first planning for Red Rocks: timing, transfer friction, crowd behavior, nearby routing, and clear next actions after the decision is solved.",
      imageHint: "Red Rocks stage with sandstone formations and Denver skyline distance",
      quickLinks: [
        { label: "Venue node", href: "/venues/red-rocks-amphitheatre" },
        { label: "Denver city node", href: "/denver" },
        { label: "Route guide", href: "/routes/denver-red-rocks" },
      ],
    },
    quickFacts: [
      { label: "Location", value: "Morrison, Colorado" },
      { label: "Capacity", value: "9,500+ seats" },
      { label: "Best arrival", value: "60 to 90 minutes before showtime" },
      { label: "Distance from Denver", value: "About 25 to 40 minutes by car" },
      { label: "Weather risk", value: "Rapid temperature drops after sunset" },
      { label: "Primary friction", value: "Post-show pickup congestion" },
    ],
    whyThisPlaceMatters:
      "Red Rocks is not just a venue page intent. Travelers need one page that resolves weather risk, seat strategy, transfer timing, and neighborhood after-show flow before they book anything.",
    whenToGo: {
      bestMonths: "May through October for stable concert-season conditions",
      bestDays: "Weeknight shows often have cleaner ingress and lower post-show surge",
      bestWeather: "Dry evenings with low wind and mild sunset temperature",
      crowdPatterns:
        "Ingress builds quickly in the 90 minutes pre-show, and rideshare compression spikes immediately after encore.",
      seasonalDifferences:
        "Winter and shoulder-season events require stronger cold/wind prep and more buffer for road conditions.",
    },
    howToGetThere: [
      "Drive from Denver and park early if you want shorter uphill walking load.",
      "Use dedicated shuttle options for cleaner post-show flow and less pickup chaos.",
      "Rideshare works best before showtime; post-show pickup zones are the main failure point.",
      "Group transport is often higher certainty than individual app-based exits.",
    ],
    whatToDo: [
      {
        title: "Concert night planning",
        description:
          "Prioritize seat area, weather prep, and exit strategy before locking dinner and after-party timing.",
        href: "/venues/red-rocks-amphitheatre",
      },
      {
        title: "Sunrise and daytime access",
        description:
          "Use early blocks for lower crowd density, photography windows, and trail-adjacent movement.",
      },
      {
        title: "Route-first night stack",
        description:
          "Build one pre-show anchor and one post-show fallback, not three parallel commitments.",
        href: "/routes/denver-red-rocks",
      },
    ],
    nearbyThings: [
      { label: "Denver city planning hub", href: "/cities/denver" },
      { label: "Colorado region node", href: "/regions/colorado" },
      { label: "Road-trip route segment", href: "/route-segment/las-vegas-to-hoover-dam" },
    ],
    insiderTips: [
      "Bring a light shell even in summer; temperature and wind shift quickly after sunset.",
      "Upper rows can offer better skyline context for photos, not just lower-bowl proximity.",
      "Leaving 10 to 15 minutes before final congestion can materially reduce exit delay.",
    ],
    commonMistakes: [
      {
        mistake: "Arriving too close to doors and underestimating entry friction.",
        avoid: "Target on-site arrival at least 60 to 90 minutes early during high-demand nights.",
      },
      {
        mistake: "Planning a strict post-show reservation with no transfer buffer.",
        avoid: "Set a fallback location and assume slower-than-ideal pickup windows.",
      },
      {
        mistake: "Treating weather prep as optional because of warm daytime temperatures.",
        avoid: "Pack for nighttime wind and temp drop regardless of afternoon conditions.",
      },
    ],
    localIntel: [
      "High-demand nights compress rideshare capacity immediately after final set.",
      "Pre-show congestion often starts earlier than first-time visitors expect on sold-out dates.",
      "The strongest experience outcomes come from fewer anchors with better transfer realism.",
    ],
    relatedExperiences: [
      { label: "Denver route node", href: "/cities/denver", graphLinked: true },
      { label: "Mighty Argo guide", href: "/mighty-argo", graphLinked: false },
      { label: "Colorado authority surface", href: "/regions/colorado", graphLinked: true },
    ],
    authorityActions: [
      { label: "Plan the Denver ↔ Red Rocks route", href: "/routes/denver-red-rocks", kind: "internal" },
      { label: "Open Red Rocks venue node", href: "/venues/red-rocks-amphitheatre", kind: "internal" },
      { label: "Explore Denver city intelligence", href: "/cities/denver", kind: "internal" },
    ],
    executionCtas: [
      { label: "View Denver tours", href: "/tours?city=denver", kind: "internal" },
    ],
    faq: [
      {
        q: "How early should I arrive at Red Rocks for a major show?",
        a: "For high-demand nights, arriving 60 to 90 minutes before showtime is usually the safest baseline for parking, entry, and seat-settle time.",
      },
      {
        q: "Is Red Rocks still worth visiting without a concert ticket?",
        a: "Yes. Daytime visits can deliver scenic and trail value, but live-show nights are the primary demand mode where logistics matter most.",
      },
      {
        q: "What is the biggest planning mistake for Red Rocks nights?",
        a: "The most common failure is stacking too many time-sensitive commitments after the show without accounting for pickup and exit compression.",
      },
      {
        q: "What should I lock first for Red Rocks planning?",
        a: "Lock your ingress and egress plan first, then place pre-show and post-show activities around that route certainty.",
      },
    ],
    freshness: {
      updatedAt: "2026-03-13",
      refreshIntervalDays: 21,
      evidence: [
        {
          title: "Venue demand + event lane signal",
          source: "DCC venue and event routing",
          href: "https://destinationcommandcenter.com/venues/red-rocks-amphitheatre",
          note: "Event-driven route guidance updated against current live-event discovery lanes.",
        },
      ],
    },
  },
  {
    id: "port-juneau",
    canonicalPath: "/ports/juneau",
    nodeType: "port",
    title: "Juneau Cruise Port Ultimate Guide + Decision Engine",
    hero: {
      eyebrow: "DCC Port Decision Engine",
      summary:
        "Juneau cruise-call planning with excursion fit, timing windows, transfer drag, weather volatility, and high-confidence shore-day sequencing.",
      imageHint: "Juneau cruise ships with mountain backdrop and glacier excursion context",
      quickLinks: [
        { label: "Juneau port node", href: "/ports/juneau" },
        { label: "Alaska layer", href: "/alaska" },
        { label: "Shore excursions guide", href: "/cruises/shore-excursions" },
      ],
    },
    quickFacts: [
      { label: "Port type", value: "Alaska cruise port with high excursion dependency" },
      { label: "Primary intent", value: "Glacier and wildlife excursions" },
      { label: "Typical window", value: "4 to 7 hours shore time" },
      { label: "Weather risk", value: "Marine and rain variability can change product quality" },
      { label: "Transfer reality", value: "Buffer needed for return stacks near all-aboard" },
      { label: "Best action", value: "Choose one primary excursion lane" },
    ],
    whyThisPlaceMatters:
      "Juneau decisions fail when travelers over-stack glacier, wildlife, and downtown goals into one short call. This page resolves tradeoffs before booking.",
    whenToGo: {
      bestMonths: "Peak Alaska cruise windows run late spring through early fall",
      bestDays: "Calls with fewer overlapping ships generally reduce transfer friction",
      bestWeather: "Lower wind and stable visibility days improve excursion quality",
      crowdPatterns:
        "Popular call windows can compress excursion check-in and late return movement.",
      seasonalDifferences:
        "Early and late season may carry colder, wetter conditions and greater uncertainty on water-based products.",
    },
    howToGetThere: [
      "Start with the port authority page and lock one excursion lane first.",
      "Use operator pickup windows conservatively and avoid tight handoff chains.",
      "Leave explicit return buffer for weather drift and queue variability.",
      "Prioritize one high-value excursion over several short low-confidence stops.",
    ],
    whatToDo: [
      {
        title: "Glacier-focused excursion blocks",
        description:
          "Prioritize glacier and scenic products when weather and visibility support high return value.",
        href: "/cruises/shore-excursions",
      },
      {
        title: "Wildlife and marine options",
        description:
          "Choose whale and marine lanes only when forecast and vessel timing create a reliable window.",
      },
      {
        title: "Low-friction fallback planning",
        description:
          "When marine conditions degrade, shift to lower transfer-risk in-town or short-range options.",
        href: "/alaska",
      },
    ],
    nearbyThings: [
      { label: "Alaska authority layer", href: "/alaska" },
      { label: "Cruise explorer", href: "/cruises" },
      { label: "Tendering guide", href: "/cruises/tendering" },
    ],
    insiderTips: [
      "Weather volatility matters more than static review scores for Juneau excursion quality.",
      "Avoid stacking multiple transport transitions in one call window.",
      "Early, simpler routing usually outperforms ambitious multi-stop plans.",
    ],
    commonMistakes: [
      {
        mistake: "Trying to fit glacier, whale watching, and downtown shopping into one call.",
        avoid: "Pick a primary lane and one fallback, then protect return-time certainty.",
      },
      {
        mistake: "Ignoring weather-driven quality differences between excursion categories.",
        avoid: "Validate day-of conditions and keep a backup lane with lower exposure.",
      },
      {
        mistake: "Leaving no margin before all-aboard.",
        avoid: "Use conservative return buffers regardless of advertised transfer durations.",
      },
    ],
    localIntel: [
      "Call-day quality is highly sensitive to visibility and marine conditions.",
      "Excursion throughput can degrade quickly when multiple ship schedules overlap.",
      "Port-day success improves when travelers optimize for certainty, not checkbox coverage.",
    ],
    relatedExperiences: [
      { label: "Juneau cruise schedule page", href: "/cruises/port/juneau-alaska", graphLinked: true },
      { label: "Alaska destination hub", href: "/alaska", graphLinked: true },
      { label: "Cruise shore-excursions authority guide", href: "/cruises/shore-excursions", graphLinked: true },
    ],
    authorityActions: [
      { label: "Open Juneau port authority page", href: "/ports/juneau", kind: "internal" },
      { label: "Compare Alaska shore-excursion lanes", href: "/cruises/shore-excursions", kind: "internal" },
      { label: "Open Alaska planning surface", href: "/alaska", kind: "internal" },
    ],
    executionCtas: [
      { label: "Browse Juneau shore excursions", href: "/tours?q=juneau%20shore%20excursions", kind: "internal" },
    ],
    faq: [
      {
        q: "What is the best type of Juneau excursion for a first Alaska cruise call?",
        a: "Most first-time travelers get the highest value from one primary glacier or wildlife lane with conservative return timing, rather than multiple disconnected stops.",
      },
      {
        q: "How much buffer should I leave before all-aboard in Juneau?",
        a: "Use meaningful margin for return flow and weather volatility; tight return windows are the most common avoidable failure.",
      },
      {
        q: "Should I book multiple major excursions in one Juneau port day?",
        a: "Usually no. One primary lane with a fallback performs better than multi-excursion stacking in a limited call window.",
      },
      {
        q: "What should I prioritize first for Juneau planning?",
        a: "Prioritize one high-fit primary excursion lane and protect return certainty before adding optional in-town activities.",
      },
    ],
    freshness: {
      updatedAt: "2026-03-13",
      refreshIntervalDays: 14,
      evidence: [
        {
          title: "Juneau port authority and cruise lane refresh",
          source: "DCC port + cruise action layer",
          href: "https://destinationcommandcenter.com/ports/juneau",
          note: "Port routing guidance maintained against current cruise and excursion lane signals.",
        },
      ],
    },
  },
  {
    id: "city-denver",
    canonicalPath: "/cities/denver",
    nodeType: "city",
    title: "Denver Ultimate Guide + Decision Engine",
    hero: {
      eyebrow: "DCC City Decision Engine",
      summary:
        "Denver decision support for venue nights, mountain-day routing, weather-aware pacing, and transportation sequencing that actually fits the clock.",
      imageHint: "Denver skyline and foothill transition with concert and route context",
      quickLinks: [
        { label: "Denver city hub", href: "/denver" },
        { label: "Red Rocks venue", href: "/venues/red-rocks-amphitheatre" },
        { label: "Denver ↔ Red Rocks route", href: "/routes/denver-red-rocks" },
      ],
    },
    quickFacts: [
      { label: "Best for", value: "City + mountain hybrid itineraries" },
      { label: "Typical trip", value: "2 to 4 nights" },
      { label: "Primary risk", value: "Over-stacking altitude + transfer-heavy plans" },
      { label: "Best action", value: "Pick one major anchor per daypart" },
      { label: "Weather behavior", value: "Rapid shifts by elevation and time of day" },
      { label: "Transfer friction", value: "Event-night and corridor congestion spikes" },
    ],
    whyThisPlaceMatters:
      "Denver is a route logic city, not a listicle city. Trip quality depends on sequencing city anchors, foothill venues, and mountain-time expectations realistically.",
    whenToGo: {
      bestMonths: "Late spring through early fall for broad route flexibility",
      bestDays: "Midweek and shoulder windows often reduce event and corridor pressure",
      bestWeather: "Stable dry windows with moderate daytime temperature swings",
      crowdPatterns:
        "Event nights and weekend mountain movement can produce significant transfer drag.",
      seasonalDifferences:
        "Winter requires stronger weather contingency and slower route assumptions, especially outside core city blocks.",
    },
    howToGetThere: [
      "Anchor downtown blocks first, then layer venue or foothill movement around them.",
      "Use route-specific pages when crossing from city center to event destinations.",
      "Keep weather and altitude conditions in planning assumptions, not as afterthoughts.",
      "Avoid chaining multiple geographically distant commitments in one evening.",
    ],
    whatToDo: [
      {
        title: "Live-music and venue route planning",
        description:
          "Use dedicated venue and route pages to avoid guesswork on arrival and post-event flow.",
        href: "/venues/red-rocks-amphitheatre",
      },
      {
        title: "City-core experience blocks",
        description:
          "Cluster downtown and adjacent activities to maximize quality and reduce transfer waste.",
        href: "/denver",
      },
      {
        title: "Foothill day extensions",
        description:
          "Treat foothill experiences as distinct route decisions with explicit time and transport budgeting.",
        href: "/routes/denver-red-rocks",
      },
    ],
    nearbyThings: [
      { label: "Colorado region guide", href: "/regions/colorado" },
      { label: "Mighty Argo route node", href: "/mighty-argo" },
      { label: "Red Rocks venue authority node", href: "/venues/red-rocks-amphitheatre" },
    ],
    insiderTips: [
      "Route compression is the hidden cost in Denver plans that mix city and foothill anchors.",
      "Weather and elevation shifts can change the quality of late-day outdoor blocks.",
      "One strong evening plan beats two medium plans with uncertain transfer outcomes.",
    ],
    commonMistakes: [
      {
        mistake: "Treating Denver and foothill venues as interchangeable same-block destinations.",
        avoid: "Use explicit route-time assumptions and choose fewer anchors per daypart.",
      },
      {
        mistake: "Ignoring event-night congestion around major venue windows.",
        avoid: "Front-load ingress timing and set fallback exits before the event starts.",
      },
      {
        mistake: "Planning mountain-adjacent blocks without weather contingency.",
        avoid: "Set alternate low-friction city options in case conditions shift.",
      },
    ],
    localIntel: [
      "Event-driven traffic patterns can dominate perceived distance more than map mileage.",
      "City-to-foothill movement usually costs more time than first-time visitors model.",
      "Weather-aware sequencing creates higher plan completion and lower missed-anchor rates.",
    ],
    relatedExperiences: [
      { label: "Red Rocks venue guide", href: "/venues/red-rocks-amphitheatre", graphLinked: true },
      { label: "Denver to Red Rocks route guide", href: "/routes/denver-red-rocks", graphLinked: true },
      { label: "Colorado region routing surface", href: "/regions/colorado", graphLinked: true },
    ],
    authorityActions: [
      { label: "Open Denver city hub", href: "/denver", kind: "internal" },
      { label: "Plan Red Rocks logistics", href: "/venues/red-rocks-amphitheatre", kind: "internal" },
      { label: "Open Denver route guide", href: "/routes/denver-red-rocks", kind: "internal" },
    ],
    executionCtas: [
      { label: "Explore Denver tours", href: "/tours?city=denver", kind: "internal" },
    ],
    faq: [
      {
        q: "What is the most common Denver itinerary mistake?",
        a: "The biggest miss is stacking too many city and foothill commitments into one day without realistic transfer and weather buffers.",
      },
      {
        q: "Should Denver travelers treat Red Rocks as a quick add-on?",
        a: "Usually no. Red Rocks is best handled as a dedicated route decision with explicit ingress and exit planning.",
      },
      {
        q: "How do you make Denver plans more reliable?",
        a: "Choose one primary anchor per daypart, preserve transfer margin, and maintain a weather fallback for outdoor-heavy blocks.",
      },
      {
        q: "Should I prioritize city hubs or execution links first?",
        a: "Start with city and route authority pages to lock decisions, then use execution links only after timing and transfer constraints are solved.",
      },
    ],
    freshness: {
      updatedAt: "2026-03-13",
      refreshIntervalDays: 21,
      evidence: [
        {
          title: "Denver route and venue intelligence sync",
          source: "DCC city and venue graph",
          href: "https://destinationcommandcenter.com/denver",
          note: "Decision guidance synced against active city, route, and venue node relationships.",
        },
      ],
    },
  },
  {
    id: "attraction-mendenhall-glacier",
    canonicalPath: "/attractions/mendenhall-glacier",
    nodeType: "attraction",
    title: "Mendenhall Glacier Ultimate Guide + Decision Engine",
    hero: {
      eyebrow: "DCC Attraction Decision Engine",
      summary:
        "A practical Mendenhall Glacier planning page focused on access realities, timing windows, weather impact, and best-fit Alaska shore-day decisions.",
      imageHint: "Glacier viewpoint with Juneau access corridor context",
      quickLinks: [
        { label: "Juneau port node", href: "/ports/juneau" },
        { label: "Alaska layer", href: "/alaska" },
        { label: "Shore excursions guide", href: "/cruises/shore-excursions" },
      ],
    },
    quickFacts: [
      { label: "Location", value: "Juneau area, Alaska" },
      { label: "Best for", value: "Scenic glacier-focused shore planning" },
      { label: "Trip window", value: "Often half-day compatible" },
      { label: "Primary risk", value: "Weather and visibility variability" },
      { label: "Transfer note", value: "Return margin is essential on cruise-call days" },
      { label: "Best action", value: "Pair one glacier anchor with one fallback" },
    ],
    whyThisPlaceMatters:
      "Mendenhall intent is high, but execution quality depends on weather, timing, and transfer certainty. This page solves those tradeoffs before checkout.",
    whenToGo: {
      bestMonths: "Main Alaska cruise season in late spring through early fall",
      bestDays: "Calls with stronger visibility and lower overlap deliver better experience value",
      bestWeather: "Stable visibility windows with manageable precipitation and wind",
      crowdPatterns:
        "Peak call overlap can compress viewpoints and transfer movement in limited windows.",
      seasonalDifferences:
        "Shoulder windows can be colder and more variable, which changes excursion suitability and route confidence.",
    },
    howToGetThere: [
      "Start from Juneau cruise-call logistics and choose a glacier lane early.",
      "Use conservative transport assumptions and protect all-aboard return buffer.",
      "Keep one lower-risk fallback if visibility degrades.",
      "Avoid multi-transfer layering when shore time is short.",
    ],
    whatToDo: [
      {
        title: "Primary glacier-view lane",
        description:
          "Choose one high-fit glacier option and protect its timing instead of trying to maximize stop count.",
      },
      {
        title: "Weather-aware backup route",
        description:
          "If visibility or marine conditions shift, pivot into lower-risk alternatives with cleaner transfer profiles.",
        href: "/ports/juneau",
      },
      {
        title: "Cruise-call route sequencing",
        description:
          "Treat Mendenhall as a dedicated lane within your Juneau call, not a side note after unrelated stops.",
        href: "/cruises/shore-excursions",
      },
    ],
    nearbyThings: [
      { label: "Juneau port planning", href: "/ports/juneau" },
      { label: "Alaska authority hub", href: "/alaska" },
      { label: "Cruise shore-excursions authority", href: "/cruises/shore-excursions" },
    ],
    insiderTips: [
      "Visibility quality can matter more than itinerary length for glacier satisfaction.",
      "One reliable glacier lane outperforms split-focus port days with multiple transfers.",
      "Fallback planning preserves value when weather shifts late.",
    ],
    commonMistakes: [
      {
        mistake: "Assuming all glacier products perform equally under variable weather.",
        avoid: "Prioritize forecast-aware options and keep a route fallback.",
      },
      {
        mistake: "Stacking too many Juneau goals around a glacier anchor.",
        avoid: "Protect one core glacier lane and avoid high-friction add-ons.",
      },
      {
        mistake: "Returning too close to all-aboard cutoff.",
        avoid: "Set conservative return targets and preserve margin for transit drag.",
      },
    ],
    localIntel: [
      "Day quality at glacier-focused stops is highly sensitive to visibility and rain conditions.",
      "Transfer certainty often determines whether a glacier stop feels premium or rushed.",
      "Simpler route architecture consistently produces better port-day outcomes.",
    ],
    relatedExperiences: [
      { label: "Juneau port decision engine", href: "/ports/juneau", graphLinked: true },
      { label: "Alaska destination layer", href: "/alaska", graphLinked: true },
      { label: "Shore excursions authority guide", href: "/cruises/shore-excursions", graphLinked: true },
    ],
    authorityActions: [
      { label: "Open Juneau port authority page", href: "/ports/juneau", kind: "internal" },
      { label: "Compare shore-excursion lanes", href: "/cruises/shore-excursions", kind: "internal" },
      { label: "Open Alaska planning layer", href: "/alaska", kind: "internal" },
    ],
    executionCtas: [
      { label: "Find Mendenhall tours", href: "/tours?q=mendenhall%20glacier", kind: "internal" },
    ],
    faq: [
      {
        q: "Is Mendenhall Glacier a good fit for short Juneau cruise calls?",
        a: "It can be, but success depends on weather fit and transfer certainty. Treat it as a primary lane with protected timing.",
      },
      {
        q: "What ruins Mendenhall-focused shore days most often?",
        a: "Over-stacking additional goals and underestimating return friction are the most common avoidable failures.",
      },
      {
        q: "How should I plan backup options for Mendenhall days?",
        a: "Set a lower-transfer fallback in advance so weather or visibility changes do not collapse the entire call plan.",
      },
      {
        q: "When should I move from authority planning to booking?",
        a: "Only after route, weather, and return-time constraints are set; booking should follow solved logistics, not precede them.",
      },
    ],
    freshness: {
      updatedAt: "2026-03-13",
      refreshIntervalDays: 14,
      evidence: [
        {
          title: "Juneau + Alaska decision-lane refresh",
          source: "DCC cruise and port logic",
          href: "https://destinationcommandcenter.com/ports/juneau",
          note: "Attraction guidance remains tied to active Juneau port and shore-lane context.",
        },
      ],
    },
  },
  {
    id: "route-denver-red-rocks",
    canonicalPath: "/routes/denver-red-rocks",
    nodeType: "route",
    title: "Denver to Red Rocks Ultimate Guide + Decision Engine",
    hero: {
      eyebrow: "DCC Route Decision Engine",
      summary:
        "The route intelligence layer for Denver-to-Red-Rocks movement: departure windows, congestion behavior, pickup strategy, and post-show recovery plans.",
      imageHint: "City-to-foothill route with concert-night timing context",
      quickLinks: [
        { label: "Denver city node", href: "/cities/denver" },
        { label: "Red Rocks venue node", href: "/venues/red-rocks-amphitheatre" },
        { label: "Colorado region node", href: "/regions/colorado" },
      ],
    },
    quickFacts: [
      { label: "Route type", value: "City-to-venue event route" },
      { label: "Typical drive", value: "25 to 40 minutes baseline (excluding event surge)" },
      { label: "Primary risk", value: "Post-show pickup compression" },
      { label: "Best departure", value: "Early departure before ingress peak" },
      { label: "Backup strategy", value: "Predefine fallback pickup/meeting options" },
      { label: "Best action", value: "Lock ingress + egress plan before ticket add-ons" },
    ],
    whyThisPlaceMatters:
      "Most Red Rocks failures are route failures, not venue failures. This page resolves transport and timing risk so the event experience can succeed.",
    whenToGo: {
      bestMonths: "Peak route demand aligns with main outdoor concert season",
      bestDays: "Weeknight schedules can offer smoother ingress and lower post-event surge",
      bestWeather: "Dry evenings reduce route uncertainty and exit delays",
      crowdPatterns:
        "Ingress grows sharply before doors and egress bottlenecks immediately after the final set.",
      seasonalDifferences:
        "Cold-season weather and road conditions can increase both transit duration and risk variance.",
    },
    howToGetThere: [
      "Private vehicle works if parking and exit strategy are set early.",
      "Shuttle options reduce late-night pickup chaos for groups and first-time visitors.",
      "Rideshare ingress is usually easier than egress; plan post-show fallback points.",
      "Do not rely on one brittle pickup assumption for sold-out nights.",
    ],
    whatToDo: [
      {
        title: "Ingress plan",
        description:
          "Lock departure time and entry approach first, then fit pre-show activities around it.",
      },
      {
        title: "Egress plan",
        description:
          "Define at least one fallback pickup strategy before the show starts.",
      },
      {
        title: "Post-show continuity",
        description:
          "Use a low-friction post-show option instead of hard-timed reservations across the city.",
        href: "/cities/denver",
      },
    ],
    nearbyThings: [
      { label: "Red Rocks venue guide", href: "/venues/red-rocks-amphitheatre" },
      { label: "Denver city planning", href: "/cities/denver" },
      { label: "Colorado region authority", href: "/regions/colorado" },
    ],
    insiderTips: [
      "The route is easiest when ingress and egress are both planned, not just arrival.",
      "Fallback pickup points reduce end-of-night failure rates significantly.",
      "Keep post-show expectations light; transfer drag can persist beyond initial exit.",
    ],
    commonMistakes: [
      {
        mistake: "Optimizing only arrival and leaving exit unplanned.",
        avoid: "Pre-plan post-show pickup options before entering the venue.",
      },
      {
        mistake: "Booking strict city reservations right after show end.",
        avoid: "Use flexible post-show options with realistic transfer windows.",
      },
      {
        mistake: "Assuming route duration is constant across event-night demand.",
        avoid: "Build event-aware buffers and monitor timing conditions before departure.",
      },
    ],
    localIntel: [
      "Event-night route reliability is mostly determined by egress strategy quality.",
      "First-time visitors underweight the pickup bottleneck window after finale.",
      "Simple two-anchor plans outperform complex multi-stop post-show routing.",
    ],
    relatedExperiences: [
      { label: "Red Rocks decision engine", href: "/venues/red-rocks-amphitheatre", graphLinked: true },
      { label: "Denver city decision engine", href: "/cities/denver", graphLinked: true },
      { label: "Colorado route and region surface", href: "/regions/colorado", graphLinked: true },
    ],
    authorityActions: [
      { label: "Open Red Rocks venue intelligence", href: "/venues/red-rocks-amphitheatre", kind: "internal" },
      { label: "Open Denver city intelligence", href: "/cities/denver", kind: "internal" },
      { label: "Open core Denver hub", href: "/denver", kind: "internal" },
    ],
    executionCtas: [
      { label: "See route-adjacent tours", href: "/tours?city=denver&q=red%20rocks", kind: "internal" },
    ],
    faq: [
      {
        q: "What is the most important decision on Denver to Red Rocks nights?",
        a: "The highest-impact decision is planning egress early. Most route failures happen after the show, not before it.",
      },
      {
        q: "Should I rely on rideshare both ways for Red Rocks events?",
        a: "Rideshare is often fine on ingress, but post-show reliability varies. Always plan one fallback pickup strategy.",
      },
      {
        q: "How much buffer should I use for post-show plans in Denver?",
        a: "Use conservative buffer windows and avoid brittle timing assumptions. Post-event route compression is common on high-demand nights.",
      },
      {
        q: "What should happen before booking any route-adjacent product?",
        a: "Confirm ingress/egress strategy, fallback pickup logic, and realistic time windows before adding commercial actions.",
      },
    ],
    freshness: {
      updatedAt: "2026-03-13",
      refreshIntervalDays: 21,
      evidence: [
        {
          title: "Event-route operational signal checks",
          source: "DCC venue and route graph",
          href: "https://destinationcommandcenter.com/venues/red-rocks-amphitheatre",
          note: "Route decision guidance validated against venue-driven demand behavior.",
        },
      ],
    },
  },
];

export const DECISION_ENGINE_PAGES: DecisionEnginePage[] = pages.map((entry) =>
  DecisionEnginePageSchema.parse(entry)
);

const byPath = new Map(DECISION_ENGINE_PAGES.map((entry) => [entry.canonicalPath, entry]));

export function getDecisionEnginePageByPath(pathname: string): DecisionEnginePage | null {
  return byPath.get(pathname) || null;
}

export function listDecisionEnginePagesByPrefix(prefix: string): DecisionEnginePage[] {
  return DECISION_ENGINE_PAGES.filter((entry) => entry.canonicalPath.startsWith(prefix));
}
