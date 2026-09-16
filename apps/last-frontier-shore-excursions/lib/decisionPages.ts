export interface DecisionPage {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  eyebrow: string;
  lead: string;
  quickRule: string;
  comparisonMatrix: {
    headers: string[];
    rows: {
      category: string;
      col1: string;
      col2: string;
      verdict: string;
    }[];
  };
  keyTakeaways: string[];
  inDepthSections: {
    heading: string;
    paragraphs: string[];
    callout?: string;
  }[];
  cruiseSafetyAdvice: string[];
  recommendedTours: {
    port: string;
    name: string;
    duration: string;
    whyItFits: string;
    searchQuery: string;
    campaignTag: string;
  }[];
  faqs: { question: string; answer: string }[];
  relatedActivities: { name: string; href: string }[];
  relatedDecisions: { name: string; href: string }[];
}

export const DECISION_PAGES: DecisionPage[] = [
  {
    "slug": "best-excursion-for-each-port",
    "title": "Best Shore Excursion for Each Alaska Cruise Port | Definitive Port Picks",
    "metaDescription": "The single best shore excursion in Juneau, Skagway, Ketchikan, Sitka, and Icy Strait Point. Maximize bucket-list experiences without doubling up.",
    "h1": "The Best Shore Excursion for Each Alaska Cruise Port",
    "eyebrow": "Alaska Cruise Planning · Port Strategy",
    "lead": "Alaska cruise itineraries can feel overwhelming with hundreds of shore excursions. The secret to an unforgettable voyage is matching each port to what it does better than anywhere else on earth.",
    "quickRule": "Don't repeat tour styles: Do glaciers in Juneau, rail in Skagway, fjords or totems in Ketchikan, sea otters in Sitka, and whales in Icy Strait Point.",
    "comparisonMatrix": {
      "headers": [
        "Port",
        "Top Excursion Pick",
        "Backup Option",
        "Key Cruise Day Advantage"
      ],
      "rows": [
        {
          "category": "Juneau",
          "col1": "Helicopter Glacier Landing or Whale Watch Combo",
          "col2": "Mendenhall Glacier Shuttle + Nugget Falls Trail",
          "verdict": "Juneau offers the most accessible icefield aviation and dense whale feeding grounds."
        },
        {
          "category": "Skagway",
          "col1": "White Pass & Yukon Route Summit Railway",
          "col2": "Klondike Highway Mountain Summit Scenic Van Tour",
          "verdict": "Boards directly at the pier; tracks climb 2,865 ft over Gold Rush canyon trestles."
        },
        {
          "category": "Ketchikan",
          "col1": "Misty Fjords National Monument Floatplane Flight",
          "col2": "Saxman Native Village Totem & Cultural Carving Tour",
          "verdict": "Floatplanes take off right alongside cruise berths with zero airport shuttle lag."
        },
        {
          "category": "Sitka",
          "col1": "Sitka Sound Sea Otter & Marine Wildlife Quest",
          "col2": "Fortress of the Bear & Alaska Raptor Center Combo",
          "verdict": "Premier habitat for sea otters, brown bears, and bald eagle rehabilitation."
        },
        {
          "category": "Icy Strait Point",
          "col1": "Point Adolphus Humpback Whale Watching Cruise",
          "col2": "Chichagof Island Brown Bear Search or ZipRider",
          "verdict": "Point Adolphus is Alaska's highest-density humpback feeding hotspot with short boat runs."
        }
      ]
    },
    "keyTakeaways": [
      "Avoid duplication: if you book a whale watch in Juneau, focus on flightseeing in Ketchikan and mountain rail in Skagway.",
      "Consider physical mobility: White Pass rail and Saxman totems accommodate all ages; glacier treks require moderate stamina.",
      "Check weather volatility: high-elevation flights in Juneau and Ketchikan need ground-based backup options."
    ],
    "inDepthSections": [
      {
        "heading": "Juneau: The Capital of Glaciers and Marine Mammals",
        "paragraphs": [
          "Juneau is blessed with both the 1,500-square-mile Juneau Icefield and the sheltered waters of Auke Bay. If your budget allows, a helicopter glacier landing onto Herbert or Norris Glacier is the defining memory of an Alaska cruise.",
          "If aviation isn't your preference, a small-group whale watching cruise out of Auke Bay offers exceptional historical sighting rates for humpback whales from May through September, often accompanied by Steller sea lions and bald eagles."
        ],
        "callout": "Port Timing Tip: If your Juneau call is under 6 hours, opt for a standalone whale watch or Mendenhall shuttle rather than a combo tour."
      },
      {
        "heading": "Skagway: Where Gold Rush History Meets High Mountain Passes",
        "paragraphs": [
          "Skagway's defining experience is without question the White Pass & Yukon Route Railway. Built in 1898, vintage parlor cars climb 2,865 feet in 20 miles, clinging to cliff walls and crossing dramatic trestles.",
          "For travelers with 8+ hours in port and valid passports, extending into the Canadian Yukon to see the Yukon Suspension Bridge and Carcross Desert provides an unmatched look at the sub-arctic frontier."
        ]
      },
      {
        "heading": "Ketchikan: Misty Fjords and Living Northwest Native Art",
        "paragraphs": [
          "Ketchikan is the floatplane capital of the world and home to the world's largest collection of standing totem poles. Flying over the 3,000-foot granite cliffs of Misty Fjords National Monument in a vintage de Havilland Beaver is an awe-inspiring experience.",
          "If fog or low clouds ground aviation, Saxman Native Village and Totem Bight State Historical Park offer rich, weather-safe cultural experiences where master Tlingit carvers work on fresh cedar logs."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "Always confirm your ship's docking location: AJ Dock in Juneau and Ward Cove in Ketchikan add 30-45 minutes of transit time.",
      "Enforce the 45-Minute Rule: Your excursion must conclude at least 45 minutes before ship all-aboard.",
      "Keep digital and printed booking confirmations with direct local operator phone numbers."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Juneau Icefield Helicopter Glacier Landing",
        "duration": "2.5 hours",
        "whyItFits": "Fast, high-impact ice landing with minimal door-to-door transit time",
        "searchQuery": "Juneau helicopter glacier landing tour",
        "campaignTag": "decision-best-juneau-heli"
      },
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway Excursion",
        "duration": "3 hours",
        "whyItFits": "Dockside train boarding with no border customs required on summit loop",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-best-skagway-train"
      },
      {
        "port": "Ketchikan",
        "name": "Misty Fjords Floatplane Flight & Remote Water Landing",
        "duration": "2 hours",
        "whyItFits": "Departs directly from downtown waterfront, leaving hours for Creek Street",
        "searchQuery": "Misty Fjords floatplane flight remote landing Ketchikan",
        "campaignTag": "decision-best-ketchikan-misty"
      }
    ],
    "faqs": [
      {
        "question": "Is it better to do whale watching in Juneau or Icy Strait Point?",
        "answer": "Both offer exceptionally high historical sighting rates in summer. Juneau tours feature modern catamarans and safari boats with smooth 20-minute bus transfers to Auke Bay. Icy Strait Point boards directly on-site and reaches Point Adolphus feeding shoals in just 15 minutes by boat. If visiting both, do whale watching in ISP and glacier helicopter or Mendenhall in Juneau."
      },
      {
        "question": "Can I book the best excursions independently instead of through the cruise ship?",
        "answer": "Yes! Independent tours generally feature smaller group sizes (14–24 passengers vs 50+ on ship coaches), personalized narrative, and lower prices, while aligning closely with ship all-aboard schedules."
      }
    ],
    "relatedActivities": [
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      },
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Misty Fjords Tours",
        "href": "/ketchikan/misty-fjords-tours"
      },
      {
        "name": "Sitka Wildlife Tours",
        "href": "/sitka/wildlife-and-historic-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "First-Time Alaska Cruisers",
        "href": "/decision/best-excursion-first-time-alaska-cruisers"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Cruises Safe for Ship Window",
        "href": "/decision/excursions-safe-for-cruise-ship-window"
      }
    ]
  },
  {
    "slug": "best-excursion-first-time-alaska-cruisers",
    "title": "Best Shore Excursions for First-Time Alaska Cruisers | Rookie Guide",
    "metaDescription": "First time cruising Alaska? Discover the classic must-do shore excursions, common rookie mistakes, and how to balance glaciers, whales, and historic trains.",
    "h1": "Best Shore Excursions for First-Time Alaska Cruisers",
    "eyebrow": "First-Time Cruisers · Essential Portfolio",
    "lead": "Your first Alaska cruise is unlike any Caribbean or Mediterranean voyage. You aren't visiting beach resorts; you are navigating a vast sub-arctic wilderness where glaciers calve, whales breach, and historic railroads climb mountain passes.",
    "quickRule": "Build your first cruise around the 'Big Three': Mendenhall Glacier or Icefield Flight in Juneau, White Pass Railway in Skagway, and Misty Fjords or Totems in Ketchikan.",
    "comparisonMatrix": {
      "headers": [
        "Port",
        "First-Timer Classic",
        "Physical Effort",
        "Why It's Non-Negotiable"
      ],
      "rows": [
        {
          "category": "Juneau",
          "col1": "Whale Watching & Mendenhall Glacier Combo",
          "col2": "Easy to Moderate (paved walking)",
          "verdict": "Checks off both humpback whales and an accessible icefield glacier in a single port day."
        },
        {
          "category": "Skagway",
          "col1": "White Pass Summit Scenic Railway",
          "col2": "Very Easy (seated parlor cars)",
          "verdict": "The quintessential Alaska rail trip; breathtaking cliffside canyon trestles with zero strenuous walking."
        },
        {
          "category": "Ketchikan",
          "col1": "Saxman Totem Village & Ketchikan Highlights",
          "col2": "Easy (flat walking paths)",
          "verdict": "Authentic indigenous clan house dancing, master woodcarving, and famous Creek Street boardwalk."
        },
        {
          "category": "Sitka (if on itinerary)",
          "col1": "Raptor Center & Fortress of the Bear",
          "col2": "Easy (paved walkways)",
          "verdict": "Up-close views of rescued bald eagles and coastal brown bears without wilderness hiking."
        }
      ]
    },
    "keyTakeaways": [
      "Do not over-schedule: One major anchor excursion per port day leaves time to explore historic towns, sample fresh crab, and avoid burnout.",
      "Layering is essential: Rain shells, fleece, and sturdy waterproof footwear will make or break your enjoyment in Alaska.",
      "Ship Time vs. Local Time: Confirm whether your ship changes time zones or stays on departure port time."
    ],
    "inDepthSections": [
      {
        "heading": "The First-Timer Dilemma: Trying to Do Everything in Every Port",
        "paragraphs": [
          "The most common rookie mistake is booking multiple back-to-back excursions in a single port call. A 3-hour morning tour followed immediately by a 3-hour afternoon tour creates severe anxiety, leaves no buffer for delays, and eliminates the joy of strolling historic frontier streets.",
          "Pick ONE flagship experience in each port that matches the region's core strength. Dedicate the remainder of your time to wandering boardwalks, visiting local saloons, and watching harbor floatplanes."
        ],
        "callout": "Golden Rule: Never cut your port window closer than 60 minutes before ship all-aboard."
      },
      {
        "heading": "What to Prioritize if Budget is Limited",
        "paragraphs": [
          "If top-tier helicopter flights ($350–$600 per person) exceed your budget, Alaska offers phenomenal world-class excursions under $150. A round-trip express shuttle to Mendenhall Glacier ($45–$75) gives you hours to hike to Nugget Falls and watch salmon runs.",
          "In Ketchikan, walking Creek Street and visiting the Totem Heritage Center costs under $15, while Skagway's historic Klondike Gold Rush National Park visitor center and walking tours are completely free."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "Carry your ship stateroom keycard and government photo ID in a waterproof lanyard or zippered pocket.",
      "Set your phone or watch manually to ship time to avoid automated carrier time zone jumps.",
      "Never wander outside cell coverage zones without confirmed return transportation."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Juneau Whale Watching & Mendenhall Glacier Combo",
        "duration": "5.5 hours",
        "whyItFits": "The ultimate first-time package combining marine wildlife with glacier hiking",
        "searchQuery": "Juneau whale watching and Mendenhall glacier combo",
        "campaignTag": "decision-firsttime-juneau-combo"
      },
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway",
        "duration": "3 hours",
        "whyItFits": "Climbs 2,865 feet to the Canadian summit with dockside boarding",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-firsttime-skagway-train"
      },
      {
        "port": "Ketchikan",
        "name": "Saxman Native Village Totem & Culture Tour",
        "duration": "2.5 hours",
        "whyItFits": "Rich Northwest Coast cultural heritage, totem poles, and live dancing",
        "searchQuery": "Saxman native village totem carving tour Ketchikan",
        "campaignTag": "decision-firsttime-ketchikan-saxman"
      }
    ],
    "faqs": [
      {
        "question": "What happens if our cruise ship misses a port call due to weather?",
        "answer": "If extreme weather or harbor congestion prevents your cruise ship from calling at a port, reputable independent excursion operators maintain provider-reported refund or rebooking policies; check specific operator terms."
      },
      {
        "question": "Do first-timers need hiking boots for Alaska excursions?",
        "answer": "For standard cruise excursions (trains, boat cruises, totem parks, and Mendenhall paved trails), comfortable waterproof walking shoes or sturdy sneakers are completely adequate. True hiking boots with ankle support are only necessary if booking strenuous backcountry glacier treks or mountain hikes."
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
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Ketchikan Totem Tours",
        "href": "/ketchikan/totem-and-cultural-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      }
    ]
  },
  {
    "slug": "best-alaska-excursions-for-families",
    "title": "Best Alaska Shore Excursions for Families | Kids, Teens & Multi-Gen",
    "metaDescription": "Top family-friendly Alaska cruise shore excursions. Activities that work for toddlers, active teenagers, and grandparents traveling together.",
    "h1": "Best Alaska Shore Excursions for Families & Multi-Gen Groups",
    "eyebrow": "Family Travel · Multi-Generational Groups",
    "lead": "Planning an Alaska cruise for a multi-generational family means balancing the needs of energetic kids, thrill-seeking teenagers, and mobility-conscious grandparents.",
    "quickRule": "Select tours with heated enclosed cabins, onboard restrooms, and low physical barrier-to-entry: White Pass train, large whale catamarans, and Mendenhall shuttle trails.",
    "comparisonMatrix": {
      "headers": [
        "Port",
        "Top Family Pick",
        "Age Suitability",
        "Why Families Love It"
      ],
      "rows": [
        {
          "category": "Skagway",
          "col1": "White Pass Summit Railway",
          "col2": "All ages (infant to 90+)",
          "verdict": "Restrooms in every car, comfortable upholstered seating, and strollers easily accommodated."
        },
        {
          "category": "Juneau",
          "col1": "Mendenhall Glacier & Nugget Falls Walk",
          "col2": "All ages",
          "verdict": "Paved, flat stroller-friendly trails, junior ranger exhibits, and roaring waterfalls."
        },
        {
          "category": "Juneau",
          "col1": "Sled Dog Discovery & Musher's Camp",
          "col2": "All ages",
          "verdict": "Meeting friendly husky racing puppies and riding summer dog carts is unforgettable for kids."
        },
        {
          "category": "Ketchikan",
          "col1": "Alaska Rainforest Sanctuary & Wildlife Walk",
          "col2": "All ages",
          "verdict": "Gentle flat boardwalks, reindeer petting area, live eagle rescue, and totem carvers."
        },
        {
          "category": "Sitka",
          "col1": "Fortress of the Bear & Raptor Center",
          "col2": "All ages",
          "verdict": "Close-up views of playful rescue bears and magnificent bald eagles."
        }
      ]
    },
    "keyTakeaways": [
      "Bathroom accessibility is paramount: Ensure tour vessels or vehicles feature onboard restrooms or planned comfort stops.",
      "Check strict minimum age limits: Kayak excursions often require ages 8+, ziplines require ages 10+ (with minimum weight of 70-80 lbs), and glacier crampon treks require ages 12+.",
      "Multi-gen flexibility: Choose tours that allow active members to take optional side paths while grandparents relax comfortably at visitor centers or scenic viewpoints."
    ],
    "inDepthSections": [
      {
        "heading": "Why White Pass Summit Rail is the Ultimate Family Excursion",
        "paragraphs": [
          "Traveling with three generations in Skagway can be challenging, but the White Pass & Yukon Route railway solves every logistical problem. The train pulls right up to the Railroad Dock where major ships berth—eliminating bus loading hassles.",
          "Inside vintage parlor cars, families sit together around openable picture windows and historic cast-iron stoves. When kids get restless, parents can take them out onto the sheltered exterior viewing platforms to feel the cool mountain breeze and hear the whistle echo off granite cliffs."
        ]
      },
      {
        "heading": "Sled Dog Discovery: The Ultimate Bucket List for Kids & Teens",
        "paragraphs": [
          "For families with children and teens, the Juneau Sled Dog Discovery & Musher's Camp in Sheep Creek Valley creates lifetime memories. Children are enchanted by litters of husky puppies, while teens and parents thrill at riding a wheeled dog cart behind an eager team along rainforest trails."
        ],
        "callout": "Family Note: Gentle gravel paths and accessible kennel visits make this one of Southeast Alaska's most welcoming family excursions."
      }
    ],
    "cruiseSafetyAdvice": [
      "Allow extra buffer for family disembarkation: Getting a party of 6 or 8 through gangway security takes longer than solo travelers.",
      "Pack snacks, wet wipes, and water bottles in a daypack (some remote Alaska wilderness tours prohibit fragrant food due to wildlife regulations).",
      "Keep digital photos of all family members' passport identity pages on your mobile phone."
    ],
    "recommendedTours": [
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway",
        "duration": "3 hours",
        "whyItFits": "Zero walking required; boards right at the ship with heated cars and restrooms",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-family-skagway-train"
      },
      {
        "port": "Juneau",
        "name": "Juneau Whale Watching Safari Catamaran",
        "duration": "3.5 hours",
        "whyItFits": "Large, stable catamarans with heated cabins, snack bar, and high sighting probability",
        "searchQuery": "Juneau whale watching catamaran family tour",
        "campaignTag": "decision-family-juneau-catamaran"
      },
      {
        "port": "Ketchikan",
        "name": "Alaska Rainforest Sanctuary & Wildlife Walk",
        "duration": "3 hours",
        "whyItFits": "Gentle flat boardwalks, reindeer, bald eagles, and live native totem carvers",
        "searchQuery": "Ketchikan Alaska rainforest sanctuary wildlife walk",
        "campaignTag": "decision-family-ketchikan-rainforest"
      }
    ],
    "faqs": [
      {
        "question": "Are child car seats required on tour buses in Alaska?",
        "answer": "Commercial motorcoaches, mini-buses, and tour vans operated by licensed carriers in Alaska are legally exempt from standard child safety seat requirements. For small-group passenger vans, operators can often provide booster seats upon advance request."
      },
      {
        "question": "What happens if a child gets seasick on a whale watching tour?",
        "answer": "Waters in Juneau's Auke Bay and Ketchikan's Tongass Narrows are sheltered Inside Passage waters protected from ocean swells. Large catamarans provide immense stability with virtually zero rocking. For sensitive kids, acupressure Sea-Bands or pediatric motion sickness chewables provide easy peace of mind."
      }
    ],
    "relatedActivities": [
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      },
      {
        "name": "Ketchikan Rainforest Tours",
        "href": "/ketchikan/wildlife-and-rainforest-tours"
      },
      {
        "name": "Sitka Wildlife Tours",
        "href": "/sitka/wildlife-and-historic-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      }
    ]
  },
  {
    "slug": "alaska-excursions-under-4-hours",
    "title": "Alaska Shore Excursions Under 4 Hours | Short, High-Margin Port Tours",
    "metaDescription": "Looking for short Alaska shore excursions? Compare high-impact tours under 4 hours in Juneau, Skagway, Ketchikan, and Sitka with huge safety margins.",
    "h1": "Alaska Shore Excursions Under 4 Hours",
    "eyebrow": "Port Logistics · Short Excursions",
    "lead": "Not every port day needs to be an exhausting 8-hour marathon. Choosing a short, high-impact excursion under 4 hours delivers incredible bucket-list sights while leaving ample time for lunch, shopping, and total peace of mind before ship departure.",
    "quickRule": "Short excursions provide the highest return-to-ship safety margin. Perfect for ports with afternoon arrivals, late-night departures, or travelers who prefer a relaxed pace.",
    "comparisonMatrix": {
      "headers": [
        "Port",
        "Excursion Under 4 Hours",
        "Exact Duration",
        "Return Buffer"
      ],
      "rows": [
        {
          "category": "Juneau",
          "col1": "Five-Glacier Seaplane Flightseeing",
          "col2": "1.5 hours",
          "verdict": "Departs right from downtown waterfront docks; 90+ minutes return buffer."
        },
        {
          "category": "Juneau",
          "col1": "Helicopter Glacier Landing Walk",
          "col2": "2.5 hours",
          "verdict": "Quick van transfer to heliport, 35 mins flight, 30 mins walking on glacial ice."
        },
        {
          "category": "Skagway",
          "col1": "White Pass Summit Scenic Train",
          "col2": "2.75 to 3 hours",
          "verdict": "Boards directly at the cruise pier, leaving 2 to 3 hours to stroll historic Broadway."
        },
        {
          "category": "Ketchikan",
          "col1": "Misty Fjords Floatplane Flight & Landing",
          "col2": "2 hours",
          "verdict": "Steps from cruise berths; leaves plenty of time for Creek Street and crab shacks."
        },
        {
          "category": "Ketchikan",
          "col1": "Saxman Native Village Totem Tour",
          "col2": "2.5 hours",
          "verdict": "Short 10-minute bus ride to clan house, carving shed, and totem park."
        }
      ]
    },
    "keyTakeaways": [
      "Maximum return-to-ship safety margin: You will never stress about traffic or missing all-aboard with a sub-4-hour tour.",
      "Energy conservation: Enjoy an exhilarating morning adventure, return to the ship for lunch, and spend the afternoon at your own leisure.",
      "Ideal for short port calls: If your ship is docked for only 5 or 6 hours, 4-hour tours are the only cruise-safe choice."
    ],
    "inDepthSections": [
      {
        "heading": "Why More Cruisers Are Choosing Shorter Port Excursions",
        "paragraphs": [
          "Full-day 7-to-9-hour tours carry distinct disadvantages: early morning wake-up calls, hours spent sitting in crowded motorcoaches, boxed lunches, and zero free time to explore the unique charm of port towns.",
          "In contrast, a 2-hour floatplane flight over Misty Fjords or a 3-hour White Pass train ride delivers maximum visual drama with minimal logistical fatigue. You experience the highlight of the region, then have time to sit on a waterfront patio in Ketchikan eating king crab legs or shopping for native art."
        ]
      },
      {
        "heading": "Combining a Short Tour with Independent Walking",
        "paragraphs": [
          "A major benefit of short excursions is the ability to pair a structured morning tour with independent afternoon exploring. In Juneau, taking an early 3-hour whale watch leaves your entire afternoon free to ride the Mount Roberts Tramway, visit the Alaska State Museum, or tour the historic Red Dog Saloon."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "Short excursions provide ample margin for compliance with the 45-minute planning standard.",
      "Confirm whether your short tour includes transportation back to the ship or concludes in the center of town.",
      "In Skagway and Ketchikan, town is right at the pier, so dropping off downtown means you are only a 5-to-10-minute walk from the gangway."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Five-Glacier Seaplane Flightseeing Tour",
        "duration": "1.5 hours",
        "whyItFits": "Waterfront downtown departure with massive aerial glacier views in 90 minutes",
        "searchQuery": "Juneau 5 glacier seaplane flightseeing tour",
        "campaignTag": "decision-short-juneau-seaplane"
      },
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway",
        "duration": "3 hours",
        "whyItFits": "Dockside departure with zero border customs clearance required",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-short-skagway-train"
      },
      {
        "port": "Ketchikan",
        "name": "Misty Fjords Floatplane Flight & Remote Landing",
        "duration": "2 hours",
        "whyItFits": "Departs right in downtown harbor, landing in untouched saltwater fjords",
        "searchQuery": "Misty Fjords floatplane flight remote landing Ketchikan",
        "campaignTag": "decision-short-ketchikan-misty"
      }
    ],
    "faqs": [
      {
        "question": "Are short excursions less scenic than all-day tours?",
        "answer": "Not at all! In Alaska, flightseeing tours last only 1.5 to 2 hours because aircraft travel at 140+ mph, covering in 40 minutes what would take an entire day by boat or road. You see far more remote wilderness in a shorter timeframe."
      },
      {
        "question": "Can I book a short excursion if my ship docks late in the day?",
        "answer": "Yes. Many short tours in Juneau and Skagway offer afternoon departures (e.g., 1:30 PM or 3:00 PM) specifically timed for ships arriving around noon."
      }
    ],
    "relatedActivities": [
      {
        "name": "Juneau Flightseeing",
        "href": "/juneau/flightseeing"
      },
      {
        "name": "Skagway Gold Rush Tours",
        "href": "/skagway/gold-rush-tours"
      },
      {
        "name": "Ketchikan Floatplane Tours",
        "href": "/ketchikan/floatplane-excursions"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Short Port Call Options",
        "href": "/decision/short-port-call-alaska-options"
      },
      {
        "name": "Cruises Safe for Ship Window",
        "href": "/decision/excursions-safe-for-cruise-ship-window"
      },
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      }
    ]
  },
  {
    "slug": "rainy-day-weather-safe-alaska-excursions",
    "title": "Rainy-Day & Weather-Safe Alaska Shore Excursions | Rain-Safe Planning Guide",
    "metaDescription": "What happens when it rains in Alaska? The best weather-safe shore excursions in Ketchikan, Juneau, and Skagway that operate beautifully rain or shine.",
    "h1": "Rainy-Day & Weather-Safe Alaska Shore Excursions",
    "eyebrow": "Weather Planning · Southeast Alaska Rain",
    "lead": "Southeast Alaska is home to the Tongass temperate rainforest, receiving between 60 and 160 inches of rain annually. Smart cruisers don't let precipitation ruin their trip—they choose excursions that are enhanced by rainy weather or completely protected from it.",
    "quickRule": "Whales feed in the rain, temperate rainforests glow in the mist, and mountain train cars are warm and dry. Only high-elevation aviation is truly vulnerable to weather cancellations.",
    "comparisonMatrix": {
      "headers": [
        "Excursion Category",
        "Rain Impact",
        "Enclosed / Heated?",
        "Why It Thrives in Rain"
      ],
      "rows": [
        {
          "category": "Whale Watching (Juneau / ISP)",
          "col1": "Positive / Neutral",
          "col2": "Yes (heated main cabins)",
          "verdict": "Whales are marine animals feeding regardless of surface weather; water surface is calm."
        },
        {
          "category": "White Pass Train (Skagway)",
          "col1": "Neutral to Atmospheric",
          "col2": "Yes (heated parlor cars)",
          "verdict": "Clouds clinging to granite cliffs create dramatic moody scenery; heated vintage cast-iron stoves."
        },
        {
          "category": "Rainforest & Totem Parks (Ketchikan)",
          "col1": "Positive",
          "col2": "Partially (indoor clan houses)",
          "verdict": "Forest canopy acts as natural umbrella; rain brings salmon upstream and makes moss glow."
        },
        {
          "category": "Misty Fjords Boat Cruise (Ketchikan)",
          "col1": "Positive",
          "col2": "Yes (heated indoor salon)",
          "verdict": "Rain creates hundreds of temporary cascading waterfalls down the 3,000-ft cliff faces."
        },
        {
          "category": "Helicopter / Floatplane Flight",
          "col1": "High Sensitivity",
          "col2": "Yes (cabin heated)",
          "verdict": "Cloud ceilings below FAA VFR minimums cause flight cancellations (check operator weather refund terms)."
        }
      ]
    },
    "keyTakeaways": [
      "Rain is not bad weather in Alaska—it is the normal climate that creates the massive glaciers, lush old-growth moss, and roaring waterfalls.",
      "Vessel designs: Alaska tour catamarans feature large panoramic picture windows, wrap-around defrosters, and heated interior seating.",
      "Aviation weather policy: If low clouds ground your helicopter or floatplane, operators typically issue a full refund, leaving time to pivot to town or land tours."
    ],
    "inDepthSections": [
      {
        "heading": "The Truth About Rain in Ketchikan, Juneau, and Skagway",
        "paragraphs": [
          "Ketchikan is famous for receiving over 140 inches of annual precipitation, earning it the nickname 'Rain Capital of Alaska.' However, Alaska rain is rarely a violent tropical downpour. Instead, it is usually a steady, gentle maritime mist or drizzle.",
          "High-grade waterproof rain jackets with hoods (not cheap plastic ponchos, which tear easily in brush and wind) and water-resistant footwear allow you to comfortably enjoy outdoor boardwalks and trails without feeling wet or chilled."
        ]
      },
      {
        "heading": "Tours That Are Actually Better in Rainy Weather",
        "paragraphs": [
          "Misty Fjords National Monument derives its legendary name precisely from the wisps of sea fog and low clouds that drape its 3,000-foot vertical granite walls. During dry sunny spells, many cliffside falls dry to a trickle. In steady rain, thousands of roaring waterfalls plummet directly into the ocean.",
          "Similarly, Mendenhall Glacier ice displays its deepest sapphire-blue hues on overcast, drizzly days. Sunlight bleaches the ice white; cloudy skies allow the dense, compressed crystalline ice to reflect vibrant pure blue light."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "Never cancel a tour yourself due to morning drizzle—operators run safely and sightings are often spectacular.",
      "If an aviation flight is officially cancelled by the pilot due to low ceilings, verify your refund confirmation receipt on the spot.",
      "Keep a warm, dry change of socks in your daypack just in case."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Enclosed Cabin Whale Watching Cruise",
        "duration": "3.5 hours",
        "whyItFits": "Heated indoor cabin with huge glass windows and outdoor covered viewing decks",
        "searchQuery": "Juneau whale watching heated cabin cruise",
        "campaignTag": "decision-rain-juneau-whale"
      },
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway",
        "duration": "3 hours",
        "whyItFits": "Cozy heated vintage train cars with huge windows and historic stoves",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-rain-skagway-train"
      },
      {
        "port": "Ketchikan",
        "name": "Saxman Native Village Clan House & Totem Tour",
        "duration": "2.5 hours",
        "whyItFits": "Indoor cedar clan house dancing, indoor carving shed, and paved walking paths",
        "searchQuery": "Saxman native village totem carving tour Ketchikan",
        "campaignTag": "decision-rain-ketchikan-saxman"
      }
    ],
    "faqs": [
      {
        "question": "Do whale watching tours get cancelled if it rains?",
        "answer": "No. Whales are already submerged underwater and do not care about rain. Tour vessels feature heated enclosed main salons with tables and large windows. Tours only cancel in rare instances of severe gale-force winds that produce excessive wave chop."
      },
      {
        "question": "What should I wear on a rainy port day in Alaska?",
        "answer": "Dress in three layers: a synthetic or merino wool base layer (avoid cotton, which stays wet and cold), an insulating fleece jacket or down sweater, and an outer waterproof breathable rain shell with a hood. Waterproof walking shoes or sneakers treated with water-repellent spray are ideal."
      }
    ],
    "relatedActivities": [
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      },
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Ketchikan Totem Tours",
        "href": "/ketchikan/totem-and-cultural-tours"
      },
      {
        "name": "Misty Fjords Boat Cruise",
        "href": "/ketchikan/misty-fjords-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
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
    "slug": "whale-watching-vs-glacier-tour",
    "title": "Whale Watching vs. Glacier Tour: Which Alaska Excursion to Pick?",
    "metaDescription": "Torn between whale watching and glacier tours in Juneau? Compare sightings, pricing, duration, weather reliability, and combo tour feasibility.",
    "h1": "Whale Watching vs. Glacier Tour: Head-to-Head Comparison",
    "eyebrow": "Excursion Tradeoffs · Head-to-Head",
    "lead": "If you have limited time or budget in Juneau or Icy Strait Point, deciding between a whale watching boat excursion and a glacier tour is the single toughest choice in Alaska cruise planning.",
    "quickRule": "If your ship only visits Juneau for under 6 hours: Pick Whale Watching for the highest probability of wild animal encounters. If in port for 7+ hours: Book a combo tour that does both!",
    "comparisonMatrix": {
      "headers": [
        "Factor",
        "Whale Watching Tour",
        "Glacier Tour (Mendenhall)",
        "Verdict"
      ],
      "rows": [
        {
          "category": "Wildlife Sighting Probability",
          "col1": "High-probability humpback encounters (May-Sept)",
          "col2": "Glacier viewpoints and trail access",
          "verdict": "Both deliver certainty, but breaching whales offer higher adrenaline."
        },
        {
          "category": "Physical Activity",
          "col1": "Low (seated on boat / viewing decks)",
          "col2": "Low to Moderate (0.8-mile trail to falls)",
          "verdict": "Glacier trails allow you to stretch your legs and walk off ship meals."
        },
        {
          "category": "Weather Resilience",
          "col1": "Very High (heated cabins)",
          "col2": "Very High (overcast improves blue ice)",
          "verdict": "Both operate smoothly in rain; zero cancellation risk."
        },
        {
          "category": "Typical Cost",
          "col1": "$140 - $190 per person",
          "col2": "$45 - $80 (shuttle) / $350+ (helicopter)",
          "verdict": "Mendenhall shuttles are the most budget-friendly option in Alaska."
        },
        {
          "category": "Total Duration",
          "col1": "3.5 hours door-to-door",
          "col2": "2.5 to 3 hours door-to-door",
          "verdict": "Both fit easily into standard 5 to 6-hour port calls."
        }
      ]
    },
    "keyTakeaways": [
      "Combo tour sweet spot: If your Juneau port call is 7 hours or longer, book a 5 to 5.5-hour Whale Watch & Mendenhall Glacier Combo to knock out both with seamless shared transportation.",
      "Photographic difference: Whales require fast shutter speeds and telephoto lenses (200mm+); glaciers allow wide-angle framing on smartphones.",
      "Sensory experience: The sound of a 40-ton humpback expelling air through its blowhole rivals the thunderous roar of Nugget Falls."
    ],
    "inDepthSections": [
      {
        "heading": "Why Whale Watching in Juneau is Considered World-Class",
        "paragraphs": [
          "Between May and September, Auke Bay and Favorite Channel act as a banquet table for migrating humpbacks. Nutrient-rich upwelling waters support billions of krill and herring. Operators are so confident in sightings that many commercial operators offer a wildlife credit or refund policy if no whales are spotted; check provider terms.",
          "Seeing multiple humpbacks cooperate in bubble-net feeding—blowing a circle of bubbles to trap baitfish before lunging upward with mouths open wide—is one of the rarest wildlife spectacles on earth."
        ]
      },
      {
        "heading": "Why Visiting Mendenhall Glacier is Essential",
        "paragraphs": [
          "Mendenhall Glacier terminates directly at Mendenhall Lake just 13 miles from cruise docks. It is one of the few places on the continent where you can stand within hundreds of yards of a massive blue glacier face without taking an aircraft or boat.",
          "The easy, flat trail out to Nugget Falls puts you right next to a 377-foot thundering cascade of glacial water, framed by icebergs floating in the lake and steep granite mountain walls."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "If booking a combo tour, ensure it finishes at least 75 minutes before your ship's all-aboard.",
      "Shuttles to Mendenhall require reserved US Forest Service entry permits—never assume you can hail a taxi at the pier.",
      "Check docking location: Ships berthed at AJ Dock must add 15 minutes each way for downtown shuttle transfer."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Juneau Whale Watch & Mendenhall Glacier Combo",
        "duration": "5.5 hours",
        "whyItFits": "Eliminates having to choose—experiences both world-class sights seamlessly",
        "searchQuery": "Juneau whale watching and Mendenhall glacier combo",
        "campaignTag": "decision-tradeoff-combo"
      },
      {
        "port": "Juneau",
        "name": "Small-Group Juneau Whale Watching Cruise",
        "duration": "3.5 hours",
        "whyItFits": "Fast, intimate boat with high historical sighting frequency and heated indoor cabin",
        "searchQuery": "Juneau small group whale watching cruise",
        "campaignTag": "decision-tradeoff-whale"
      },
      {
        "port": "Juneau",
        "name": "Mendenhall Glacier Express Shuttle & Entry",
        "duration": "2.5 to 3 hours",
        "whyItFits": "Budget-friendly, self-paced exploration of Nugget Falls and visitor center",
        "searchQuery": "Juneau Mendenhall Glacier roundtrip shuttle transfer",
        "campaignTag": "decision-tradeoff-mendenhall"
      }
    ],
    "faqs": [
      {
        "question": "Can I do whale watching in Icy Strait Point instead of Juneau?",
        "answer": "Yes! If your cruise visits both Juneau and Icy Strait Point, booking your whale watch at Icy Strait Point (Point Adolphus) frees up your entire Juneau day for Mendenhall Glacier, helicopter ice landings, or the Mount Roberts Tram."
      },
      {
        "question": "Can I walk on Mendenhall Glacier during a standard tour?",
        "answer": "No. The glacier has receded across the lake. Standard tours view the glacier from across Mendenhall Lake. To walk on ice in Juneau, you must book a helicopter glacier landing tour or a guided lake canoe/trek."
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
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "First-Time Alaska Cruisers",
        "href": "/decision/best-excursion-first-time-alaska-cruisers"
      }
    ]
  },
  {
    "slug": "flightseeing-vs-land-excursion",
    "title": "Flightseeing vs. Land Excursions in Alaska: Budget, Weather & Safety",
    "metaDescription": "Is an Alaska flightseeing tour worth the money? Compare helicopter glacier landings and floatplanes to land tours (trains, vans, hikes).",
    "h1": "Flightseeing vs. Land Excursions in Alaska",
    "eyebrow": "Budget & Adventure Tradeoffs · Air vs. Land",
    "lead": "Aviation excursions—landing a helicopter on a glacier or flying a floatplane into Misty Fjords—are the most heavily marketed tours in Alaska. But they are also the most expensive and most weather-dependent. How do they stack up against classic land-based excursions?",
    "quickRule": "Book one bucket-list flight in Juneau or Ketchikan, but ensure you have a planned ground-based backup (train, whale watch, or cultural park) if low clouds close the mountain passes.",
    "comparisonMatrix": {
      "headers": [
        "Factor",
        "Flightseeing (Heli / Floatplane)",
        "Land Excursions (Train / Van / Walk)",
        "Analysis"
      ],
      "rows": [
        {
          "category": "Price Range",
          "col1": "$320 - $650+ per person",
          "col2": "$65 - $200 per person",
          "verdict": "Flightseeing is a premium splurge; land tours offer exceptional value for families."
        },
        {
          "category": "Weather Sensitivity",
          "col1": "High (clouds/fog cause cancellations)",
          "col2": "Very Low (runs rain or shine)",
          "verdict": "Land tours offer high operational certainty regardless of Southeast Alaska drizzle."
        },
        {
          "category": "Visual Perspective",
          "col1": "Panoramic 360° bird's-eye views",
          "col2": "Immersive ground-level scale",
          "verdict": "Flying reveals the vastness of icefields; land tours let you touch history and smell cedar."
        },
        {
          "category": "Physical Effort",
          "col1": "Minimal (seated with short walks)",
          "col2": "Minimal to Moderate",
          "verdict": "Both accommodate wide mobility ranges, though boarding floatplanes requires climbing 2-3 ladder steps."
        },
        {
          "category": "Time Efficiency",
          "col1": "High (covers 50+ miles in 1-2 hours)",
          "col2": "Moderate (slower road / rail transit)",
          "verdict": "Aviation sees vast roadless wilderness in a compact 2-hour port window."
        }
      ]
    },
    "keyTakeaways": [
      "Provider Weather Policies: Independent flight operators typically provide refunds if cloud ceilings prevent flying; verify current terms before booking.",
      "Weight-and-balance FAA rules: Helicopter operators require exact passenger weights at booking. Guests over 250 lbs may incur surcharges.",
      "The hybrid balance: Book a helicopter glacier landing in Juneau where the icefield is unmatched, and choose the White Pass train in Skagway and Totem parks in Ketchikan."
    ],
    "inDepthSections": [
      {
        "heading": "Floatplane vs. Helicopter: Which Aircraft Should You Pick?",
        "paragraphs": [
          "Floatplanes fly faster and travel further. In Ketchikan, a de Havilland Otter floatplane covers the 40-mile distance to Misty Fjords in 20 minutes, landing gently on the saltwater fjord surface. Aircraft are configured for window passenger visibility on high-wing aircraft.",
          "Helicopters fly slower, lower, and possess the singular ability to hover and land on solid glacial ice. If your lifelong dream is physically stepping onto a blue glacier and drinking fresh meltwater, a helicopter tour in Juneau is the only way to achieve it."
        ]
      },
      {
        "heading": "When a Land Excursion is the Smarter Choice",
        "paragraphs": [
          "For travelers with acute fear of heights, inner-ear motion sickness, or families with multiple small children where four $450 flight tickets ($1,800) strain the budget, land excursions are spectacular. Skagway's White Pass train delivers cliffside mountain drama every bit as awe-inspiring as flightseeing, at one-third the price."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "Book morning flight departures: Morning weather is consistently calmer with fewer afternoon thermal wind gusts.",
      "Downtown floatplane slips in Ketchikan and Juneau eliminate airport road transfers, maximizing return buffer.",
      "Always have a backup itinerary in mind (e.g., know which walking trails or museums you will visit if a flight cancels)."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Juneau Icefield Helicopter Glacier Landing",
        "duration": "2.5 hours",
        "whyItFits": "The premier flightseeing adventure in Alaska: fly over icefalls and walk on ancient ice",
        "searchQuery": "Juneau helicopter glacier landing tour",
        "campaignTag": "decision-flight-juneau-heli"
      },
      {
        "port": "Ketchikan",
        "name": "Misty Fjords Floatplane Flight & Remote Landing",
        "duration": "2 hours",
        "whyItFits": "Departs right from downtown Ketchikan harbor; water landing on remote fjords",
        "searchQuery": "Misty Fjords floatplane flight remote landing Ketchikan",
        "campaignTag": "decision-flight-ketchikan-misty"
      },
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway",
        "duration": "3 hours",
        "whyItFits": "The ultimate land-based alternative: alpine mountain pass drama with high weather resilience",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-flight-skagway-train"
      }
    ],
    "faqs": [
      {
        "question": "How often do flightseeing tours get cancelled in Alaska?",
        "answer": "Historically, aviation tours across Southeast Alaska experience an average cancellation rate between 15% and 25% due to low cloud ceilings, dense sea fog, or high summit winds. Cancellations are handled safely and are typically refunded or credited according to the provider's weather terms."
      },
      {
        "question": "Can I bring a camera bag or backpack on a helicopter?",
        "answer": "Due to strict FAA safety regulations, no loose bags, purses, backpacks, or iPads are allowed in the passenger cabin of helicopters. Guests are permitted to carry cameras or phones with secure neck/wrist straps. Operators provide secure lockers at the heliport for backpacks and purses."
      }
    ],
    "relatedActivities": [
      {
        "name": "Helicopter Glacier Landings",
        "href": "/juneau/helicopter-glacier-tours"
      },
      {
        "name": "Ketchikan Flightseeing",
        "href": "/ketchikan/flightseeing"
      },
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Rainy-Day Weather-Safe Excursions",
        "href": "/decision/rainy-day-weather-safe-alaska-excursions"
      }
    ]
  },
  {
    "slug": "alaska-excursions-with-transportation",
    "title": "Alaska Shore Excursions With Pier Pickup & Transportation Included",
    "metaDescription": "Avoid taxis and port confusion. Complete guide to Alaska shore excursions with dedicated cruise pier pickup, shuttle logistics, and dock transfers.",
    "h1": "Alaska Shore Excursions With Transportation Included",
    "eyebrow": "Port Logistics · Dockside Pickups",
    "lead": "Navigating unknown ports with thousands of disembarking passengers can be chaotic. Booking shore excursions with scheduled round-trip pier pickup eliminates taxi lines, rideshare surge pricing, and missing-the-boat anxiety.",
    "quickRule": "Verify your exact cruise pier name before booking. Dedicated excursion coaches meet directly at designated tour bus loading zones steps from the gangway.",
    "comparisonMatrix": {
      "headers": [
        "Port & Dock",
        "Pickup Location",
        "Transit Overhead",
        "Important Logistics"
      ],
      "rows": [
        {
          "category": "Juneau (Franklin/Marine/Steamship)",
          "col1": "Mount Roberts Tramway Parking Lot",
          "col2": "5-min flat walk from gangway",
          "verdict": "Central downtown tour staging hub where all independent coaches load."
        },
        {
          "category": "Juneau (AJ Dock)",
          "col1": "AJ Dock Shuttle Loading Zone",
          "col2": "15-min coach shuttle required",
          "verdict": "Take the port shuttle bus into downtown tram lot to meet excursion guides."
        },
        {
          "category": "Skagway (Railroad / Broadway)",
          "col1": "Direct Pier-Side Tour Parking",
          "col2": "0 to 3-min walk",
          "verdict": "Trains and vans pull directly up to the ship berths; shortest transit in Alaska."
        },
        {
          "category": "Ketchikan (Berths 1-4)",
          "col1": "Berth Tour Plaza / Harbor Float",
          "col2": "2-min walk along boardwalk",
          "verdict": "Floatplanes and coaches load immediately opposite cruise ship gangways."
        },
        {
          "category": "Ketchikan (Ward Cove)",
          "col1": "Ward Cove Shuttle Bus Depot",
          "col2": "20-min shuttle to downtown",
          "verdict": "Complimentary shuttle bus runs continuously between Ward Cove and downtown berths."
        },
        {
          "category": "Sitka (Old Sitka Dock)",
          "col1": "Sitka Sound Terminal Shuttle",
          "col2": "10-min shuttle to Harrigan Hall",
          "verdict": "Free terminal motorcoaches transfer guests to downtown Harrigan Centennial Hall."
        }
      ]
    },
    "keyTakeaways": [
      "No car rentals needed: In Southeast Alaska, roads do not connect to the continental highway system. Commercial tour operators provide all required passenger transit.",
      "Dedicated port dispatchers: Independent excursion companies station uniformed dispatchers holding signs at the cruise terminal exits.",
      "Clear return points: All excursions with transportation are scheduled to return drop-off directly to the cruise pier or adjacent downtown shuttle staging areas."
    ],
    "inDepthSections": [
      {
        "heading": "Port-by-Port Dock Logistics: What Every Cruise Passenger Must Know",
        "paragraphs": [
          "Understanding where your specific ship ties up is the key to stress-free port transit. In Juneau, most ships dock at the Franklin, Marine, or Steamship docks right in downtown. However, Norwegian and large megaships often berth at the AJ Dock, 1 mile south. A dedicated port shuttle transfers passengers to the Mount Roberts Tram parking lot, where nearly all independent whale watching and Mendenhall shuttles depart.",
          "In Ketchikan, Berths 1 through 4 are located directly downtown along Front Street. But if you sail on Norwegian, Oceania, or Regent, your ship may dock at Ward Cove, 7 miles north. Ward Cove provides complimentary motorcoach shuttles into downtown Ketchikan (20-minute drive each way)."
        ]
      },
      {
        "heading": "Why Hailing Taxis or Rideshares in Alaska is Risky",
        "paragraphs": [
          "Unlike major metropolitan cities, Alaska cruise ports have extremely limited fleets of taxis and rideshare drivers. On days when four or five ships dump 12,000 passengers into Juneau or Ketchikan, hailing an unreserved Uber or taxi to visit Mendenhall Glacier can result in 45-minute waits or total unavailability.",
          "Booking an organized shore excursion with scheduled round-trip coach or van transportation locks in your seat and eliminates any risk of being stranded away from the port."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "Always carry your excursion confirmation voucher with the local dispatcher's dispatch phone number.",
      "Confirm whether your tour returns to the pier or downtown center—in Skagway and Ketchikan, town IS the pier.",
      "Build in 15 minutes of buffer for boarding terminal shuttles at AJ Dock, Ward Cove, and Old Sitka."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Juneau Whale Watching Safari with Pier Coach",
        "duration": "3.5 hours",
        "whyItFits": "Includes round-trip motorcoach transit from Mount Roberts Tramway lot to Auke Bay Harbor",
        "searchQuery": "Juneau whale watching tour transportation included",
        "campaignTag": "decision-transit-juneau-whale"
      },
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway",
        "duration": "3 hours",
        "whyItFits": "Direct dockside train boarding at Railroad Dock—zero street transit required",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-transit-skagway-train"
      },
      {
        "port": "Ketchikan",
        "name": "Alaska Rainforest Sanctuary & Wildlife Walk",
        "duration": "3 hours",
        "whyItFits": "Coaches pick up right at cruise berths for scenic coastal transfer to Herring Cove",
        "searchQuery": "Ketchikan Alaska rainforest sanctuary wildlife walk",
        "campaignTag": "decision-transit-ketchikan-rainforest"
      }
    ],
    "faqs": [
      {
        "question": "How do I find my independent tour guide when stepping off the ship?",
        "answer": "After walking down the ship gangway and exiting the port security canopy, look for uniformed tour representatives holding signs with the tour name or operator logo. In Juneau, they gather in the Mount Roberts Tram parking plaza. In Ketchikan and Skagway, they wait right outside the pier security gates."
      },
      {
        "question": "Is there Uber or Lyft in Juneau and Ketchikan?",
        "answer": "Rideshare apps operate in Juneau and Ketchikan, but driver fleets are tiny (often fewer than 10 to 15 active cars across the entire city). During peak cruise disembarkation hours, wait times can exceed an hour with extreme surge pricing. Relying on rideshare to return to your ship on time is dangerous."
      }
    ],
    "relatedActivities": [
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      },
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Ketchikan Rainforest Tours",
        "href": "/ketchikan/wildlife-and-rainforest-tours"
      },
      {
        "name": "Mendenhall Glacier Tours",
        "href": "/juneau/mendenhall-glacier-tours"
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
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      }
    ]
  },
  {
    "slug": "last-minute-alaska-shore-excursions",
    "title": "Last-Minute Alaska Shore Excursions: What Books Out vs. Stays Available",
    "metaDescription": "Booking Alaska shore excursions late? Discover which tours sell out months in advance and which high-quality excursions remain bookable last minute.",
    "h1": "Last-Minute Alaska Shore Excursions: What Books Out vs. What Stays Open",
    "eyebrow": "Booking Strategy · Availability & Timing",
    "lead": "Didn't book your Alaska shore excursions six months in advance? Don't panic. While a few ultra-capacity-constrained tours sell out quickly, dozens of top-rated Alaska experiences maintain reliable availability right up to port day.",
    "quickRule": "Sell Out Early: Glacier dog sledding, Anan Creek bears, private boat charters. Stay Open Late: Large whale catamarans, Mendenhall shuttles, White Pass summit rail, and historic town streetcars.",
    "comparisonMatrix": {
      "headers": [
        "Excursion Type",
        "Sell-Out Timeline",
        "Availability Risk",
        "Last-Minute Strategy"
      ],
      "rows": [
        {
          "category": "Glacier Dog Sledding (Helicopter)",
          "col1": "4 to 6 months in advance",
          "col2": "Extreme (very few helicopter snow seats)",
          "verdict": "Check daily for weather cancellations or pivot to standard helicopter glacier landing."
        },
        {
          "category": "Anan Creek Bear Viewing (Ketchikan)",
          "col1": "6 to 9 months in advance",
          "col2": "Extreme (USFS limits 60 permits/day)",
          "verdict": "Book road-based Herring Cove black bear tours or Traitors Cove fly-ins instead."
        },
        {
          "category": "Juneau Whale Watching",
          "col1": "1 to 2 weeks before sailing",
          "col2": "Low to Moderate",
          "verdict": "Multiple high-capacity catamarans operate out of Auke Bay; easy last-minute booking."
        },
        {
          "category": "White Pass Summit Railway (Skagway)",
          "col1": "2 to 3 weeks before sailing",
          "col2": "Moderate",
          "verdict": "Train operators add extra cars based on demand; morning and midday slots usually open."
        },
        {
          "category": "Mendenhall Glacier Shuttles (Juneau)",
          "col1": "A few days in advance",
          "col2": "Moderate (Forest Service permit caps)",
          "verdict": "Book certified commercial shuttle passes online 48 hours prior to arrival."
        }
      ]
    },
    "keyTakeaways": [
      "Cancellation churn: In the 48 to 72 hours before a ship docks, passengers frequently cancel excursions due to schedule changes, opening up prime sold-out slots.",
      "Avoid the pier tour desk lottery: Walking off the gangway and hoping to buy tours from pier kiosks often results in paying inflated prices for bottom-tier leftovers.",
      "Online direct reservation: Booking independent excursions online 1 to 3 days ahead locks in your confirmed pickup time and return buffer."
    ],
    "inDepthSections": [
      {
        "heading": "Why Certain Alaska Tours Sell Out Months in Advance",
        "paragraphs": [
          "Capacity limits in Alaska are governed by physics and federal conservation permits. High-elevation glacier dog sledding requires turbine helicopters with limited passenger payload and remote snow camps that operate for only 10 to 12 weeks.",
          "Similarly, world-class bear viewing sites like Anan Creek near Ketchikan are strictly managed by the US Forest Service, which issues only 60 total commercial visitor passes per day to protect wild bears. Once those 60 daily permits are booked, no amount of money can create an extra seat."
        ]
      },
      {
        "heading": "The Best Last-Minute Alternatives That Deliver Equal Thrills",
        "paragraphs": [
          "If helicopter dog sledding is sold out, book a standard Helicopter Glacier Landing. You fly the exact same scenic route over the Juneau Icefield, land on the ancient blue ice of Herbert Glacier, and walk across crevasses—at roughly half the cost.",
          "If Anan Creek bear viewing is unavailable, book an afternoon tour to the Alaska Rainforest Sanctuary at Herring Cove or take a floatplane tour into Misty Fjords."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "When booking last-minute, meticulously double-check your ship's exact port arrival and all-aboard times.",
      "Avoid uncoordinated curbside vendors who lack structured ship-return planning.",
      "Ensure you receive an instant digital confirmation with emergency local contact numbers."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Express Juneau Whale Watching Catamaran",
        "duration": "3.5 hours",
        "whyItFits": "High-capacity vessel with excellent last-minute seat availability and high sighting probability",
        "searchQuery": "Juneau whale watching catamaran tour last minute",
        "campaignTag": "decision-lastmin-juneau-whale"
      },
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway",
        "duration": "3 hours",
        "whyItFits": "High-capacity vintage train with reliable ticket availability across multiple daily departures",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-lastmin-skagway-train"
      },
      {
        "port": "Ketchikan",
        "name": "Misty Fjords Floatplane Flightseeing",
        "duration": "2 hours",
        "whyItFits": "Fleet of bush planes allows flexible departure slot additions for cruise travelers",
        "searchQuery": "Misty Fjords floatplane flight remote landing Ketchikan",
        "campaignTag": "decision-lastmin-ketchikan-misty"
      }
    ],
    "faqs": [
      {
        "question": "Can I book shore excursions on the morning I arrive in port?",
        "answer": "Yes, many independent operators accept same-day mobile bookings up to 1 to 2 hours prior to tour departure, provided seats remain. Booking online via mobile before walking off the ship secures your confirmed seat."
      },
      {
        "question": "Are last-minute shore excursions cheaper?",
        "answer": "Unlike Caribbean resort hotels, Alaska tour operators rarely discount last-minute seats because summer demand outstrips supply. You will pay standard published rates, but booking independently still saves 20% to 40% compared to cruise line shipboard excursion desks."
      }
    ],
    "relatedActivities": [
      {
        "name": "Juneau Whale Watching",
        "href": "/juneau/whale-watching"
      },
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Misty Fjords Tours",
        "href": "/ketchikan/misty-fjords-tours"
      },
      {
        "name": "Mendenhall Glacier Tours",
        "href": "/juneau/mendenhall-glacier-tours"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Cruises Safe for Ship Window",
        "href": "/decision/excursions-safe-for-cruise-ship-window"
      }
    ]
  },
  {
    "slug": "excursions-safe-for-cruise-ship-window",
    "title": "How to Book Cruise-Safe Alaska Shore Excursions | The 45-Minute Rule",
    "metaDescription": "The definitive guide to cruise-safe Alaska shore excursions. Learn the 45-Minute All-Aboard Rule, calculate true port time, and avoid missing your ship.",
    "h1": "How to Book Cruise-Safe Alaska Shore Excursions: The 45-Minute Rule",
    "eyebrow": "Cruise Safety · Port Timing Mastery",
    "lead": "Every cruise traveler shares one common fear: watching their ship sail away into the sunset while they are stranded on the pier. Cruise lines exploit this fear to charge inflated prices for shipboard tours. With our definitive 45-Minute Rule, you can safely book independent excursions with total confidence.",
    "quickRule": "THE GOLDEN CRUISE-SAFE FORMULA: Tour End Time + 45 Minutes MUST be earlier than your ship's All-Aboard time. Never label an excursion cruise-safe when timing, meeting points, or return margins are unknown.",
    "comparisonMatrix": {
      "headers": [
        "Port Time Metric",
        "What the Cruise Line Publishes",
        "Real-World Reality",
        "Required Safety Action"
      ],
      "rows": [
        {
          "category": "Arrival / Dock Time",
          "col1": "e.g., '1:00 PM Arrival'",
          "col2": "Ship must clear local authorities; gangways open 20–30 mins later",
          "verdict": "Do not schedule any tour departure earlier than 30–45 minutes after published arrival."
        },
        {
          "category": "Departure Time",
          "col1": "e.g., '9:00 PM Departure'",
          "col2": "Gangways are pulled up 30 to 45 minutes BEFORE departure",
          "verdict": "Your actual deadline is All-Aboard (e.g. 8:15 PM or 8:30 PM), NOT 9:00 PM."
        },
        {
          "category": "AJ Dock / Ward Cove",
          "col1": "Treated like standard port",
          "col2": "Requires 15–20 min coach shuttles each way to reach downtown",
          "verdict": "Add 45 minutes of total transit buffer to your port day calculation."
        },
        {
          "category": "Tour Finish Margin",
          "col1": "N/A",
          "col2": "Traffic, harbor docking, and shuttle lines take time",
          "verdict": "Require tour finish time + 45 mins to be prior to All-Aboard."
        }
      ]
    },
    "keyTakeaways": [
      "All-Aboard is the only deadline that matters: The ship will pull up gangways exactly at the published All-Aboard time. Disregard the departure time when planning excursions.",
      "Ship Time vs. Local Time: Ensure your manual watch matches the ship's onboard clock. Smart phones frequently jump time zones when picking up coastal cell towers.",
      "Independent Operator standards: Reputable independent Alaska excursion operators design schedules specifically around cruise ship port calls, maintaining disciplined return buffers."
    ],
    "inDepthSections": [
      {
        "heading": "Deconstructing Cruise Line Scare Tactics",
        "paragraphs": [
          "Cruise lines often claim: 'If you book an independent tour and it runs late, the ship won't wait for you.' While technically true that the ship is not obligated to wait for non-ship excursions, the reality is that independent Alaska tour operators are local businesses whose entire livelihoods depend on cruise passengers.",
          "Professional independent tour operators track maritime AIS ship tracking data in real time. They know your ship's captain, schedule, and all-aboard times better than most shipboard staff. They deliberately calibrate their departure and return times to ensure you step onto the pier with 60 to 90 minutes of cushion."
        ]
      },
      {
        "heading": "Step-by-Step: How to Calculate Your True Usable Port Window",
        "paragraphs": [
          "1. Start with your published port arrival time and ADD 30 minutes for gangway clearance (e.g., 7:00 AM arrival = 7:30 AM earliest tour meet time).",
          "2. Take your published port departure time and SUBTRACT 45 minutes to find your All-Aboard deadline (e.g., 4:00 PM departure = 3:15 PM All-Aboard).",
          "3. Apply our 45-Minute Safety Margin to the All-Aboard time (3:15 PM - 45 mins = 2:30 PM latest acceptable tour end time).",
          "Result: A 7:00 AM to 4:00 PM port call provides a safe excursion window between 7:30 AM and 2:30 PM (7 hours of usable tour time)."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "Take a photo of the ship's All-Aboard clock located at the gangway security desk before disembarking.",
      "Keep the ship port agent's emergency phone number (printed on your daily cruise compass / freestyle daily bulletin) saved in your phone.",
      "Never leave a tour meeting area without letting your tour guide know."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Express Juneau Whale Watching Cruise",
        "duration": "3.5 hours",
        "whyItFits": "Designed specifically with 75-90 minute pier return cushion for standard cruise windows",
        "searchQuery": "Juneau express whale watching tour cruise safe",
        "campaignTag": "decision-cruisesafe-juneau-whale"
      },
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway",
        "duration": "3 hours",
        "whyItFits": "Dockside train boarding with zero transit lag and direct return to ship gangways",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-cruisesafe-skagway-train"
      },
      {
        "port": "Ketchikan",
        "name": "Misty Fjords Floatplane Flight & Landing",
        "duration": "2 hours",
        "whyItFits": "Takes off and lands directly on Tongass Narrows right alongside cruise berths",
        "searchQuery": "Misty Fjords floatplane flight remote landing Ketchikan",
        "campaignTag": "decision-cruisesafe-ketchikan-misty"
      }
    ],
    "faqs": [
      {
        "question": "Has an independent tour booked through your recommended operators ever caused a guest to miss their ship?",
        "answer": "No. Professional independent operators in Southeast Alaska have served millions of cruise passengers over decades with an immaculate safety record. In the exceedingly rare event that an operator's vehicle experiences mechanical breakdown, operators coordinate emergency backup transport or pay all expenses to transport guests to the next port of call."
      },
      {
        "question": "What should I do if our cruise ship is delayed getting into port?",
        "answer": "If your ship arrives late into port, contact your excursion provider immediately (phone numbers are on your confirmation voucher). Because operators monitor cruise arrival times, they will automatically shift your tour departure time back or issue a refund or credit per their port-delay policy; confirm current terms with the provider."
      }
    ],
    "relatedActivities": [
      {
        "name": "Excursions by Ship Time",
        "href": "/juneau/excursions-by-cruise-ship-time"
      },
      {
        "name": "Excursions by Duration",
        "href": "/skagway/excursions-by-duration-and-ship-window"
      },
      {
        "name": "Excursions With Transportation",
        "href": "/decision/alaska-excursions-with-transportation"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Short Port Call Options",
        "href": "/decision/short-port-call-alaska-options"
      },
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      }
    ]
  },
  {
    "slug": "short-port-call-alaska-options",
    "title": "Short Port Call Alaska Options | What to Do With 4 to 6 Hours in Port",
    "metaDescription": "Got a short 4 to 6-hour Alaska cruise port stop? Fast action plans and high-impact shore excursions for quick calls in Juneau, Skagway, Ketchikan, and Sitka.",
    "h1": "Short Port Call Alaska Options: What to Do With 4 to 6 Hours in Port",
    "eyebrow": "Port Timing Strategy · Quick Port Calls",
    "lead": "A short port call of 4, 5, or 6 hours can feel daunting. Many passengers simply stay on the ship, thinking there isn't enough time to do anything meaningful. That is a massive mistake. With the right fast-action itinerary, a short port call can be one of your most exhilarating Alaska days.",
    "quickRule": "On a 4 to 6-hour port call: Eliminate long road transfers. Choose tours that board right at the pier (floatplanes, dockside trains, downtown historic walks, or express 3-hour whale boats).",
    "comparisonMatrix": {
      "headers": [
        "Port",
        "Recommended 4-Hour Action Plan",
        "Tour Duration",
        "Remaining Buffer"
      ],
      "rows": [
        {
          "category": "Juneau",
          "col1": "Five-Glacier Seaplane Flight or Express Whale Watch",
          "col2": "1.5 to 3.5 hours",
          "verdict": "Seaplane boards downtown (90 min total); express whale boat has heated cabin and high sighting probability."
        },
        {
          "category": "Skagway",
          "col1": "White Pass Summit Railway (Morning / Afternoon loop)",
          "col2": "2.75 hours",
          "verdict": "Boards directly at the Railroad Dock; returns you with 60 to 90 minutes to spare."
        },
        {
          "category": "Ketchikan",
          "col1": "Misty Fjords Floatplane Flight or Creek Street Walk",
          "col2": "2 hours",
          "verdict": "Floatplanes meet right in downtown harbor; Creek Street is a 5-minute walk from berths."
        },
        {
          "category": "Sitka",
          "col1": "Sitka National Historical Park Totem Loop & Raptor Center",
          "col2": "2.5 to 3 hours",
          "verdict": "Take terminal shuttle to Harrigan Hall, walk the coastal rainforest totem trail, and see eagles."
        }
      ]
    },
    "keyTakeaways": [
      "Avoid combo excursions: Never attempt a combination whale watch + glacier hike on a port call under 7 hours.",
      "Stay within 15 minutes of the port: Choose activities centered around the immediate harbor or downtown road system.",
      "Strict 45-Minute All-Aboard Rule: Always confirm that your chosen excursion finishes at least 45 minutes prior to ship all-aboard."
    ],
    "inDepthSections": [
      {
        "heading": "Why Short Port Calls Require Precise Geographic Strategy",
        "paragraphs": [
          "On an 8-hour port call, spending 45 minutes in a motorcoach each way is no problem. On a 5-hour port call, spending 90 minutes in road transit destroys 30% of your entire time ashore.",
          "The solution is choosing excursions with zero or minimal vehicle transit. In Ketchikan, floatplanes take off directly from the saltwater channel right alongside your cruise ship. In Skagway, the White Pass train tracks run directly onto the pier. In Juneau, seaplanes depart from the downtown waterfront."
        ]
      },
      {
        "heading": "What to Do if You Have Only 4 Hours in Port",
        "paragraphs": [
          "A 4-hour port call (e.g. 1:00 PM to 5:00 PM) means All-Aboard is 4:30 PM. With gangway clearance at 1:20 PM, you have approximately 3 hours of safe usable time.",
          "In Juneau, do the 1.5-hour Five-Glacier Seaplane Discovery or take the Mount Roberts Tramway to the 1,800-foot alpine ridge. In Ketchikan, take a 2-hour Misty Fjords floatplane flight or explore Creek Street and the Totem Heritage Center on foot."
        ]
      }
    ],
    "cruiseSafetyAdvice": [
      "Be among the first passengers in line at the gangway when the ship is cleared.",
      "Carry your ship keycard, photo ID, and excursion confirmation ready in hand.",
      "Set a loud phone alarm for 30 minutes before your ship's All-Aboard time."
    ],
    "recommendedTours": [
      {
        "port": "Juneau",
        "name": "Five-Glacier Seaplane Flightseeing Tour",
        "duration": "1.5 hours",
        "whyItFits": "Downtown waterfront departure; massive glacier scenery in under 90 minutes",
        "searchQuery": "Juneau 5 glacier seaplane flightseeing tour",
        "campaignTag": "decision-shortcall-juneau-seaplane"
      },
      {
        "port": "Skagway",
        "name": "White Pass Summit Scenic Railway",
        "duration": "3 hours",
        "whyItFits": "Dockside train boarding with no border customs required on summit loop",
        "searchQuery": "Skagway White Pass summit train excursion",
        "campaignTag": "decision-shortcall-skagway-train"
      },
      {
        "port": "Ketchikan",
        "name": "Misty Fjords Floatplane Flight & Remote Landing",
        "duration": "2 hours",
        "whyItFits": "Steps from cruise berths; fast water landing in pristine alpine fjords",
        "searchQuery": "Misty Fjords floatplane flight remote landing Ketchikan",
        "campaignTag": "decision-shortcall-ketchikan-misty"
      }
    ],
    "faqs": [
      {
        "question": "Is it worth getting off the cruise ship for a 4-hour port call?",
        "answer": "Yes, absolutely! Four hours is plenty of time to fly over five glaciers in Juneau, ride the historic train to the White Pass Summit in Skagway, or explore historic Creek Street in Ketchikan. Staying on the ship means missing irreplaceable Alaska experiences."
      },
      {
        "question": "Can I do Mendenhall Glacier on a 4-hour Juneau port call?",
        "answer": "It is very tight. The round-trip drive to Mendenhall takes 50 minutes total. With a 3-hour usable window, you would only have about 60 to 75 minutes at the glacier. An express whale watch or downtown seaplane flight is a much safer, higher-margin choice."
      }
    ],
    "relatedActivities": [
      {
        "name": "Juneau Flightseeing",
        "href": "/juneau/flightseeing"
      },
      {
        "name": "White Pass Railway",
        "href": "/skagway/white-pass-railway-tours"
      },
      {
        "name": "Ketchikan Floatplane Tours",
        "href": "/ketchikan/floatplane-excursions"
      },
      {
        "name": "Excursions by Ship Time",
        "href": "/juneau/excursions-by-cruise-ship-time"
      }
    ],
    "relatedDecisions": [
      {
        "name": "Excursions Under 4 Hours",
        "href": "/decision/alaska-excursions-under-4-hours"
      },
      {
        "name": "Cruises Safe for Ship Window",
        "href": "/decision/excursions-safe-for-cruise-ship-window"
      },
      {
        "name": "Best Excursion for Each Port",
        "href": "/decision/best-excursion-for-each-port"
      }
    ]
  }
];

export function getDecisionPages(): DecisionPage[] {
  return DECISION_PAGES;
}

export function getDecisionPage(slug: string): DecisionPage | null {
  return DECISION_PAGES.find((d) => d.slug === slug) ?? null;
}
