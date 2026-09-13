export interface SampleExcursion {
  name: string;
  duration: string;
  returnMargin: string;
  bestSuitedFor: string;
  meetingPoint: string;
  searchQuery: string;
  campaignTag: string;
}

export interface PortActivity {
  portSlug: string;
  portName: string;
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  eyebrow: string;
  typicalDuration: string;
  meetingLogistics: string;
  returnMargin: string;
  weatherSensitivity: "Low" | "Moderate" | "High" | "Low to Moderate" | "Moderate to High";
  weatherBackupAdvice: string;
  cruiseSafetyRule: string;
  overview: string[];
  keyHighlights: string[];
  timingBreakdown: {
    disembarkation: string;
    travelToSite: string;
    activeExperience: string;
    returnTransit: string;
    pierBuffer: string;
  };
  sampleTours: SampleExcursion[];
  whatToBring: string[];
  faqs: { question: string; answer: string }[];
  relatedActivities: { name: string; href: string }[];
  relatedDecisions: { name: string; href: string }[];
}

export const PORT_ACTIVITIES: PortActivity[] = [
  {
    "portSlug": "juneau",
    "portName": "Juneau",
    "slug": "whale-watching",
    "title": "Juneau Whale Watching Shore Excursions | Cruise-Safe Timing & Tours",
    "metaDescription": "Compare Juneau whale watching shore excursions by boat size, duration, meeting pier, and return-to-ship buffer. High summer sighting probability with operator-reported policies.",
    "h1": "Juneau Whale Watching Shore Excursions",
    "eyebrow": "Juneau, Alaska · Marine Wildlife",
    "typicalDuration": "3.5 to 4 hours total (2 to 2.5 hours on the water)",
    "meetingLogistics": "Most operators pick up at the Mount Roberts Tramway parking area (Franklin Dock/Cruise Terminal). If docked at AJ Dock, allow 15 minutes for the port shuttle to the tram lot.",
    "returnMargin": "Requires minimum 5-hour port call. Returns you to the cruise dock parking area with 60 to 90 minutes before typical ship all-aboard.",
    "weatherSensitivity": "Low",
    "weatherBackupAdvice": "Whales feed in Auke Bay rain or shine. Tour boats have heated enclosed cabins. Rain does not cancel whale watching; only gale-force winds or rare mechanical issues prompt cancellations.",
    "cruiseSafetyRule": "Never book a 3.5-hour whale watch if your port window is under 5 hours. Pier shuttle traffic and harbor transfers require at least 75 minutes of total buffer.",
    "overview": [
      "Juneau is widely regarded as the premier humpback whale feeding ground along the Inside Passage. Between May and September, hundreds of humpbacks migrate to the nutrient-rich waters of Auke Bay and Favorite Channel to gorge on herring and krill.",
      "Most independent Juneau whale tours operate out of Auke Bay Harbor, located 20 minutes north of downtown cruise docks. Operators provide round-trip coach or mini-bus transportation from the Mount Roberts Tram parking plaza directly to the boat slip.",
      "The key choice for cruise passengers is vessel size: small-group safari boats (14–24 passengers) offer sea-level water vantage points and quick mobility, while mid-sized catamarans (40–100 passengers) feature wrap-around outdoor viewing decks, heated interior seating, and restrooms on board."
    ],
    "keyHighlights": [
      "Peak humpback whale feeding season from mid-May through mid-September",
      "Frequent sightings of Stellar sea lions, harbor seals, bald eagles, and occasional orcas",
      "Heated interior cabins with large picture windows and 360-degree viewing decks",
      "Onboard naturalist narrating bubble-net feeding, breaching, and tail flukes"
    ],
    "timingBreakdown": {
      "disembarkation": "15–30 mins from gangway to downtown Mount Roberts Tram lot",
      "travelToSite": "20–25 mins coach transit to Auke Bay Harbor",
      "activeExperience": "120–150 mins on water tracking pods and viewing wildlife",
      "returnTransit": "20–25 mins bus back to downtown Juneau cruise terminal",
      "pierBuffer": "60–90 mins remaining before ship all-aboard time"
    },
    "sampleTours": [
      {
        "name": "Small-Group Juneau Whale Watching Cruise",
        "duration": "3.5 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "Photographers and travelers wanting an intimate, low-crowd boat",
        "meetingPoint": "Mt. Roberts Tram Plaza",
        "searchQuery": "Juneau small group whale watching cruise",
        "campaignTag": "juneau-whale-small-group"
      },
      {
        "name": "Juneau Whale Watch & Mendenhall Glacier Combo",
        "duration": "5.5 hours",
        "returnMargin": "90 min buffer (needs 7+ hr port call)",
        "bestSuitedFor": "First-timers who want to knock out both major Juneau sights in one day",
        "meetingPoint": "Mt. Roberts Tram Plaza",
        "searchQuery": "Juneau whale watching and Mendenhall glacier combo",
        "campaignTag": "juneau-whale-mendenhall-combo"
      }
    ],
    "whatToBring": [
      "Waterproof hooded jacket (rain is common in Juneau)",
      "Binoculars or telephoto zoom lens (minimum 200mm recommended)",
      "Layered fleece or wool sweater for outdoor viewing decks",
      "Flat, rubber-soled footwear with good traction on wet boat decks"
    ],
    "faqs": [
      {
        "question": "How far is Auke Bay from the Juneau cruise dock?",
        "answer": "Auke Bay Harbor is approximately 12 miles northwest of the downtown Juneau docks. Independent excursion operators include round-trip motorcoach transfer (roughly 20-25 minutes each way) departing from the Mount Roberts Tram parking lot."
      },
      {
        "question": "What happens if our cruise ship is delayed arriving into Juneau?",
        "answer": "Independent excursion operators monitor real-time cruise ship arrival schedules in Juneau. If your ship docks late, reputable operators will shift your tour departure to a later departure or issue a full refund."
      },
      {
        "question": "Do Juneau whale watching tours include the Mendenhall Glacier?",
        "answer": "Standard whale-only tours take 3.5 hours and return you downtown. Combo tours add 1.5 to 2 hours at the Mendenhall Glacier Recreation Area, totaling 5 to 6 hours. Combo tours require an absolute minimum 7-hour port call to remain cruise-safe."
      }
    ],
    "relatedActivities": [
      {
        "name": "Mendenhall Glacier Tours",
        "href": "/juneau/mendenhall-glacier-tours"
      },
      {
        "name": "Helicopter Glacier Landings",
        "href": "/juneau/helicopter-glacier-tours"
      },
      {
        "name": "Excursions by Ship Time",
        "href": "/juneau/excursions-by-cruise-ship-time"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Whale Watching vs Glacier Tour",
        "href": "/decision/whale-watching-vs-glacier-tour"
      },
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      },
      {
        "name": "Cruises Safe for Ship Window",
        "href": "/decision/excursions-safe-for-cruise-ship-window"
      }
    ]
  },
  {
    "portSlug": "juneau",
    "portName": "Juneau",
    "slug": "mendenhall-glacier-tours",
    "title": "Mendenhall Glacier Tours & Transportation | Juneau Shore Excursions",
    "metaDescription": "Guide to visiting Mendenhall Glacier from your Juneau cruise ship. Compare independent shuttles, guided walks, canoe adventures, and USFS permit rules.",
    "h1": "Mendenhall Glacier Shore Excursions",
    "eyebrow": "Juneau, Alaska · Glaciers & Hiking",
    "typicalDuration": "2.5 to 5 hours depending on shuttle vs. active kayak/hiking tour",
    "meetingLogistics": "Shuttles and guided tour coaches depart from the Mount Roberts Tram parking lot adjacent to the cruise docks.",
    "returnMargin": "Requires minimum 4-hour port call for self-guided shuttles; 6-hour port call for guided lake paddles.",
    "weatherSensitivity": "Low",
    "weatherBackupAdvice": "Mendenhall Glacier Recreation Area is open rain or shine. In fact, overcast and drizzly days highlight the deep blue refraction in the glacial ice and make Nugget Falls more dramatic.",
    "cruiseSafetyRule": "The US Forest Service limits commercial vehicle permits at Mendenhall Glacier. Never rely on hailing an unreserved taxi or city bus during peak cruise days—book authorized shuttles or tours in advance.",
    "overview": [
      "Mendenhall Glacier is Alaska's most accessible drive-up glacier, terminating at Mendenhall Lake just 13 miles north of downtown Juneau. It is part of the 1,500-square-mile Juneau Icefield.",
      "Visiting Mendenhall Glacier involves two primary options: an independent shuttle transfer allowing 1.5 to 2 hours of self-paced exploration along the paved trails, or a guided adventure involving lake canoeing, kayaking, or glacier trekking.",
      "Key attractions at the recreation area include the 0.8-mile trail to roaring Nugget Falls, the elevated boardwalks along Steep Creek for wild salmon and black bear viewing in late summer, and the USFS Visitor Center exhibits overlooking the lake."
    ],
    "keyHighlights": [
      "Stand within 100 yards of the thunderous 377-foot Nugget Falls cascade",
      "Stroll elevated boardwalks over Steep Creek to watch sockeye salmon and foraging black bears (July-Sept)",
      "Explore the US Forest Service Visitor Center with high-powered spotting scopes",
      "Multiple flat, paved, family-accessible walking trails with unobstructed glacier viewpoints"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins to bus loading zone",
      "travelToSite": "25 mins coach ride through Mendenhall Valley",
      "activeExperience": "90–150 mins hiking Nugget Falls trail and visiting center",
      "returnTransit": "25 mins coach return to downtown Juneau",
      "pierBuffer": "60–120 mins remaining before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Mendenhall Glacier Express Shuttle & Entry",
        "duration": "2.5 to 3 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Independent walkers who want maximum flexibility on the trails",
        "meetingPoint": "Mt. Roberts Tramway Lot",
        "searchQuery": "Juneau Mendenhall Glacier roundtrip shuttle transfer",
        "campaignTag": "juneau-mendenhall-express"
      },
      {
        "name": "Mendenhall Glacier Canoe & Trek Adventure",
        "duration": "5.5 hours",
        "returnMargin": "75 min buffer (needs 7+ hr port call)",
        "bestSuitedFor": "Active travelers who want to paddle past icebergs and touch glacier moraine",
        "meetingPoint": "Downtown Juneau Cruise Pier",
        "searchQuery": "Mendenhall Glacier canoe and guided hike",
        "campaignTag": "juneau-mendenhall-canoe"
      }
    ],
    "whatToBring": [
      "Comfortable walking shoes or lightweight waterproof hiking boots",
      "Waterproof rain shell with hood",
      "US Forest Service entrance pass or voucher if not included in your shuttle",
      "Camera with wide-angle lens for capturing the lake, glacier face, and Nugget Falls"
    ],
    "faqs": [
      {
        "question": "Can you still take the city bus to Mendenhall Glacier?",
        "answer": "The Juneau municipal city bus drops off at a commuter stop 1.25 miles away from the visitor center, requiring a 25-minute walk along an open road shoulder each way. On a cruise port schedule, taking commercial excursion shuttles that pull right up to the visitor plaza is strongly recommended to protect your ship all-aboard window."
      },
      {
        "question": "Can you walk on Mendenhall Glacier from the visitor center?",
        "answer": "No. The glacier has receded across Mendenhall Lake. You cannot reach the ice surface from the public trails or visitor center. To physically step on or touch glacier ice in Juneau, you must book either a glacier canoe/paddle excursion across the lake or a helicopter glacier landing tour."
      },
      {
        "question": "Is Mendenhall Glacier wheelchair and stroller accessible?",
        "answer": "Yes. The USFS Visitor Center, the Photo Point trail, and the elevated Steep Creek viewing boardwalks are fully paved and ADA-compliant. The trail to Nugget Falls is packed gravel and accessible for rugged strollers."
      }
    ],
    "relatedActivities": [
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      },
      {
        "name": "Helicopter Glacier Landings",
        "href": "/juneau/helicopter-glacier-tours"
      },
      {
        "name": "Juneau Wildlife Excursions",
        "href": "/juneau/wildlife-excursions"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Whale Watching vs Glacier Tour",
        "href": "/decision/whale-watching-vs-glacier-tour"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Best Excursion for First-Time Cruisers",
        "href": "/decision/best-excursion-first-time-alaska-cruisers"
      }
    ]
  },
  {
    "portSlug": "juneau",
    "portName": "Juneau",
    "slug": "helicopter-glacier-tours",
    "title": "Juneau Helicopter Glacier Landing Tours | Flightseeing & Ice Trekking",
    "metaDescription": "Fly over the Juneau Icefield and land on remote glaciers. Compare helicopter flightseeing, glacier walks, and ice trekking with cruise-safe departure times.",
    "h1": "Juneau Helicopter Glacier Landing Shore Excursions",
    "eyebrow": "Juneau, Alaska · Flightseeing & Ice Landings",
    "typicalDuration": "2.25 to 3 hours total (30–40 mins flight time + 25–40 mins walking on ice)",
    "meetingLogistics": "Helicopter operators provide direct van or bus pickup from the downtown Juneau cruise piers to the Juneau International Airport heliport.",
    "returnMargin": "Requires minimum 4.5-hour port call. Returns you to downtown Juneau at least 60-90 minutes before ship departure.",
    "weatherSensitivity": "High",
    "weatherBackupAdvice": "Aviation regulations require safe cloud ceiling and mountain pass visibility over the Juneau Icefield. If weather forces a cancellation, operators typically provide a refund per their published weather policy. Have a ground-based backup (whale watching or Mendenhall shuttle) ready.",
    "cruiseSafetyRule": "Book the earliest flight slot available during your port call. Morning flights encounter fewer thermal downdrafts and give you time to reschedule or shift to a boat tour if weather causes delays.",
    "overview": [
      "Landing a turbine-powered helicopter atop the ancient blue ice of the Juneau Icefield is consistently rated the #1 bucket-list shore excursion in Alaska. The 1,500-square-mile icefield spawns over 40 distinct glaciers, including Herbert, Taku, Lemon Creek, and Norris.",
      "Flights lift off from the heliport at Juneau International Airport and ascend over dense rainforest before clearing jagged granite nunataks. The pilot guides the aircraft across deep crevasses, meltwater waterfalls, and azure blue moulins before touching down on solid glacial ice.",
      "Once landed, guests don glacier overboots (and crampons on trekking options) to walk safely across the ice accompanied by certified mountaineering guides who explain glacial flow and ice structures."
    ],
    "keyHighlights": [
      "Bird's-eye aerial views of rock spires, icefalls, and azure meltwater pools",
      "Step out onto millennia-old glacial ice far away from cruise ship crowds",
      "Drink pure glacial meltwater directly from mountain ice rivulets",
      "Two-way pilot communications headset with real-time geological narration"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins to meet van at pier",
      "travelToSite": "20 mins van transit to heliport",
      "activeExperience": "35 mins flight + 30 mins guided walk on glacier ice",
      "returnTransit": "20 mins van back to cruise pier",
      "pierBuffer": "60–90 mins buffer before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Juneau Icefield Helicopter Flight & Glacier Landing",
        "duration": "2.5 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "All ages looking for a thrilling flight and safe, easy glacier walk",
        "meetingPoint": "Downtown Cruise Pier Van Zone",
        "searchQuery": "Juneau helicopter glacier landing tour",
        "campaignTag": "juneau-heli-glacier-walk"
      },
      {
        "name": "Helicopter Glacier Trek with Crampons",
        "duration": "4.25 hours",
        "returnMargin": "90 min buffer (needs 6+ hr port call)",
        "bestSuitedFor": "Active adventurers who want 2 hours of hiking across deep ice crevasses",
        "meetingPoint": "Downtown Cruise Pier Van Zone",
        "searchQuery": "Juneau helicopter glacier trek crampons",
        "campaignTag": "juneau-heli-glacier-trek"
      }
    ],
    "whatToBring": [
      "Dark UV-blocking sunglasses (glacier ice reflection is blinding)",
      "Layered windbreaker or waterproof jacket",
      "Camera with secure wrist/neck strap (no loose selfie sticks allowed on aircraft)",
      "Operators provide specialized glacier overboots; wear warm wool socks"
    ],
    "faqs": [
      {
        "question": "What happens if my helicopter glacier tour is cancelled due to weather?",
        "answer": "If low clouds, heavy fog, or high winds prevent safe flying over the icefield, your flight will be cancelled and operators typically process a refund per their published weather terms. Reputable independent operators communicate cancellations promptly so you can walk to downtown tour desks for ground-based activities."
      },
      {
        "question": "Is there a weight limit or surcharge for helicopter tours in Juneau?",
        "answer": "Yes. Due to FAA weight-and-balance safety regulations, guests weighing over 250 lbs (or 500 lbs combined for two passengers) may be subject to a weight surcharge or required to purchase an additional seat. Accurate weights must be provided at time of booking."
      },
      {
        "question": "Can children or elderly passengers walk on the glacier?",
        "answer": "Standard glacier landing tours require only modest mobility—walking 50 to 100 yards over mildly uneven ice. Operators provide spiked overboots for traction. Children ages 2 and up are welcome on standard landings; ice treks with crampons typically require ages 12+."
      }
    ],
    "relatedActivities": [
      {
        "name": "Dog Sledding by Helicopter",
        "href": "/juneau/dog-sledding"
      },
      {
        "name": "Seaplane Flightseeing",
        "href": "/juneau/flightseeing"
      },
      {
        "name": "Mendenhall Glacier Tours",
        "href": "/juneau/mendenhall-glacier-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Flightseeing vs Land Excursion",
        "href": "/decision/flightseeing-vs-land-excursion"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Last-Minute Shore Excursions",
        "href": "/decision/last-minute-alaska-shore-excursions"
      }
    ]
  },
  {
    "portSlug": "juneau",
    "portName": "Juneau",
    "slug": "flightseeing",
    "title": "Juneau Flightseeing Tours | Floatplanes & Seaplanes Over Five Glaciers",
    "metaDescription": "Experience Juneau by air. Compare floatplane tours over five massive glaciers to Taku Lodge salmon feasts and alpine seaplane excursions.",
    "h1": "Juneau Seaplane & Floatplane Flightseeing",
    "eyebrow": "Juneau, Alaska · Seaplanes & Aviation",
    "typicalDuration": "1.5 to 3.5 hours depending on flight-only vs. wilderness lodge feast",
    "meetingLogistics": "Floatplanes take off directly from the Juneau downtown waterfront harbor, located a short 5-minute walk from downtown cruise docks.",
    "returnMargin": "Requires minimum 3.5-hour port call. Returns you to downtown waterfront with generous time for ship boarding.",
    "weatherSensitivity": "High",
    "weatherBackupAdvice": "Seaplane flights operate strictly under Visual Flight Rules (VFR). If fog or low ceilings close mountain passes, flights are grounded with full refunds. You can seamlessly pivot to whale watching boats right from downtown.",
    "cruiseSafetyRule": "Waterfront floatplane departures eliminate airport road transit. They are the fastest, most time-efficient aviation tour in Alaska.",
    "overview": [
      "Taking off from the salt waters of Gastineau Channel in a vintage de Havilland Beaver or Otter floatplane is an authentic Alaskan frontier experience. Juneau's floatplane docks sit right downtown, letting you board within steps of your cruise ship.",
      "The classic 5-Glacier Seaplane Discovery soars over Norris Glacier, Hole-in-the-Wall Glacier, East and West Twin Glaciers, and the advancing 4,800-foot-thick Taku Glacier. Every passenger gets a window seat and two-way voice-activated headset.",
      "For travelers with longer port stays, the world-famous Taku Glacier Lodge flight includes an amphibious landing on the Taku River, a fresh wild Alaska king salmon feast grilled over alder wood, and frequent sightings of wild black bears roaming the lodge grounds."
    ],
    "keyHighlights": [
      "Water takeoff and landing directly on Gastineau Channel in Juneau",
      "High-wing de Havilland aircraft configured with window seats for passengers",
      "Fly over advancing Taku Glacier—one of the few non-retreating glaciers in Alaska",
      "Optional wilderness lodge add-on with alder-wood grilled Alaska salmon"
    ],
    "timingBreakdown": {
      "disembarkation": "10 mins walk from dock to seaplane terminal",
      "travelToSite": "5 mins pre-flight briefing and life vest fitting",
      "activeExperience": "40 mins 5-glacier flight (or 3 hours with Taku Lodge)",
      "returnTransit": "5 mins walk back to ship terminal",
      "pierBuffer": "60–120 mins margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Five-Glacier Seaplane Flightseeing Tour",
        "duration": "1.5 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Passengers with short 4-hour port calls who want massive aerial glacier views",
        "meetingPoint": "Downtown Juneau Seaplane Dock",
        "searchQuery": "Juneau 5 glacier seaplane flightseeing tour",
        "campaignTag": "juneau-seaplane-5-glacier"
      },
      {
        "name": "Taku Glacier Lodge Seaplane & Salmon Bake",
        "duration": "3.5 hours",
        "returnMargin": "75 min buffer (needs 5.5+ hr port call)",
        "bestSuitedFor": "Cruisers seeking an unforgettable remote Alaska culinary and wilderness flight",
        "meetingPoint": "Downtown Juneau Waterfront Floatplane Slip",
        "searchQuery": "Taku Glacier Lodge seaplane salmon bake Juneau",
        "campaignTag": "juneau-taku-lodge-flight"
      }
    ],
    "whatToBring": [
      "Polarized sunglasses to cut through window glare and ice reflections",
      "Camera or phone with lens cleaning cloth",
      "Light jacket (aircraft cabins are heated during flight)",
      "Photo ID matching your cruise manifest for flight security clearance"
    ],
    "faqs": [
      {
        "question": "Is a floatplane smoother than a helicopter?",
        "answer": "Floatplanes fly faster and travel greater distances, covering up to five distinct glaciers in a 40-minute flight. Helicopters fly lower and slower, and have the unique ability to touch down and land on the ice. If stepping onto the glacier is your goal, choose a helicopter; if covering massive wilderness distance is your priority, choose a floatplane."
      },
      {
        "question": "Do floatplanes operate if it is raining in Juneau?",
        "answer": "Yes, provided the cloud ceiling is high enough for legal VFR flight and forward visibility remains clear. In Southeast Alaska, light mist or rain does not ground seaplanes as long as mountain peaks are visible."
      },
      {
        "question": "Where do we meet for floatplane tours?",
        "answer": "Downtown floatplane tours depart from docks along Franklin Street and Marine Way, less than a 10-minute walk from the South Franklin and Marine cruise docks."
      }
    ],
    "relatedActivities": [
      {
        "name": "Helicopter Glacier Landings",
        "href": "/juneau/helicopter-glacier-tours"
      },
      {
        "name": "Dog Sledding Excursions",
        "href": "/juneau/dog-sledding"
      },
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Flightseeing vs Land Excursion",
        "href": "/decision/flightseeing-vs-land-excursion"
      },
      {
        "name": "Short Port Call Options",
        "href": "/decision/short-port-call-alaska-options"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      }
    ]
  },
  {
    "portSlug": "juneau",
    "portName": "Juneau",
    "slug": "dog-sledding",
    "title": "Juneau Glacier Dog Sledding by Helicopter | Ultimate Shore Excursion",
    "metaDescription": "Fly by helicopter to an alpine snow camp on Herbert Glacier for real dog sledding with Alaskan huskies. Timing, weight, and booking rules.",
    "h1": "Juneau Glacier Dog Sledding by Helicopter",
    "eyebrow": "Juneau, Alaska · Iditarod & Glaciers",
    "typicalDuration": "2.75 to 3.25 hours total (35 mins flight + 60 mins on glacier dog sled camp)",
    "meetingLogistics": "Shuttle coaches pick up directly outside the cruise terminals in downtown Juneau for the 20-minute transfer to the heliport.",
    "returnMargin": "Requires minimum 5-hour port call. Returns you downtown 60 to 90 minutes before ship all-aboard.",
    "weatherSensitivity": "High",
    "weatherBackupAdvice": "Glacier dog camps sit at 3,000+ feet elevation on the snowfields. They are the most weather-sensitive tour in Alaska. If cloud cover closes the snowfield, you are fully refunded. Have a backup plan to pivot to whale watching.",
    "cruiseSafetyRule": "Glacier dog sledding sells out 4 to 6 months in advance. Book early, and never select a tour slot that cuts your ship all-aboard margin below 75 minutes.",
    "overview": [
      "Glacier dog sledding combines two of Alaska's most iconic adventures: a panoramic helicopter flight across the Juneau Icefield, followed by a landing at a remote dog mushing camp pitched on deep summer snow.",
      "Here, professional Iditarod and Yukon Quest mushers live on the ice throughout the summer with teams of eager, energetic Alaskan huskies. Guests meet the dogs, cuddle husky puppies, learn about arctic sled technology, and take the reins or ride inside the basket on a real sled run across alpine snow.",
      "Because the camp is located on permanent snowpack high on Herbert or Norris Glacier, it requires winter boots and snow overboots (provided by the operator) even in the middle of July."
    ],
    "keyHighlights": [
      "Experience genuine dog mushing on real snow in the middle of summer",
      "Meet Iditarod veteran mushers and hear firsthand tales of 1,000-mile arctic races",
      "Panoramic helicopter flight with aerial views of deep crevasses and glacial waterfalls",
      "Spend quality time petting friendly racing huskies and meeting summer litters of puppies"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins to meet transfer van",
      "travelToSite": "20 mins van transit to heliport",
      "activeExperience": "35 mins flight + 60 mins dog sledding and kennel tour",
      "returnTransit": "20 mins van ride back to pier",
      "pierBuffer": "60–90 mins buffer before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Helicopter Glacier Dog Sledding on Herbert Glacier",
        "duration": "3 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "Bucket-list travelers and families wanting the ultimate Alaska thrill",
        "meetingPoint": "Downtown Cruise Pier Staging Lot",
        "searchQuery": "Juneau helicopter glacier dog sledding tour",
        "campaignTag": "juneau-heli-dog-sledding"
      },
      {
        "name": "Extended Glacier Dog Sledding & Flightseeing",
        "duration": "3.5 hours",
        "returnMargin": "90 min buffer (needs 5.5+ hr port call)",
        "bestSuitedFor": "Cruisers wanting longer flight routes and extra hands-on driving time",
        "meetingPoint": "Downtown Cruise Pier Staging Lot",
        "searchQuery": "Juneau extended glacier dog sledding helicopter",
        "campaignTag": "juneau-dog-sled-extended"
      }
    ],
    "whatToBring": [
      "Dark sunglasses or ski goggles (snow glare at 3,500 feet is intense)",
      "Layered clothing with waterproof outer shell and warm fleece underlayer",
      "Warm winter gloves and beanie (temperatures on the snow can be 20°F cooler than downtown)",
      "High-SPF sunscreen and lip balm"
    ],
    "faqs": [
      {
        "question": "Is there real snow on the glacier in July and August?",
        "answer": "Yes. The dog camps are established on upper snowfields at over 3,000 feet elevation on the Juneau Icefield, where packed snow remains deep throughout the entire summer cruise season."
      },
      {
        "question": "Do guests get to drive the dog sled?",
        "answer": "Yes, guests typically have the opportunity to stand on the runners behind the musher and help drive the sled, or sit comfortably inside the padded sled basket. The musher maintains primary brake control for safety."
      },
      {
        "question": "What happens if weather cancels the dog sledding portion?",
        "answer": "If weather prevents landing at the high-elevation snow camp, the operator may offer an alternative lower-elevation glacier landing walk with a partial refund, or a refund per the operator's weather policy."
      }
    ],
    "relatedActivities": [
      {
        "name": "Helicopter Glacier Landings",
        "href": "/juneau/helicopter-glacier-tours"
      },
      {
        "name": "Juneau Flightseeing",
        "href": "/juneau/flightseeing"
      },
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Flightseeing vs Land Excursion",
        "href": "/decision/flightseeing-vs-land-excursion"
      },
      {
        "name": "Best Excursions for Families",
        "href": "/decision/best-alaska-excursions-for-families"
      },
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      }
    ]
  },
  {
    "portSlug": "juneau",
    "portName": "Juneau",
    "slug": "wildlife-excursions",
    "title": "Juneau Wildlife & Marine Life Shore Excursions | Bears, Eagles & Whales",
    "metaDescription": "Find the best wildlife shore excursions in Juneau. Compare marine whale safaris, Admiralty Island bear flights, and birding adventures.",
    "h1": "Juneau Wildlife & Marine Shore Excursions",
    "eyebrow": "Juneau, Alaska · Coastal Wildlife",
    "typicalDuration": "3.5 to 6.5 hours depending on marine safari vs. floatplane bear flight",
    "meetingLogistics": "Departures coordinate from downtown cruise docks or the Mount Roberts Tramway staging lot.",
    "returnMargin": "Marine safaris require 5-hour port window; fly-in bear tours require 7-hour port window.",
    "weatherSensitivity": "Moderate",
    "weatherBackupAdvice": "Marine wildlife safaris operate effectively in rainy conditions. Remote fly-in floatplane bear excursions to Admiralty Island require good flight ceilings.",
    "cruiseSafetyRule": "Always check total door-to-door transit time for wildlife tours. Marine safaris leave from Auke Bay (20 min drive); bear flights leave from downtown floatplane slips.",
    "overview": [
      "Juneau's unique geography—sandwiched between the nutrient-dense waters of Chatham Strait and the wilderness of the Tongass National Forest—creates a world-class haven for North American wildlife.",
      "Beyond humpback whales, Juneau day tours regularly encounter massive Steller sea lions hauling out on navigation buoys, playful sea otters floating in kelp forests, harbor seals resting on floating ice calved from glaciers, and bald eagles nesting in old-growth spruce trees.",
      "For serious wildlife enthusiasts, day trips to Admiralty Island (known to the Tlingit as Kootznoowoo, 'Fortress of the Bears') boast the highest density of coastal brown bears on earth—more brown bears than the entire lower 48 states combined."
    ],
    "keyHighlights": [
      "Spot bald eagles hunting for salmon right from boat decks and shoreline trees",
      "Observe Steller sea lions sunning themselves on channel markers and rocky reefs",
      "Look for coastal brown bears foraging along river banks and tidal estuaries",
      "Led by marine biologists and certified wildlife naturalists with telephoto spotting gear"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins from ship gangway",
      "travelToSite": "20 mins van transit to launch harbor",
      "activeExperience": "150–240 mins guided wildlife exploration",
      "returnTransit": "20 mins return drive to downtown pier",
      "pierBuffer": "60–90 mins safety margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Juneau Marine Wildlife & Whale Safari",
        "duration": "3.75 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "Cruisers wanting comprehensive marine mammal and eagle viewing",
        "meetingPoint": "Mt. Roberts Tramway Parking",
        "searchQuery": "Juneau marine wildlife safari whale boat",
        "campaignTag": "juneau-wildlife-marine"
      },
      {
        "name": "Admiralty Island Pack Creek Bear Viewing Fly-In",
        "duration": "6 hours",
        "returnMargin": "90 min buffer (needs 8+ hr port call)",
        "bestSuitedFor": "Dedicated wildlife photographers seeking wild brown bears in raw habitat",
        "meetingPoint": "Downtown Juneau Seaplane Float",
        "searchQuery": "Juneau Pack Creek bear viewing floatplane",
        "campaignTag": "juneau-pack-creek-bear"
      }
    ],
    "whatToBring": [
      "Binoculars (waterproof 8x42 or 10x42 are ideal for boat viewing)",
      "DSLR or mirrorless camera with minimum 300mm telephoto reach",
      "Waterproof rain gear including rain jacket and rain pants",
      "Lens cleaning cloth and water-resistant equipment bag"
    ],
    "faqs": [
      {
        "question": "Where can I see bears in Juneau on a cruise stop?",
        "answer": "During late July, August, and September, black bears frequently feed on returning salmon at the Steep Creek viewing platform at Mendenhall Glacier. For brown bears (grizzlies), you must take a floatplane tour to Admiralty Island or Chichagof Island, as brown bears do not inhabit the Juneau road system."
      },
      {
        "question": "How common are bald eagles in Juneau?",
        "answer": "While wildlife sightings cannot be promised, Juneau is home to thousands of bald eagles. You will almost certainly spot dozens perched along the harbor light poles, trees lining Gastineau Channel, and swooping down over salmon runs."
      },
      {
        "question": "Do wildlife tours provide binoculars?",
        "answer": "Most premium wildlife boats provide communal binoculars or lending pairs, but bringing your own personal binoculars ensures you never miss a quick breach or dive."
      }
    ],
    "relatedActivities": [
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      },
      {
        "name": "Mendenhall Glacier Tours",
        "href": "/juneau/mendenhall-glacier-tours"
      },
      {
        "name": "Excursions by Ship Time",
        "href": "/juneau/excursions-by-cruise-ship-time"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Whale Watching vs Glacier Tour",
        "href": "/decision/whale-watching-vs-glacier-tour"
      },
      {
        "name": "Best Alaska Excursions for Families",
        "href": "/decision/best-alaska-excursions-for-families"
      },
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      }
    ]
  },
  {
    "portSlug": "juneau",
    "portName": "Juneau",
    "slug": "excursions-by-cruise-ship-time",
    "title": "Juneau Shore Excursions by Cruise Ship Port Time | Timing & Port Window Guide",
    "metaDescription": "Sort Juneau shore excursions by your ship's port hours. How to calculate true disembarkation times, tour return buffers, and avoid missing the ship.",
    "h1": "Juneau Shore Excursions Sorted by Cruise Ship Time",
    "eyebrow": "Juneau, Alaska · Port Logistics & Timing",
    "typicalDuration": "Customizable based on your ship's 5-hour, 7-hour, or 10-hour port stay",
    "meetingLogistics": "Includes breakdown of all 4 Juneau cruise docks: AJ Dock (requires shuttle), Franklin Dock, Marine Dock, and Steamship Dock.",
    "returnMargin": "Strict enforcement: Tour finish time + 45 minutes must be earlier than all-aboard time.",
    "weatherSensitivity": "Low",
    "weatherBackupAdvice": "Use our timing matrix to pair an early high-weather activity (helicopter) with an afternoon low-weather backup (glacier walk or downtown saloon tour).",
    "cruiseSafetyRule": "Ship all-aboard is always 30 to 45 minutes prior to the published departure time. Always plan your return buffer around the all-aboard time, NEVER the departure time.",
    "overview": [
      "One of the biggest mistakes cruise passengers make in Juneau is miscalculating port timing. A published port call of '1:00 PM to 9:00 PM' does NOT mean you have 8 hours of tour time.",
      "Ship clearance takes 20–30 minutes after tying up. Disembarking 3,000+ passengers down narrow gangways creates lines. If your ship docks at the AJ Dock (South Juneau), you must also board a city shuttle bus to reach the downtown tour departure hub.",
      "This guide organizes Juneau excursions by actual usable port hours, factoring in the golden rule: Tour End Time + 45 Minutes must be before All-Aboard."
    ],
    "keyHighlights": [
      "Clear docking breakdown for AJ Dock vs. Downtown Franklin, Marine, and Steamship berths",
      "Curated tour pairings for 4-5 hour short calls vs. 8-10 hour long port calls",
      "Calculated safety margins accounting for Auke Bay shuttle transit and summer traffic",
      "Actionable fallback protocols if your ship is delayed entering Gastineau Channel"
    ],
    "timingBreakdown": {
      "disembarkation": "Allow 30–45 mins from ship gangway opening to meeting your guide",
      "travelToSite": "Varies (5 mins downtown seaplane, 25 mins Auke Bay/Mendenhall)",
      "activeExperience": "Calibrated to leave at least 75 mins total pier buffer",
      "returnTransit": "Always add 15 mins for AJ Dock shuttle if berthed there",
      "pierBuffer": "Never less than 45 mins before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Short Port Call Whale Watch (4.5 to 6 hr call)",
        "duration": "3.5 hours",
        "returnMargin": "60–90 min buffer",
        "bestSuitedFor": "Ships arriving midday with 5-6 hours total dock time",
        "meetingPoint": "Mt. Roberts Tramway Parking",
        "searchQuery": "Juneau express whale watching tour cruise safe",
        "campaignTag": "juneau-timing-express-whale"
      },
      {
        "name": "Full-Day Glacier & Whale Combo (8 to 11 hr call)",
        "duration": "5.5 hours",
        "returnMargin": "120+ min buffer",
        "bestSuitedFor": "Ships in port all day (e.g., 7:00 AM to 5:00 PM)",
        "meetingPoint": "Mt. Roberts Tramway Parking",
        "searchQuery": "Juneau whale watching Mendenhall combo full day",
        "campaignTag": "juneau-timing-combo-fullday"
      }
    ],
    "whatToBring": [
      "Ship keycard (Stateroom card) required for re-boarding at the security tent",
      "Government-issued photo ID (driver's license or passport)",
      "Watch or phone set to Ship Time (warning: cell phones sometimes sync to local tower time)",
      "Printed or screenshot excursion booking confirmation with emergency local phone number"
    ],
    "faqs": [
      {
        "question": "What is the difference between Ship Time and Local Time in Juneau?",
        "answer": "Most cruise ships stay on Alaska Standard Time (AKST), which matches Juneau local time. However, some ships departing from Seattle or Vancouver remain on Pacific Time (PST). Always confirm whether your ship keeps ship time or local time, and set your manual watch to the ship's clock before walking off the gangway."
      },
      {
        "question": "How do I get from AJ Dock to downtown Juneau?",
        "answer": "The AJ Dock is located approximately 1 mile south of downtown. Cruise lines provide a dedicated shuttle bus running every 10–15 minutes between AJ Dock and the Mount Roberts Tramway parking lot. An all-day shuttle pass typically costs $5 or is included with certain line ticket tiers. Allow 15 minutes each way."
      },
      {
        "question": "What if my tour finishes only 30 minutes before ship departure?",
        "answer": "Do not book it! Most ships set their all-aboard call 30 to 45 minutes before departure. A tour finishing 30 minutes prior to departure means the ship may already be pulling up gangways. Our rule requires your tour to finish at least 45 minutes before all-aboard (which is 75-90 minutes before ship departure)."
      }
    ],
    "relatedActivities": [
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      },
      {
        "name": "Mendenhall Glacier Tours",
        "href": "/juneau/mendenhall-glacier-tours"
      },
      {
        "name": "Helicopter Glacier Landings",
        "href": "/juneau/helicopter-glacier-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Cruises Safe for Ship Window",
        "href": "/decision/excursions-safe-for-cruise-ship-window"
      },
      {
        "name": "Short Port Call Options",
        "href": "/decision/short-port-call-alaska-options"
      },
      {
        "name": "Alaska Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      }
    ]
  },
  {
    "portSlug": "skagway",
    "portName": "Skagway",
    "slug": "white-pass-railway-tours",
    "title": "White Pass & Yukon Route Railway Shore Excursions | Skagway Train Tours",
    "metaDescription": "Compare White Pass Summit train tours in Skagway. Dockside boarding, Bennett Lake routes, passport requirements, and scenic mountain views.",
    "h1": "White Pass & Yukon Route Railway Excursions",
    "eyebrow": "Skagway, Alaska · Historic Mountain Rail",
    "typicalDuration": "2.75 to 3.5 hours for White Pass Summit; 8 hours for Bennett Lake",
    "meetingLogistics": "Trains board directly on the Skagway cruise ship piers (Railroad Dock) or downtown depot within a 5-minute flat walk.",
    "returnMargin": "Summit train returns 60 to 90 minutes before ship departure. Easily fits 6+ hour port calls.",
    "weatherSensitivity": "Low to Moderate",
    "weatherBackupAdvice": "Trains run in rain, fog, and snow. Even if the summit is veiled in cloud, the lower canyon views, trestle bridges, and dramatic gorges remain fully visible.",
    "cruiseSafetyRule": "Train tracks run directly to the Railroad Dock where major cruise ships berth. It is the single most geographically cruise-safe tour in all of Alaska.",
    "overview": [
      "Built in 1898 during the frenzy of the Klondike Gold Rush, the White Pass & Yukon Route (WP&YR) narrow-gauge railway is an International Historic Civil Engineering Landmark—sharing honors with the Panama Canal and Eiffel Tower.",
      "Departing from sea level in Skagway, vintage parlor cars climb nearly 3,000 feet in just 20 miles. The train clings to sheer granite cliffs, crosses wooden trestles suspended over roaring gorges, passes bridal-veil waterfalls, and winds through tunnels carved by hand over a century ago.",
      "Large picture windows and exterior viewing platforms allow passengers to step outside into crisp mountain air to photograph Inspiration Point, Dead Horse Gulch, and the international summit boundary between Alaska and British Columbia, Canada."
    ],
    "keyHighlights": [
      "Climb 2,865 feet to the White Pass Summit through pristine alpine wilderness",
      "Cross historic wooden trestles and peer into 1,000-foot-deep glacial canyons",
      "Exterior open-air viewing platforms for unobstructed mountain photography",
      "Vintage parlor cars heated with historic cast-iron stoves and live narration"
    ],
    "timingBreakdown": {
      "disembarkation": "10 mins walk from gangway directly onto the train platform",
      "travelToSite": "0 mins (train boards directly at the pier)",
      "activeExperience": "150–180 mins round-trip scenic rail ride to White Pass Summit",
      "returnTransit": "0 mins (train drops off right back at the cruise dock)",
      "pierBuffer": "60–120 mins remaining before all-aboard"
    },
    "sampleTours": [
      {
        "name": "White Pass Summit Scenic Railway Excursion",
        "duration": "3 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers of all ages and mobility levels seeking iconic Alaska history and scenery",
        "meetingPoint": "Skagway Cruise Ship Dock / Depot",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "skagway-white-pass-summit"
      },
      {
        "name": "White Pass Train & Klondike Highway Bus Combo",
        "duration": "3.5 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "Travelers who want train one way and scenic motorcoach photo stops the other",
        "meetingPoint": "Downtown Skagway Depot",
        "searchQuery": "Skagway White Pass train bus combo tour",
        "campaignTag": "skagway-train-bus-combo"
      }
    ],
    "whatToBring": [
      "Passport REQUIRED for any rail or bus tour crossing into Canada or traveling the Klondike Highway",
      "Layered clothing (mountain summits are often 15–20°F cooler than sea-level Skagway)",
      "Camera with wide-angle lens for canyon and bridge vistas",
      "Light snacks and bottled water (train cars have fresh water and restrooms on board)"
    ],
    "faqs": [
      {
        "question": "Do I need a passport for the White Pass Summit train?",
        "answer": "For the standard 2.75-hour White Pass Summit Excursion (which turns around at the summit loop without disembarking passengers in Canada), official rules historically allowed travel without passport presentation, but bringing a valid passport is now universally advised. For ANY tour that crosses into the Yukon or connects to buses in British Columbia, a valid passport is legally required for border crossing."
      },
      {
        "question": "Which side of the train has the best views?",
        "answer": "On the climb up from Skagway to the Summit, the LEFT side of the train faces the canyon, trestles, and mountain vistas. On the return trip down, the same seats now face the mountain wall. You can switch seats if space allows or step out onto the exterior viewing platforms."
      },
      {
        "question": "Is the White Pass train wheelchair accessible?",
        "answer": "Yes, designated train cars are equipped with mechanical wheelchair lifts and ADA-accessible seating. Advance reservations for accessible seating are required due to limited lift car capacity."
      }
    ],
    "relatedActivities": [
      {
        "name": "Yukon Border Excursions",
        "href": "/skagway/yukon-excursions"
      },
      {
        "name": "Gold Rush History Tours",
        "href": "/skagway/gold-rush-tours"
      },
      {
        "name": "Scenic Mountain Drives",
        "href": "/skagway/scenic-mountain-routes"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Best Excursion for First-Time Cruisers",
        "href": "/decision/best-excursion-first-time-alaska-cruisers"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      }
    ]
  },
  {
    "portSlug": "skagway",
    "portName": "Skagway",
    "slug": "yukon-excursions",
    "title": "Skagway to Yukon Excursions | Suspension Bridge, Carcross & Emerald Lake",
    "metaDescription": "Cross the Canadian border into the Yukon from Skagway. Compare Yukon Suspension Bridge, Carcross Desert, and Emerald Lake small-group tours.",
    "h1": "Skagway Yukon Border & Lake Excursions",
    "eyebrow": "Skagway, Alaska · Yukon Territory, Canada",
    "typicalDuration": "5.5 to 7.5 hours depending on Carcross vs. Emerald Lake turnaround",
    "meetingLogistics": "Small-group vans and comfortable mini-coaches pick up directly outside the Skagway cruise ship piers.",
    "returnMargin": "Requires minimum 7.5-hour port call. Returns you to Skagway 60 to 90 minutes before all-aboard.",
    "weatherSensitivity": "Moderate",
    "weatherBackupAdvice": "Once you cross the Coastal Mountains into Canada, the weather changes drastically. The Yukon sits in a sub-arctic rain shadow—meaning it is often bright, dry, and sunny while Skagway is overcast.",
    "cruiseSafetyRule": "Canada Customs clearance takes 10–20 minutes at Fraser. Reputable operators build dedicated Canadian and US customs buffer times into every Yukon itinerary.",
    "overview": [
      "Leaving coastal Alaska behind and ascending over the 3,292-foot White Pass into the sub-arctic wilderness of northern British Columbia and the Canadian Yukon is one of the most geographically diverse road trips in North America.",
      "The South Klondike Highway traces the path forged by gold prospectors in 1898. You will pass the moon-like Tormented Valley with its bonsai-like stunted pine trees, cross the dramatic Tutshi and Tagish lake systems, and cross the pedestrian Yukon Suspension Bridge spanning the churning Tutshi River canyon.",
      "Extended excursions continue to the First Nations village of Carcross, the world-famous miniature 'Carcross Desert' (sand dunes in an alpine valley), and the surreal green-and-turquoise waters of Emerald Lake."
    ],
    "keyHighlights": [
      "Cross the international border into British Columbia and the Yukon Territory",
      "Walk across the 200-foot-long Yukon Suspension Bridge over roaring river rapids",
      "Photograph the surreal, vivid turquoise waters of glacial Emerald Lake",
      "Explore the historic Gold Rush frontier trading post and totem poles in Carcross"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins to board tour van at the pier",
      "travelToSite": "60 mins scenic mountain climb and Canada Customs clearance",
      "activeExperience": "180–240 mins exploring suspension bridge, Carcross, and viewpoints",
      "returnTransit": "75 mins return drive down Klondike Highway and US Customs check",
      "pierBuffer": "60–90 mins buffer before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Yukon Discovery & Suspension Bridge Tour",
        "duration": "5 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers wanting Canadian alpine scenery without an all-day commitment",
        "meetingPoint": "Skagway Pier Tour Pick-up Area",
        "searchQuery": "Skagway Yukon suspension bridge discovery tour",
        "campaignTag": "skagway-yukon-suspension"
      },
      {
        "name": "Full-Day Yukon, Carcross & Emerald Lake Tour",
        "duration": "7 hours",
        "returnMargin": "75 min buffer (needs 8.5+ hr port call)",
        "bestSuitedFor": "Photographers and travelers wanting to reach deep sub-arctic lakes and desert dunes",
        "meetingPoint": "Skagway Pier Tour Pick-up Area",
        "searchQuery": "Skagway Yukon Carcross Emerald Lake tour",
        "campaignTag": "skagway-yukon-emerald-lake"
      }
    ],
    "whatToBring": [
      "ORIGINAL VALID PASSPORT REQUIRED for all guests (cruises cannot accept photocopies or driver's licenses for Canadian land border entry)",
      "Appropriate Canadian travel visas if required based on your citizenship",
      "Camera with extra memory cards (the landscape changes dramatically every 15 minutes)",
      "Layered clothing with windproof jacket for exposed suspension bridge overlooks"
    ],
    "faqs": [
      {
        "question": "Is a passport mandatory for all Yukon tours?",
        "answer": "Yes, strictly mandatory. You will physically disembark or clear Canadian Customs at Fraser, BC, and pass through US Customs and Border Protection on the return into Skagway. Without a valid physical passport book, you will not be permitted to board the vehicle."
      },
      {
        "question": "Is the road to the Yukon scary or prone to motion sickness?",
        "answer": "The South Klondike Highway is a modern, fully paved, two-lane federal highway with guardrails. While it ascends mountain passes with dramatic valley drop-offs, it does not feature hairpin switchbacks. Travelers with mild motion sensitivity generally handle the highway comfortably."
      },
      {
        "question": "Will my cell phone work in the Yukon?",
        "answer": "Cell coverage drops shortly after leaving Skagway and remains absent through much of the Tormented Valley until reaching Carcross. Tour operators carry satellite communications devices or commercial two-way radios for safety."
      }
    ],
    "relatedActivities": [
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Scenic Mountain Routes",
        "href": "/skagway/scenic-mountain-routes"
      },
      {
        "name": "Gold Rush Tours",
        "href": "/skagway/gold-rush-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Cruises Safe for Ship Window",
        "href": "/decision/excursions-safe-for-cruise-ship-window"
      },
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Excursions With Transportation",
        "href": "/decision/alaska-excursions-with-transportation"
      }
    ]
  },
  {
    "portSlug": "skagway",
    "portName": "Skagway",
    "slug": "gold-rush-tours",
    "title": "Skagway Gold Rush History & Town Tours | Klondike National Park",
    "metaDescription": "Step back into 1898 in Skagway. Explore historic Broadway saloons, the Gold Rush cemetery, Reid Falls, and Klondike National Historical Park.",
    "h1": "Skagway Klondike Gold Rush History Tours",
    "eyebrow": "Skagway, Alaska · History & Culture",
    "typicalDuration": "1.5 to 2.5 hours (extremely easy to pair with afternoon activities)",
    "meetingLogistics": "Departures leave right from the foot of the cruise docks or Broadway Street, less than 5 minutes from the gangway.",
    "returnMargin": "Requires only 3-hour port call. Leaves 2 to 4 hours of buffer time.",
    "weatherSensitivity": "Low",
    "weatherBackupAdvice": "Skagway historic tours use heated streetcar trolleys or mini-buses and visit restored indoor historic structures. Completely weather-safe in rain or wind.",
    "cruiseSafetyRule": "Downtown Skagway is only 7 blocks long. Historic town tours never leave the immediate local road system, making them zero-risk for missing your ship.",
    "overview": [
      "In the summer of 1897, Skagway was transformed overnight from a lone homestead into a lawless tent city of 30,000 stampeders determined to trek over the Chilkoot and White Pass trails to the goldfields of Dawson City.",
      "Today, the entire historic downtown district of Skagway is preserved as part of the Klondike Gold Rush National Historical Park. False-front wooden architecture, boardwalk sidewalks, and restored saloons like the Red Onion Saloon evoke the wild frontier days of outlaw Soapy Smith.",
      "Historic city and cemetery tours explore Skagway's origins, visit the historic Gold Rush Cemetery where town hero Frank Reid and crime boss Soapy Smith are buried, and stop for short nature walks to cascading Reid Falls."
    ],
    "keyHighlights": [
      "Ride restored 1920s vintage streetcar trolleys with costumed historical guides",
      "Visit the Gold Rush Cemetery and hear the true story of the famous 1898 gunfight",
      "Stroll short rainforest trails to the base of 100-foot-tall Reid Falls",
      "Learn about brothel madams, con artists, and Klondike prospectors"
    ],
    "timingBreakdown": {
      "disembarkation": "10 mins walk into downtown Broadway",
      "travelToSite": "5 mins trolley ride through historic district",
      "activeExperience": "90 mins guided storytelling, cemetery walk, and scenic overlook",
      "returnTransit": "5 mins trolley return to ship dock",
      "pierBuffer": "120+ mins remaining before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Skagway Historic Streetcar & Gold Rush Highlights",
        "duration": "1.5 hours",
        "returnMargin": "120+ min buffer",
        "bestSuitedFor": "Seniors, history buffs, and cruisers wanting a short, low-stress overview",
        "meetingPoint": "Broadway & 2nd Ave / Pier pick-up",
        "searchQuery": "Skagway historic streetcar tour Gold Rush",
        "campaignTag": "skagway-streetcar-history"
      },
      {
        "name": "Red Onion Saloon Historic Brothel Tour & Museum",
        "duration": "1 hour",
        "returnMargin": "180+ min buffer",
        "bestSuitedFor": "Adults and couples looking for lively, entertaining Gold Rush storytelling",
        "meetingPoint": "Red Onion Saloon on Broadway",
        "searchQuery": "Skagway Red Onion Saloon brothel tour",
        "campaignTag": "skagway-red-onion-saloon"
      }
    ],
    "whatToBring": [
      "Comfortable flat walking shoes for wooden boardwalks and gravel cemetery paths",
      "Light jacket or sweater",
      "Camera for capturing historic frontier architecture and scenic overlooks",
      "Small cash bills for museum admissions or local saloon treats"
    ],
    "faqs": [
      {
        "question": "Can I walk to downtown Skagway from the cruise ship?",
        "answer": "Yes! Skagway has the most accessible port setup in Alaska. Broadway Street begins less than a 5-to-10-minute flat walk from the Ore and Broadway docks. The Railroad Dock is a 10-minute walk or a 3-minute municipal SMART bus ride into town."
      },
      {
        "question": "Is the Gold Rush Cemetery accessible for wheelchairs?",
        "answer": "The cemetery approach has packed gravel paths, but the trail to Reid Falls has exposed tree roots and a slight incline. Guests with limited mobility can comfortably enjoy the cemetery grounds from the parking plaza."
      },
      {
        "question": "Can I do both a Gold Rush history tour and the White Pass train?",
        "answer": "Yes, easily. A 1.5-hour morning history tour pairs seamlessly with a 2.75-hour afternoon train departure on any port call of 6 hours or longer."
      }
    ],
    "relatedActivities": [
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Excursions by Duration",
        "href": "/skagway/excursions-by-duration-and-ship-window"
      },
      {
        "name": "Scenic Mountain Routes",
        "href": "/skagway/scenic-mountain-routes"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      },
      {
        "name": "Short Port Call Options",
        "href": "/decision/short-port-call-alaska-options"
      }
    ]
  },
  {
    "portSlug": "skagway",
    "portName": "Skagway",
    "slug": "scenic-mountain-routes",
    "title": "Skagway Scenic Mountain Drives | Klondike Highway Overlooks & Waterfalls",
    "metaDescription": "Discover the best scenic mountain routes in Skagway. Compare small-group van tours up the Klondike Highway, Tormented Valley, and alpine passes.",
    "h1": "Skagway Scenic Mountain Routes & Overlooks",
    "eyebrow": "Skagway, Alaska · Alpine Vistas & Drives",
    "typicalDuration": "2.5 to 4 hours round-trip",
    "meetingLogistics": "Vans meet directly at the foot of your ship gangway in Skagway.",
    "returnMargin": "Requires 4.5 to 5-hour port window. Provides 60-90 minute typical margin before all-aboard.",
    "weatherSensitivity": "Moderate",
    "weatherBackupAdvice": "Mountain highways offer high flexibility: if high summit passes are foggy, guides adjust stops to lower valley waterfalls, river gorges, and historic Dyea flats.",
    "cruiseSafetyRule": "Small-group passenger vans move faster and make more spontaneous photo stops than large 50-passenger coaches, maximizing your time ashore.",
    "overview": [
      "While many travelers opt for the railway, driving the scenic South Klondike Highway in a high-roof sightseeing van or private vehicle offers unmatched photo opportunities and flexibility.",
      "The highway parallels the White Pass trail, providing sweeping views of the Skagway River valley, Pitchfork Falls (one of Alaska's tallest cascades), Bridal Veil Falls, and the dramatic William Moore suspension bridge over an active earthquake fault line.",
      "Unlike trains which cannot stop along the tracks, van tours pull over at premier scenic turnouts, allowing you to step out, breathe crisp alpine air, and capture postcard-perfect photos without window glare."
    ],
    "keyHighlights": [
      "Stop at iconic overlooks: Pitchfork Falls, Moore Bridge, and Skagway City Viewpoint",
      "Travel through distinct ecological zones from coastal rainforest to sub-alpine tundra",
      "Flexible photo stops dictated by current sunlight and mountain cloud cover",
      "Small-group vehicles (14–24 seats) for personalized narrative and quick loading"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins to meet vehicle at pier",
      "travelToSite": "20 mins climbing out of coastal Skagway valley",
      "activeExperience": "120–150 mins scenic drive with 4–6 dedicated scenic photo stops",
      "returnTransit": "25 mins descending back to sea level",
      "pierBuffer": "75–90 mins buffer before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Skagway Mountain Summit & Waterfall Van Tour",
        "duration": "2.5 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers wanting stunning mountain photos without crossing into Canada",
        "meetingPoint": "Skagway Cruise Pier Parking",
        "searchQuery": "Skagway mountain summit waterfall scenic van tour",
        "campaignTag": "skagway-scenic-mountain-van"
      },
      {
        "name": "Historic Dyea Valley & Rainforest Scenic Tour",
        "duration": "3 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Travelers seeking tranquil nature, coastal tidal flats, and Chilkoot Trail history",
        "meetingPoint": "Skagway Cruise Pier Parking",
        "searchQuery": "Skagway Dyea historic valley scenic tour",
        "campaignTag": "skagway-dyea-valley"
      }
    ],
    "whatToBring": [
      "Camera with wide and telephoto lenses",
      "Warm windproof jacket (mountain ridge viewpoints can be windy and brisk)",
      "Flat walking shoes for stepping onto gravel roadside overlooks",
      "Sunglasses to cut mountain snow and water glare"
    ],
    "faqs": [
      {
        "question": "Is the road scenic drive better than the White Pass train?",
        "answer": "They complement each other. The train provides rich historic nostalgia and rides over high cliffside trestles inaccessible by road. The highway van tour allows you to physically stop, step out, frame photographs without motion blur, and visit roadside waterfalls."
      },
      {
        "question": "Do highway summit tours require passports?",
        "answer": "If the tour turns around at the official 'Welcome to Alaska' sign on the US side of the summit, no passport is required. If the tour continues past the border marker to the Canadian customs post, a passport is mandatory. Always verify the turnaround point before booking."
      },
      {
        "question": "Are child car seats required for van tours in Skagway?",
        "answer": "Commercial passenger vans operated by licensed tour companies in Alaska are generally exempt from strict child safety seat mandates, but reputable operators will provide or accommodate booster seats upon request."
      }
    ],
    "relatedActivities": [
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Yukon Border Excursions",
        "href": "/skagway/yukon-excursions"
      },
      {
        "name": "Excursions by Duration",
        "href": "/skagway/excursions-by-duration-and-ship-window"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Flightseeing vs Land Excursion",
        "href": "/decision/flightseeing-vs-land-excursion"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Best Excursions for Families",
        "href": "/decision/best-alaska-excursions-for-families"
      }
    ]
  },
  {
    "portSlug": "skagway",
    "portName": "Skagway",
    "slug": "excursions-by-duration-and-ship-window",
    "title": "Skagway Excursions by Duration & Port Window | Cruise Timing Guide",
    "metaDescription": "Match your Skagway shore excursion to your ship's port hours. How to safely fit the White Pass train, Yukon tours, or local history without missing the ship.",
    "h1": "Skagway Excursions by Duration & Ship Window",
    "eyebrow": "Skagway, Alaska · Timing & Logistics",
    "typicalDuration": "Tailored to 6-hour, 8-hour, or 12-hour Skagway port schedules",
    "meetingLogistics": "Detailed walking and shuttle directions from Railroad Dock, Broadway Dock, and Ore Dock.",
    "returnMargin": "Ensures Tour End Time + 45 Minutes is well ahead of ship all-aboard.",
    "weatherSensitivity": "Low",
    "weatherBackupAdvice": "Always verify passport readiness before committing to a 6+ hour Yukon tour—lacking a physical passport will forfeit the tour on the spot.",
    "cruiseSafetyRule": "Because Skagway docks are directly adjacent to town, it has the shortest transit overhead of any port. A 7-hour call allows true 5.5-hour excursions safely.",
    "overview": [
      "Skagway is one of the easiest ports in Alaska to plan because cruise ships dock within walking distance of downtown. However, excursion durations in Skagway vary dramatically—from a quick 1-hour saloon walk to an 8-hour sub-arctic expedition into the Yukon Territory.",
      "Matching your desired activity to your specific ship arrival and departure hours is critical. A cruise call from 7:00 AM to 4:00 PM requires a vastly different plan than a long call from 7:00 AM to 8:00 PM.",
      "This guide breaks down exact schedules by cruise ship port window, giving you clear minimum hours needed for the White Pass Summit, Yukon excursions, and town walking tours."
    ],
    "keyHighlights": [
      "Port timing formula: Arrive -> 30 min disembark -> Tour -> 60+ min return buffer -> All-Aboard",
      "Analysis of dock locations: Railroad Dock (North/South), Broadway Dock, and Ore Dock",
      "Clear passport vs. non-passport excursion duration buckets",
      "Best excursion pairings for extended 10+ hour port days"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins from gangway to dockside train or tour van",
      "travelToSite": "Minimal overhead (most tours depart right at the pier or depot)",
      "activeExperience": "Calibrated to your exact ship dock window",
      "returnTransit": "Under 10 mins back to the gangway from anywhere in town",
      "pierBuffer": "Typical minimum 60–90 mins prior to all-aboard"
    },
    "sampleTours": [
      {
        "name": "Express 3-Hour Summit Rail (Fits 5 to 6 hr call)",
        "duration": "2.75 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Short morning or afternoon port stays",
        "meetingPoint": "Railroad Dock Pier",
        "searchQuery": "Skagway White Pass train 3 hour summit",
        "campaignTag": "skagway-timing-train-express"
      },
      {
        "name": "Yukon Border & Rail Combo (Needs 8+ hr call)",
        "duration": "6.5 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "Full-day port calls with valid passports for all party members",
        "meetingPoint": "Skagway Pier Tour Pick-up",
        "searchQuery": "Skagway Yukon train bus combo full day",
        "campaignTag": "skagway-timing-yukon-fullday"
      }
    ],
    "whatToBring": [
      "Ship keycard and government photo ID",
      "Physical passport book if booking any route exceeding 3 hours that reaches the Canadian border",
      "Watch set strictly to ship time",
      "Light daypack with warm layers and rain jacket"
    ],
    "faqs": [
      {
        "question": "Can I do two tours in Skagway in one day?",
        "answer": "Yes, if your ship is in port for 8 or more hours. A popular combination is an early morning 2.75-hour White Pass Summit train (e.g. 8:00 AM to 10:45 AM), followed by a 1-hour lunch break in town, and an afternoon 1.5-hour historic streetcar or brewery tour."
      },
      {
        "question": "What is the rockslide situation at the Railroad Dock?",
        "answer": "In recent years, geotechnical rockslide mitigation on the cliff above the Railroad Dock led to temporary passenger shuttle tenders or perimeter bus boarding. Follow your ship's specific daily onboard announcements for exact gangway disembarkation points in Skagway."
      },
      {
        "question": "What time is all-aboard in Skagway?",
        "answer": "All-aboard is almost universally scheduled exactly 30 minutes before your ship's published departure time. For a 5:00 PM departure, all-aboard is 4:30 PM. Your tour must conclude by 3:45 PM at the latest."
      }
    ],
    "relatedActivities": [
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Yukon Border Excursions",
        "href": "/skagway/yukon-excursions"
      },
      {
        "name": "Gold Rush Tours",
        "href": "/skagway/gold-rush-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Cruises Safe for Ship Window",
        "href": "/decision/excursions-safe-for-cruise-ship-window"
      },
      {
        "name": "Short Port Call Options",
        "href": "/decision/short-port-call-alaska-options"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      }
    ]
  },
  {
    "portSlug": "ketchikan",
    "portName": "Ketchikan",
    "slug": "misty-fjords-tours",
    "title": "Misty Fjords National Monument Shore Excursions | Flight & Boat Tours",
    "metaDescription": "Compare Misty Fjords tours in Ketchikan. Floatplane fly-and-land tours vs. high-speed wilderness catamarans, departure docks, and weather backups.",
    "h1": "Misty Fjords National Monument Excursions",
    "eyebrow": "Ketchikan, Alaska · Fjords & Floatplanes",
    "typicalDuration": "2 hours for floatplane flight; 4.5 to 5 hours for wilderness catamaran boat",
    "meetingLogistics": "Floatplanes meet directly on the downtown Ketchikan waterfront harbor (Berths 1–4). Catamarans board directly from the cruise ship docks.",
    "returnMargin": "Floatplane requires 4-hour port call (90 min buffer); Boat tour requires 6.5-hour port call (75 min buffer).",
    "weatherSensitivity": "Moderate to High",
    "weatherBackupAdvice": "Ketchikan receives over 140 inches of rain annually. Misty Fjords is famously dramatic in mist and rain, when hundreds of temporary waterfalls cascade down the 3,000-foot granite walls. However, low cloud ceilings can ground floatplanes—keep a totem or cultural backup in mind.",
    "cruiseSafetyRule": "Downtown floatplane slips sit 200 yards from Berth 2 and Berth 3. Floatplane tours have virtually zero transit overhead in Ketchikan.",
    "overview": [
      "Encompassing 2.3 million acres of pristine coastal wilderness, Misty Fjords National Monument is Alaska's answer to the Norwegian fjords. Carved by massive glaciers during the last ice age, vertical granite cliffs rise 3,000 feet straight out of deep ocean channels.",
      "There are two distinct ways to experience Misty Fjords from your cruise ship: by air on a floatplane tour that lands on an alpine lake or remote salt fjord, or by sea on a high-speed expedition catamaran cruising past Rudyerd Bay, New Eddystone Rock, and Punchbowl Cove.",
      "The floatplane gives you an eagle's-eye perspective on hanging valleys, pristine mountain tarns, and sheer rock precipices, while the boat cruise lets you look straight up 3,000 feet from water level and feel the spray of cascading waterfalls."
    ],
    "keyHighlights": [
      "Soar past 3,000-foot sheer granite walls rising straight out of the ocean",
      "Floatplane water landing on remote wilderness fjords or alpine lakes",
      "Circle the iconic 237-foot-tall New Eddystone Rock volcanic basalt pillar",
      "Witness hundreds of cascades and waterfalls ribboning down cliff faces"
    ],
    "timingBreakdown": {
      "disembarkation": "10 mins walk from ship gangway to floatplane dock",
      "travelToSite": "5 mins taxiing out into Tongass Narrows",
      "activeExperience": "75–90 mins airborne flight and fjord landing",
      "returnTransit": "5 mins taxi back to harbor slip",
      "pierBuffer": "90–120 mins margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Misty Fjords Floatplane Flight & Remote Water Landing",
        "duration": "2 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers wanting breathtaking aerial wilderness views in a compact time window",
        "meetingPoint": "Downtown Ketchikan Waterfront Dock",
        "searchQuery": "Misty Fjords floatplane flight remote landing Ketchikan",
        "campaignTag": "ketchikan-misty-floatplane"
      },
      {
        "name": "Misty Fjords Wilderness Catamaran Boat Cruise",
        "duration": "4.5 hours",
        "returnMargin": "75 min buffer (needs 6+ hr port call)",
        "bestSuitedFor": "Travelers who prefer to stay on the water and avoid small aircraft",
        "meetingPoint": "Ketchikan Cruise Ship Dock",
        "searchQuery": "Misty Fjords wilderness boat cruise catamaran Ketchikan",
        "campaignTag": "ketchikan-misty-boat"
      }
    ],
    "whatToBring": [
      "Polarized sunglasses to cut through cockpit window reflections",
      "Waterproof rain jacket (mist and spray are common during water landings)",
      "Camera with wide-angle lens for framing towering cliff faces",
      "Warm sweater or fleece layer"
    ],
    "faqs": [
      {
        "question": "Is floatplane or boat better for Misty Fjords?",
        "answer": "Floatplanes take only 2 hours total and let you appreciate the vast scale of hanging valleys, alpine lakes, and icefield terrain. Boat tours take 4.5 to 5 hours and offer a profound sense of scale looking up at towering vertical cliffs. If short on time, choose the floatplane; if nervous about flying, choose the boat."
      },
      {
        "question": "Does it rain too much in Ketchikan for Misty Fjords to be worth it?",
        "answer": "Rain actually improves the experience! In dry weather, many of the cliffside waterfalls dry up. In rain and overcast conditions, hundreds of waterfalls come alive, and low-hanging wisps of cloud cling to the granite crags—creating the mystical atmosphere that gives the monument its name."
      },
      {
        "question": "What happens if our ship docks at Ward Cove instead of Downtown Ketchikan?",
        "answer": "Ward Cove is located 7 miles north of downtown Ketchikan (used primarily by Norwegian and Oceania ships). A complimentary shuttle runs between Ward Cove and downtown, taking 20 minutes each way. If docking at Ward Cove, add 45 minutes of total buffer to any downtown tour departure."
      }
    ],
    "relatedActivities": [
      {
        "name": "Ketchikan Flightseeing",
        "href": "/ketchikan/flightseeing"
      },
      {
        "name": "Floatplane Excursions",
        "href": "/ketchikan/floatplane-excursions"
      },
      {
        "name": "Wildlife & Rainforest Tours",
        "href": "/ketchikan/wildlife-and-rainforest-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Flightseeing vs Land Excursion",
        "href": "/decision/flightseeing-vs-land-excursion"
      },
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      }
    ]
  },
  {
    "portSlug": "ketchikan",
    "portName": "Ketchikan",
    "slug": "flightseeing",
    "title": "Ketchikan Flightseeing Tours | Floatplanes, Fjords & Bear Habitats",
    "metaDescription": "Fly over the Inside Passage from Ketchikan. Compare floatplane tours, glacier lakes, coastal mountain passes, and remote wilderness landings.",
    "h1": "Ketchikan Seaplane & Floatplane Flightseeing",
    "eyebrow": "Ketchikan, Alaska · Aviation & Aerial Vistas",
    "typicalDuration": "1.75 to 2.5 hours door-to-door",
    "meetingLogistics": "Floatplanes depart from dock facilities located along the downtown boardwalk, directly opposite the cruise ship berths.",
    "returnMargin": "Requires minimum 3.5-hour port window. Generates 90+ minutes of return buffer.",
    "weatherSensitivity": "Moderate to High",
    "weatherBackupAdvice": "Ketchikan pilots are among the most experienced bush aviators in the world. If low cloud ceilings prevent entering Misty Fjords, pilots often reroute to lower-elevation coastal wildlife straits or process a refund per operator terms.",
    "cruiseSafetyRule": "Downtown harbor takeoffs eliminate any vehicle transit. You step off your cruise ship gangway and onto the floatplane dock within 5 to 10 minutes.",
    "overview": [
      "Ketchikan is the floatplane capital of North America. Without road connections to the rest of Alaska, bush planes are the lifeblood of Southeast Alaska, carrying mail, cargo, and passengers to remote islands and logging camps.",
      "Taking off from the protected waters of Tongass Narrows, floatplane flightseeing tours provide breathtaking aerial vistas over remote rainforest archipelagos, emerald bays, abandoned cannery sites, and cascading alpine waterfalls.",
      "Every tour includes two-way pilot headsets, window-seat configurations on high-wing de Havilland aircraft, and an exciting water landing on a secluded saltwater inlet or mirror-still mountain lake."
    ],
    "keyHighlights": [
      "Authentic water takeoff and landing alongside your cruise ship in Tongass Narrows",
      "High-wing aircraft design ensures every single passenger has an unobstructed window seat",
      "Fly over remote Tongass National Forest islands where no roads exist",
      "Touch down on secluded saltwater bays where only silence and nature surround you"
    ],
    "timingBreakdown": {
      "disembarkation": "10 mins walk along downtown harbor boardwalk",
      "travelToSite": "5 mins safety briefing and dockside boarding",
      "activeExperience": "60–75 mins flight and water landing on remote fjord",
      "returnTransit": "5 mins taxi back to downtown dock",
      "pierBuffer": "90–120 mins margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Ketchikan Wilderness Harbor & Fjord Flightseeing",
        "duration": "1.75 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers wanting an exhilarating scenic flight with minimal time ashore",
        "meetingPoint": "Downtown Ketchikan Harbor Float",
        "searchQuery": "Ketchikan floatplane wilderness scenic flight",
        "campaignTag": "ketchikan-flight-wilderness"
      },
      {
        "name": "Extended Fjord Flight & Alpine Lake Landing",
        "duration": "2.25 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "Photographers seeking pristine high-alpine wilderness and crystal-clear lake water",
        "meetingPoint": "Downtown Ketchikan Harbor Float",
        "searchQuery": "Ketchikan floatplane alpine lake landing tour",
        "campaignTag": "ketchikan-flight-alpine-lake"
      }
    ],
    "whatToBring": [
      "Camera or smartphone with clean lens",
      "Sunglasses to cut water and cloud reflections",
      "Light jacket or windbreaker",
      "Government photo ID matching cruise records"
    ],
    "faqs": [
      {
        "question": "Is a floatplane takeoff scary?",
        "answer": "Most passengers find water takeoffs remarkably smooth compared to runway departures. The aircraft glides across the water on dual aluminum pontoons, gently lifting off with none of the sudden bumps or tire thuds experienced on asphalt."
      },
      {
        "question": "Can children fly on Ketchikan floatplanes?",
        "answer": "Yes, children of all ages are welcome. Infants under age 2 can fly on an adult's lap. Child-sized aviation headsets are provided so kids can hear the pilot's narrative and speak to their parents."
      },
      {
        "question": "How do I know if my ship docks at Ward Cove or Downtown?",
        "answer": "Check your cruise itinerary or boarding documents. Docks 1, 2, 3, and 4 are Downtown (Princess, Holland America, Royal Caribbean, Celebrity). Berth 'Ward Cove' is 7 miles north (Norwegian Cruise Line, Oceania, Regent). Free shuttle buses connect Ward Cove to downtown."
      }
    ],
    "relatedActivities": [
      {
        "name": "Misty Fjords Tours",
        "href": "/ketchikan/misty-fjords-tours"
      },
      {
        "name": "Floatplane Excursions",
        "href": "/ketchikan/floatplane-excursions"
      },
      {
        "name": "Bear Viewing Excursions",
        "href": "/ketchikan/bear-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Flightseeing vs Land Excursion",
        "href": "/decision/flightseeing-vs-land-excursion"
      },
      {
        "name": "Short Port Call Options",
        "href": "/decision/short-port-call-alaska-options"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      }
    ]
  },
  {
    "portSlug": "ketchikan",
    "portName": "Ketchikan",
    "slug": "wildlife-and-rainforest-tours",
    "title": "Ketchikan Wildlife & Rainforest Shore Excursions | Coastal Ecosystems",
    "metaDescription": "Explore the Tongass temperate rainforest from Ketchikan. Compare Herring Cove wildlife walks, marine boat safaris, eagle centers, and canopy walks.",
    "h1": "Ketchikan Wildlife & Rainforest Excursions",
    "eyebrow": "Ketchikan, Alaska · Temperate Rainforest",
    "typicalDuration": "3 to 4 hours round-trip",
    "meetingLogistics": "Coaches and safari vans pick up at the Ketchikan cruise berth tour staging plazas.",
    "returnMargin": "Requires 4.5-hour port window. Returns you with 60 to 90 minutes of ship safety margin.",
    "weatherSensitivity": "Low",
    "weatherBackupAdvice": "The Tongass is a temperate rainforest—moss, ferns, towering western red cedars, and sitka spruce thrive in wet weather. Rain enhances the vibrant greenery and brings salmon upstream.",
    "cruiseSafetyRule": "Rainforest sanctuary tours follow paved roads south to Herring Cove (15 min drive). Transit times are predictable and reliable.",
    "overview": [
      "Ketchikan sits in the heart of the Tongass National Forest—the largest intact temperate rainforest remaining on Earth. Towering Sitka spruce, western hemlock, and giant red cedars draped in hanging moss create a verdant canopy teeming with wildlife.",
      "Guided rainforest walks explore private sanctuaries like the Alaska Rainforest Sanctuary at Herring Cove. Elevated boardwalks wind through moss-carpeted forest floors, alongside salmon-spawning estuaries where bald eagles congregate by the dozens.",
      "During peak salmon season from July through September, Herring Cove is one of the most reliable places along the road system to spot wild black bears and harbor seals fishing for returning salmon at the river mouth."
    ],
    "keyHighlights": [
      "Walk elevated boardwalks through centuries-old giant cedar and spruce groves",
      "Watch bald eagles perching in trees and fishing along tidal estuaries",
      "Visit the Alaska Raptor Center exhibit and master native totem carvers at work",
      "Spot black bears, harbor seals, and herons feeding on spawning salmon runs (mid-July–Sept)"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins to meet guide at berth plaza",
      "travelToSite": "15 mins scenic coastal drive to Herring Cove",
      "activeExperience": "120–150 mins guided forest walk, eagle sanctuary, and carver studio",
      "returnTransit": "15 mins drive back to downtown Ketchikan",
      "pierBuffer": "60–90 mins margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Alaska Rainforest Sanctuary & Wildlife Walk",
        "duration": "3 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Families, multi-generational groups, and nature lovers wanting easy walking paths",
        "meetingPoint": "Ketchikan Berth Tour Bus Staging",
        "searchQuery": "Ketchikan Alaska rainforest sanctuary wildlife walk",
        "campaignTag": "ketchikan-rainforest-sanctuary"
      },
      {
        "name": "Rainforest Canopy Zipline & Tree Bridge Adventure",
        "duration": "3.5 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "Thrill-seekers and active families wanting to glide over forest canopy",
        "meetingPoint": "Ketchikan Berth Tour Bus Staging",
        "searchQuery": "Ketchikan rainforest canopy zipline adventure",
        "campaignTag": "ketchikan-rainforest-zipline"
      }
    ],
    "whatToBring": [
      "Reliable waterproof rain jacket with hood (ponchos tear in rainforest brush)",
      "Comfortable waterproof walking shoes or rubber boots",
      "Camera with rain protective cover or smartphone in water-resistant case",
      "Binoculars for spotting perched eagles in high spruce boughs"
    ],
    "faqs": [
      {
        "question": "Are the rainforest walking trails difficult?",
        "answer": "No. The trails at the Alaska Rainforest Sanctuary and Totem Bight are flat, well-maintained gravel paths or elevated wooden boardwalks. They are gentle and suitable for guests of all ages who can walk at an easy stroll for about a mile."
      },
      {
        "question": "Will I see bears on a rainforest walk?",
        "answer": "From mid-July through September, wild black bears frequently feed on salmon at Herring Cove. Sightings are wild and natural, so while sightings depend on wild animal movement, late summer tours have a very high encounter rate."
      },
      {
        "question": "What if it pours rain in Ketchikan?",
        "answer": "Tours operate normally! The forest canopy provides a natural umbrella, filtering the rain into a pleasant mist. The rich scent of cedar needles and the deep green luster of moss are at their absolute best in wet weather."
      }
    ],
    "relatedActivities": [
      {
        "name": "Ketchikan Bear Tours",
        "href": "/ketchikan/bear-tours"
      },
      {
        "name": "Totem & Cultural Tours",
        "href": "/ketchikan/totem-and-cultural-tours"
      },
      {
        "name": "Misty Fjords Tours",
        "href": "/ketchikan/misty-fjords-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      },
      {
        "name": "Best Alaska Excursions for Families",
        "href": "/decision/best-alaska-excursions-for-families"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      }
    ]
  },
  {
    "portSlug": "ketchikan",
    "portName": "Ketchikan",
    "slug": "bear-tours",
    "title": "Ketchikan Bear Viewing Shore Excursions | Anan Creek & Traitors Cove",
    "metaDescription": "Experience wild Alaska bears in Ketchikan. Compare fly-in floatplane tours to Anan Creek and Traitors Cove with local road-based salmon estuary tours.",
    "h1": "Ketchikan Bear Viewing Shore Excursions",
    "eyebrow": "Ketchikan, Alaska · Black & Brown Bears",
    "typicalDuration": "4.5 to 5.5 hours for fly-in wilderness platforms; 3 hours for road-based Herring Cove",
    "meetingLogistics": "Floatplanes depart directly from downtown Ketchikan harbor; vans depart from cruise berth plazas.",
    "returnMargin": "Fly-in tours require 6.5-hour port call; road-based tours require 4.5-hour port call.",
    "weatherSensitivity": "Moderate to High",
    "weatherBackupAdvice": "Fly-in bear viewing to Anan Creek or Traitors Cove requires safe flight ceilings. If weather grounds the flight, operators issue full refunds, and you can switch to road-based Herring Cove or cultural totem parks.",
    "cruiseSafetyRule": "Anan Creek permits are strictly limited by the US Forest Service. These tours sell out 6 to 9 months in advance. Always book early to secure your cruise day slot.",
    "overview": [
      "Southeast Alaska is home to some of the densest bear populations on the planet. Ketchikan provides access to both coastal black bears and massive brown bears (grizzlies) as thousands of returning salmon choke mountain rivers to spawn.",
      "The gold standard of bear viewing in this region is Anan Wildlife Observatory, a world-renowned US Forest Service site accessible only by floatplane or high-speed boat. Here, an elevated wooden viewing platform and covered photo blind sit directly above a roaring waterfall where bears stand in rushing water catching jumping salmon in their jaws.",
      "For cruise travelers seeking an adventure closer to port, Traitors Cove (Margaret Creek) offers floatplane access to a secluded salmon stream with black bears, while Herring Cove on the road system provides budget-friendly black bear viewing without flying."
    ],
    "keyHighlights": [
      "Stand within 30 feet of wild black and brown bears catching salmon at Anan Creek",
      "Covered photo blind at water level for low-angle, professional-grade wildlife shots",
      "Scenic floatplane flight over remote islands of the Alexander Archipelago",
      "US Forest Service wilderness rangers on site to ensure safe, ethical wildlife viewing"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins to meet pilot at downtown floatplane slip",
      "travelToSite": "45 mins floatplane flight to Anan Bay or Traitors Cove",
      "activeExperience": "150 mins guided boardwalk trail walk and bear platform viewing",
      "returnTransit": "45 mins floatplane return flight to Ketchikan",
      "pierBuffer": "60–90 mins margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Anan Creek Bear Viewing Floatplane Tour",
        "duration": "5 hours",
        "returnMargin": "75 min buffer (needs 6.5+ hr port call)",
        "bestSuitedFor": "Wildlife photographers wanting the premier black and brown bear feeding site in Alaska",
        "meetingPoint": "Downtown Ketchikan Harbor Float",
        "searchQuery": "Anan Creek bear viewing floatplane tour Ketchikan",
        "campaignTag": "ketchikan-bear-anan-creek"
      },
      {
        "name": "Traitors Cove Bear Viewing Wilderness Flight",
        "duration": "4 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers wanting remote fly-in black bear viewing in late July and August",
        "meetingPoint": "Downtown Ketchikan Harbor Float",
        "searchQuery": "Traitors Cove bear viewing tour Ketchikan",
        "campaignTag": "ketchikan-bear-traitors-cove"
      }
    ],
    "whatToBring": [
      "Telephoto zoom lens (70–300mm or 100–400mm is ideal for the viewing platform)",
      "High-quality rain gear (jacket and waterproof pants)",
      "Comfortable hiking shoes for the 0.5-mile gravel and boardwalk trail at Anan",
      "No food or scented snacks allowed on the trail or platform (strict bear safety rules)"
    ],
    "faqs": [
      {
        "question": "When is the best time for bear viewing in Ketchikan?",
        "answer": "Bear viewing is tied strictly to salmon runs. Peak season at Anan Creek runs from July 5 through August 25. Traitors Cove peaks from late July through late August. Herring Cove bears are most active from late July through mid-September. In May and June, bears are dispersed in the mountains and rarely seen at salmon streams."
      },
      {
        "question": "Is bear viewing safe?",
        "answer": "Yes. Anan Creek is managed by the US Forest Service with armed wilderness rangers stationed along the trail and platform. Bears are focused entirely on gorging on returning salmon and pay little attention to humans stationed on designated elevated boardwalks."
      },
      {
        "question": "What is the walking distance at Anan Creek?",
        "answer": "From the saltwater floatplane landing beach, guests walk a 0.5-mile gravel and wooden boardwalk trail through the rainforest to reach the observation platform. The trail has some stairs and uneven sections, requiring moderate mobility."
      }
    ],
    "relatedActivities": [
      {
        "name": "Wildlife & Rainforest Tours",
        "href": "/ketchikan/wildlife-and-rainforest-tours"
      },
      {
        "name": "Misty Fjords Tours",
        "href": "/ketchikan/misty-fjords-tours"
      },
      {
        "name": "Floatplane Excursions",
        "href": "/ketchikan/floatplane-excursions"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Flightseeing vs Land Excursion",
        "href": "/decision/flightseeing-vs-land-excursion"
      },
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Excursions With Transportation",
        "href": "/decision/alaska-excursions-with-transportation"
      }
    ]
  },
  {
    "portSlug": "ketchikan",
    "portName": "Ketchikan",
    "slug": "totem-and-cultural-tours",
    "title": "Ketchikan Totem Pole Parks & Native Cultural Shore Excursions",
    "metaDescription": "Explore the world's largest collection of standing totem poles in Ketchikan. Compare Saxman Native Village, Totem Bight State Park, and Totem Heritage Center.",
    "h1": "Ketchikan Totem Poles & Native Cultural Tours",
    "eyebrow": "Ketchikan, Alaska · Native Heritage & Art",
    "typicalDuration": "2 to 3.5 hours round-trip",
    "meetingLogistics": "Vans and coaches meet at cruise ship berths; the downtown Totem Heritage Center is a 15-minute walk from the docks.",
    "returnMargin": "Requires 3.5 to 4-hour port call. Generates 90 to 120 minutes of safe return buffer.",
    "weatherSensitivity": "Low",
    "weatherBackupAdvice": "Cultural tours feature authentic indoor clan houses, carving sheds, and museum galleries. Perfect rainy-day shore excursion.",
    "cruiseSafetyRule": "Saxman Village is 3 miles south of town; Totem Bight is 10 miles north. Both have short, predictable road transit times with zero risk to ship departure.",
    "overview": [
      "Ketchikan is the world capital of Northwest Coast Native totem art, home to more authentic standing totem poles than anywhere else on earth. The carved red cedar poles preserve the history, legends, clan crests, and family honor of the Tlingit, Haida, and Tsimshian peoples.",
      "The two primary totem parks are Saxman Native Village (located 3 miles south of the cruise docks) and Totem Bight State Historical Park (located 10 miles north on Tongass Narrows).",
      "At Saxman Village, visitors witness master carvers shaping 40-foot cedar logs using traditional adzes, enter the Beaver Clan House for traditional dancing and storytelling, and view dozens of historic replica poles. For original 19th-century unrestored poles, the downtown Totem Heritage Center preserves fragile historic artifacts in climate-controlled galleries."
    ],
    "keyHighlights": [
      "View the world's largest collection of authentic hand-carved Native totem poles",
      "Watch master Tlingit and Haida artisans actively carving 40-foot cedar trunks",
      "Step inside a hand-adzed traditional Native Clan House and hear ancient oral legends",
      "Stroll quiet coastal rainforest trails lined with dramatic clan crests and memorial poles"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins to board motorcoach at cruise berth",
      "travelToSite": "10–20 mins coastal drive to Saxman or Totem Bight",
      "activeExperience": "90–120 mins guided pole tour, clan house presentation, and carving shed",
      "returnTransit": "15 mins drive back to downtown Ketchikan",
      "pierBuffer": "90–120 mins margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Saxman Native Village & Carving Studio Tour",
        "duration": "2.5 hours",
        "returnMargin": "120 min buffer",
        "bestSuitedFor": "Families, seniors, and cruisers seeking deep indigenous history and lively dance",
        "meetingPoint": "Ketchikan Berth Tour Bus Plaza",
        "searchQuery": "Saxman native village totem carving tour Ketchikan",
        "campaignTag": "ketchikan-totem-saxman"
      },
      {
        "name": "Totem Bight State Park & Historic Creek Street Walk",
        "duration": "3 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers wanting outdoor coastal totem paths combined with historic downtown walking",
        "meetingPoint": "Ketchikan Berth Tour Bus Plaza",
        "searchQuery": "Totem Bight state park Creek Street tour Ketchikan",
        "campaignTag": "ketchikan-totem-bight-creek"
      }
    ],
    "whatToBring": [
      "Camera with wide lens for capturing tall 40-foot vertical totem poles",
      "Comfortable flat walking shoes for paved paths and boardwalks",
      "Light rain jacket or umbrella (parks are partially outdoors)",
      "Curiosity and respect for indigenous cultural traditions and art"
    ],
    "faqs": [
      {
        "question": "What is the difference between Saxman Village and Totem Bight?",
        "answer": "Saxman Village is an active Native community offering live traditional dance performances, an active carving shed where master artisans work, and a Clan House. Totem Bight is a scenic, quiet state park set on the ocean with a recreated Clan House and outdoor pole path, but no live carver or dancing. Saxman is better for cultural performance; Totem Bight is better for quiet nature photography."
      },
      {
        "question": "Can I walk to totem poles from the cruise dock?",
        "answer": "Yes. The Totem Heritage Center is a flat 15-minute walk along Park Avenue from downtown cruise docks, housing original 19th-century poles rescued from abandoned villages. There are also several public totem poles standing right along Front Street and Creek Street in downtown Ketchikan."
      },
      {
        "question": "How do you read a totem pole?",
        "answer": "Contrary to the English expression 'low man on the totem pole', the most important or honored crest figure is often placed at the bottom, closest to viewers at eye level, or at the very top. A local native guide will decipher the ravens, eagles, bears, killer whales, and frogs carved into each pole."
      }
    ],
    "relatedActivities": [
      {
        "name": "Wildlife & Rainforest Tours",
        "href": "/ketchikan/wildlife-and-rainforest-tours"
      },
      {
        "name": "Misty Fjords Tours",
        "href": "/ketchikan/misty-fjords-tours"
      },
      {
        "name": "Ketchikan Flightseeing",
        "href": "/ketchikan/flightseeing"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Best Alaska Excursions for Families",
        "href": "/decision/best-alaska-excursions-for-families"
      }
    ]
  },
  {
    "portSlug": "ketchikan",
    "portName": "Ketchikan",
    "slug": "floatplane-excursions",
    "title": "Ketchikan Wilderness Floatplane Shore Excursions | Bush Pilot Adventures",
    "metaDescription": "Experience true Alaska bush flying on Ketchikan floatplane excursions. Compare Misty Fjords routes, remote salt-inlet landings, and wilderness fly-outs.",
    "h1": "Ketchikan Wilderness Floatplane Excursions",
    "eyebrow": "Ketchikan, Alaska · Bush Aviation",
    "typicalDuration": "1.75 to 3 hours round-trip",
    "meetingLogistics": "Direct boarding from the downtown Ketchikan waterfront floatplane facilities, steps from cruise berths.",
    "returnMargin": "Requires minimum 4-hour port call. Produces 90+ minutes of return buffer.",
    "weatherSensitivity": "Moderate to High",
    "weatherBackupAdvice": "If mountain passes into Misty Fjords are socked in with cloud, experienced bush pilots can pivot to coastal wildlife straits, or process a refund per operator terms.",
    "cruiseSafetyRule": "Always re-confirm whether your ship berths downtown or at Ward Cove. If at Ward Cove, take the complimentary shuttle to downtown 1 hour before flight check-in.",
    "overview": [
      "In Ketchikan, the highway ends a few miles north and south of town. Beyond that lies millions of acres of roadless Alexander Archipelago wilderness accessible only by boat or floatplane.",
      "Climbing aboard an iconic de Havilland DHC-2 Beaver or DHC-3 Turbine Otter floatplane connects you with the historic aviation culture of Alaska. These legendary bush planes are engineered to take off from water in short distances and navigate tight mountain valleys.",
      "Tours ascend above Revillagigedo Island, crossing crystal-clear salmon rivers, hidden alpine cirques, and dramatic saltwater fjords where pods of killer whales and humpbacks are frequently spotted from the air."
    ],
    "keyHighlights": [
      "Step directly from the dock into legendary Alaskan bush aircraft",
      "Window seats for passengers with voice-activated intercom headsets",
      "Thrilling water landing on isolated saltwater fjords miles from civilization",
      "Look down for whales, mountain goats on cliff faces, and feeding black bears"
    ],
    "timingBreakdown": {
      "disembarkation": "10 mins walk from berth to floatplane base",
      "travelToSite": "5 mins pre-flight briefing and passenger boarding",
      "activeExperience": "75 mins scenic flying and wilderness water landing",
      "returnTransit": "5 mins taxi back to harbor dock",
      "pierBuffer": "90–120 mins margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Classic Bush Pilot Wilderness Floatplane Flight",
        "duration": "2 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers wanting genuine Alaska bush flying and remote fjord views",
        "meetingPoint": "Downtown Ketchikan Harbor Float",
        "searchQuery": "Ketchikan classic bush pilot wilderness floatplane",
        "campaignTag": "ketchikan-floatplane-bush"
      },
      {
        "name": "Private Charter Wilderness Floatplane Expedition",
        "duration": "2.5 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Families or private groups wanting customized routing and photography stops",
        "meetingPoint": "Downtown Ketchikan Harbor Float",
        "searchQuery": "Ketchikan private floatplane charter tour",
        "campaignTag": "ketchikan-floatplane-charter"
      }
    ],
    "whatToBring": [
      "Polarized sunglasses",
      "Camera with wide-to-medium zoom lens",
      "Windbreaker or waterproof jacket",
      "Government photo ID"
    ],
    "faqs": [
      {
        "question": "How noisy is a floatplane flight?",
        "answer": "The aircraft engines produce substantial hum, but every guest is provided with state-of-the-art noise-canceling voice-activated aviation headsets. The headsets mute engine noise and allow effortless conversation with the pilot and other guests."
      },
      {
        "question": "Do floatplanes land on the water during the tour?",
        "answer": "Yes. Every standard 2-hour flight includes a gentle water landing on an isolated saltwater fjord or remote mountain lake. The pilot cuts the engine so you can step out onto the aircraft floats and absorb the immense silence of the Alaska wilderness."
      },
      {
        "question": "Are floatplane tours wheelchair accessible?",
        "answer": "Guests must be able to climb 2 to 3 steps up an aircraft ladder onto the float and into the cabin with assistance. Collapsible wheelchairs can be safely stowed in the aircraft cargo compartment during flight."
      }
    ],
    "relatedActivities": [
      {
        "name": "Misty Fjords Tours",
        "href": "/ketchikan/misty-fjords-tours"
      },
      {
        "name": "Ketchikan Flightseeing",
        "href": "/ketchikan/flightseeing"
      },
      {
        "name": "Bear Viewing Excursions",
        "href": "/ketchikan/bear-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Flightseeing vs Land Excursion",
        "href": "/decision/flightseeing-vs-land-excursion"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Short Port Call Options",
        "href": "/decision/short-port-call-alaska-options"
      }
    ]
  },
  {
    "portSlug": "sitka",
    "portName": "Sitka",
    "slug": "wildlife-and-historic-tours",
    "title": "Sitka Shore Excursions | Sea Otters, Raptors & Russian-American History",
    "metaDescription": "Compare Sitka shore excursions. Sea otter wildlife safaris in Silver Bay, Fortress of the Bear, Alaska Raptor Center, and Sitka National Historical Park.",
    "h1": "Sitka Wildlife & Russian-American Historic Shore Excursions",
    "eyebrow": "Sitka, Alaska · Island Wildlife & History",
    "typicalDuration": "3 to 4.5 hours round-trip",
    "meetingLogistics": "Most large cruise ships berth at the Sitka Sound Cruise Terminal (Old Sitka Dock), 5 miles north of downtown. Complimentary 10-minute terminal shuttles run continuously to Harrigan Centennial Hall downtown.",
    "returnMargin": "Requires minimum 5-hour port window. Returns you to downtown shuttle with 75–90 minutes before all-aboard.",
    "weatherSensitivity": "Low to Moderate",
    "weatherBackupAdvice": "Wildlife tour boats have heated enclosed main cabins with large viewing windows. Land-based attractions (Raptor Center, Fortress of the Bear) have indoor exhibits that operate seamlessly in heavy rain.",
    "cruiseSafetyRule": "If your ship docks at the Sitka Sound Cruise Terminal, always factor in the 15-minute terminal shuttle bus ride when calculating your return to ship.",
    "overview": [
      "Perched on the outer coast of Baranof Island facing the open Pacific Ocean, Sitka is historically and ecologically distinct from all other Inside Passage ports. Once the capital of Russian America ('New Archangel'), it blends Tlingit culture, Russian architecture, and incredible coastal wildlife.",
      "Sitka Sound boasts the highest concentration of Southern sea otters in Alaska. Marine wildlife catamarans navigate sheltered island archipelagos to view rafts of otters floating in kelp beds, gray and humpback whales, harbor seals, puffins, and coastal brown bears along shorelines.",
      "On land, Sitka's top wildlife attractions include the Alaska Raptor Center (a premier bald eagle rehabilitation sanctuary) and Fortress of the Bear (a rescue sanctuary for orphaned Alaska brown and black bears). The Sitka National Historical Park showcases ancient Tlingit totem poles set along a tranquil temperate rainforest river walk."
    ],
    "keyHighlights": [
      "Spot playful rafts of sea otters, breaching humpbacks, and puffins in Sitka Sound",
      "Get within feet of rescued bald eagles at the world-renowned Alaska Raptor Center",
      "Observe massive coastal brown bears from elevated platforms at Fortress of the Bear",
      "Explore historic St. Michael's Russian Orthodox Cathedral and Tlingit totem trails"
    ],
    "timingBreakdown": {
      "disembarkation": "15 mins from ship gangway to terminal shuttle bus",
      "travelToSite": "10 mins coach shuttle to Harrigan Centennial Hall downtown",
      "activeExperience": "150–210 mins marine wildlife cruise or bear/raptor sanctuary combo",
      "returnTransit": "15 mins shuttle back to Sitka Sound Cruise Terminal",
      "pierBuffer": "60–90 mins margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Sitka Sound Sea Otter & Wildlife Quest",
        "duration": "3.5 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers wanting premier marine mammal encounters and high-probability sea otter viewing",
        "meetingPoint": "Harrigan Centennial Hall / Terminal Pier",
        "searchQuery": "Sitka sound sea otter wildlife quest boat tour",
        "campaignTag": "sitka-wildlife-otter-quest"
      },
      {
        "name": "Best of Sitka: Fortress of the Bear, Raptors & Totems",
        "duration": "3.5 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "Families and history enthusiasts wanting to see bears, eagles, and totems on land",
        "meetingPoint": "Harrigan Centennial Hall Shuttle Plaza",
        "searchQuery": "Best of Sitka fortress of the bear raptor center",
        "campaignTag": "sitka-land-bear-raptor"
      }
    ],
    "whatToBring": [
      "Binoculars for wildlife viewing across Sitka Sound",
      "Camera with telephoto lens for photographing raptors and sea otters",
      "Waterproof hooded jacket and comfortable walking shoes",
      "Small cash bills for local church or museum donations"
    ],
    "faqs": [
      {
        "question": "How do I get from the Sitka cruise dock to downtown?",
        "answer": "Most large cruise ships berth at the Sitka Sound Cruise Terminal, located 5 miles north of town. The port operates free, continuous coach shuttles between the terminal and Harrigan Centennial Hall in downtown Sitka. The drive takes 10 to 12 minutes. Some boutique ships anchor in the harbor and tender directly into downtown."
      },
      {
        "question": "How common are sea otters in Sitka?",
        "answer": "Sitka Sound has thousands of sea otters. Marine wildlife cruises report near-constant otter sightings, frequently finding large 'rafts' of dozens of otters grooming, floating on their backs, and wrapping themselves in giant kelp fronds."
      },
      {
        "question": "Can I do both Fortress of the Bear and the Alaska Raptor Center?",
        "answer": "Yes. Popular combo shore excursions pair both rescue facilities along with the Sitka National Historical Park in a convenient 3.5 to 4-hour guided tour."
      }
    ],
    "relatedActivities": [
      {
        "name": "Icy Strait Point Wildlife",
        "href": "/icy-strait-point/whale-and-wilderness-tours"
      },
      {
        "name": "Juneau Wildlife Excursions",
        "href": "/juneau/wildlife-excursions"
      },
      {
        "name": "Ketchikan Rainforest Tours",
        "href": "/ketchikan/wildlife-and-rainforest-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Best Alaska Excursions for Families",
        "href": "/decision/best-alaska-excursions-for-families"
      },
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      }
    ]
  },
  {
    "portSlug": "icy-strait-point",
    "portName": "Icy Strait Point",
    "slug": "whale-and-wilderness-tours",
    "title": "Icy Strait Point Shore Excursions | Point Adolphus Whales & Brown Bears",
    "metaDescription": "Explore Icy Strait Point (Hoonah). Compare Point Adolphus whale watching, Chichagof Island brown bear viewing, and the world's largest ZipRider.",
    "h1": "Icy Strait Point Whale & Wilderness Excursions",
    "eyebrow": "Icy Strait Point, Alaska · Whales & Wilderness",
    "typicalDuration": "2.5 to 4 hours round-trip",
    "meetingLogistics": "Departures leave right from the Icy Strait Point Adventure Center or marina dock, just steps from the cruise berths.",
    "returnMargin": "Requires 4 to 5-hour port window. Provides 60–90 minutes return margin before all-aboard.",
    "weatherSensitivity": "Low to Moderate",
    "weatherBackupAdvice": "Point Adolphus marine waters are sheltered by Chichagof and Pleasant islands. Whales feed heavily in rain. Tour boats feature heated indoor salons.",
    "cruiseSafetyRule": "Icy Strait Point is privately owned by the Huna Totem Corporation. All excursions depart directly on-site, making transit times minimal and completely cruise-safe.",
    "overview": [
      "Located on Chichagof Island near the Tlingit village of Hoonah, Icy Strait Point is Alaska's only privately owned, native-operated cruise destination. Unlike busy city ports, ISP is surrounded by pure untamed wilderness.",
      "Just off the coast lies Point Adolphus, known among marine biologists as the richest whale feeding ground in all of Southeast Alaska. Massive tidal currents funnel millions of herring and krill against underwater shoals, attracting huge concentrations of humpback whales that frequently lunge-feed and breach right next to tour boats.",
      "Chichagof Island also has the highest concentration of coastal brown bears per square mile in the world. Guided wilderness van excursions explore remote logging roads and pristine salmon streams in search of giant coastal grizzlies."
    ],
    "keyHighlights": [
      "Point Adolphus is widely considered Alaska's most active humpback feeding ground",
      "Chichagof Island holds the world record for the highest density of brown bears",
      "Direct boarding at the historic 1912 Hoonah Packing Company cannery site",
      "Home of the world's largest ZipRider—dropping 1,320 vertical feet at 60 mph"
    ],
    "timingBreakdown": {
      "disembarkation": "10 mins walk along cannery boardwalk to tour staging marina",
      "travelToSite": "15 mins boat cruise out to Point Adolphus feeding grounds",
      "activeExperience": "120 mins tracking humpback pods, sea lions, and orcas",
      "returnTransit": "15 mins boat return to Icy Strait Point marina",
      "pierBuffer": "60–120 mins margin before all-aboard"
    },
    "sampleTours": [
      {
        "name": "Point Adolphus Whale Watching Cruise",
        "duration": "2.5 to 3 hours",
        "returnMargin": "90 min buffer",
        "bestSuitedFor": "Cruisers wanting the highest-probability, most intense whale action in Alaska",
        "meetingPoint": "Icy Strait Point Excursion Marina",
        "searchQuery": "Icy Strait Point Point Adolphus whale watching cruise",
        "campaignTag": "isp-whale-point-adolphus"
      },
      {
        "name": "Chichagof Island Guided Brown Bear Search",
        "duration": "3.5 hours",
        "returnMargin": "75 min buffer",
        "bestSuitedFor": "Wildlife watchers seeking wild coastal brown bears in old-growth wilderness",
        "meetingPoint": "Icy Strait Point Adventure Center",
        "searchQuery": "Icy Strait Point Hoonah brown bear viewing tour",
        "campaignTag": "isp-bear-chichagof"
      }
    ],
    "whatToBring": [
      "Binoculars and telephoto camera lens (200mm+)",
      "Layered warm clothing and waterproof rain shell",
      "Flat, slip-resistant shoes for wet boat decks and cannery boardwalks",
      "Camera rain sleeve"
    ],
    "faqs": [
      {
        "question": "Is whale watching better in Juneau or Icy Strait Point?",
        "answer": "Both are world-class, but Icy Strait Point's Point Adolphus has stronger oceanic tidal currents that concentrate baitfish tightly. This often produces more dramatic surface-feeding behavior (bubble-net feeding and lunging) and shorter boat transit times from the dock."
      },
      {
        "question": "How does the ZipRider work at Icy Strait Point?",
        "answer": "The ZipRider takes 6 riders side-by-side down a 5,330-foot cable line from the 1,500-foot mountain peak down to the beach, reaching speeds of up to 60-65 mph. The total tour takes about 1.5 hours including the scenic mountain shuttle ride up."
      },
      {
        "question": "Do cruise ships tender at Icy Strait Point?",
        "answer": "Icy Strait Point features two deep-water cruise docks (Wilderness Dock and Adventure Dock) connected by a complimentary high-speed Transporter Gondola. Most ships tie up directly without tendering."
      }
    ],
    "relatedActivities": [
      {
        "name": "Sitka Wildlife Tours",
        "href": "/sitka/wildlife-and-historic-tours"
      },
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      },
      {
        "name": "Ketchikan Bear Tours",
        "href": "/ketchikan/bear-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Whale Watching vs Glacier Tour",
        "href": "/decision/whale-watching-vs-glacier-tour"
      },
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      }
    ]
  }
];

export function getPortActivities(portSlug: string): PortActivity[] {
  return PORT_ACTIVITIES.filter((a) => a.portSlug === portSlug);
}

export function getPortActivity(portSlug: string, activitySlug: string): PortActivity | null {
  return PORT_ACTIVITIES.find((a) => a.portSlug === portSlug && a.slug === activitySlug) ?? null;
}
