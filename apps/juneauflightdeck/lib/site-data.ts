export type CuratedTour = {
  slug: string;
  name: string;
  shortName: string;
  cardHighlight: string;
  durationLabel: string;
  cruiseTiming: string;
  badges: string[];
  highlights: string[];
  included: string[];
  benefitBullets: string[];
  detailIntro: string;
  experienceNote: string;
  heroImage: string;
  imageAlt: string;
  gallery: Array<{ src: string; alt: string }>;
  fareharborMatch: RegExp[];
};

export const curatedTours: CuratedTour[] = [
  {
    slug: "helicopter-glacier-landing",
    name: "Helicopter Glacier Landing",
    shortName: "Glacier Landing",
    cardHighlight: "Land on pure ice and step into the signature Juneau helicopter experience.",
    durationLabel: "25 to 35 min flight window",
    cruiseTiming: "Fits most 4 to 6 hour Juneau calls with a practical return buffer.",
    badges: ["Most Popular", "Best for First-Timers"],
    highlights: [
      "Aerial glacier views before touching down on an ancient icefield",
      "Shorter overall footprint that works well for cruise schedules",
      "Strong default choice when you want the classic Juneau helicopter memory",
    ],
    included: [
      "Helicopter flight over Juneau icefields",
      "Guided glacier landing time for photos and glacier access",
      "Operator safety briefing and overboots where required",
    ],
    benefitBullets: [
      "The cleanest premium entry point for most Juneau visitors",
      "Balances spectacle, cruise timing, and booking flexibility",
      "Easy choice when you want the glacier landing without overcomplicating the day",
    ],
    detailIntro:
      "This is the signature Juneau helicopter day: dramatic lift-off, broad glacier views, then the moment the skids touch real ice. It is premium, efficient, and built for travelers who want one unforgettable Alaska excursion done right.",
    experienceNote:
      "Best if you want the iconic glacier landing without committing your entire port day to one experience block.",
    heroImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Helicopter above glacier ice near Juneau, Alaska",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80",
        alt: "Helicopter approaching a glacier landing zone in Alaska",
      },
      {
        src: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80",
        alt: "Blue glacier textures photographed during a Juneau helicopter tour",
      },
    ],
    fareharborMatch: [/\bglacier\b.*\blanding\b/i, /\blanding\b.*\bglacier\b/i],
  },
  {
    slug: "dogsled-helicopter-combo",
    name: "Dogsled + Helicopter Combo",
    shortName: "Dogsled Combo",
    cardHighlight: "Helicopter access plus a glacier dogsled experience for the fullest premium day.",
    durationLabel: "2.5 to 3.5 hour total experience",
    cruiseTiming: "Best for longer port calls or independent Juneau stays.",
    badges: ["Adventure Pick", "Private Available"],
    highlights: [
      "Helicopter access to glacier terrain unreachable by standard tours",
      "High-energy dogsled portion makes this the most memorable combo day",
      "Premium choice when you want one huge Alaska story instead of a quick sampler",
    ],
    included: [
      "Helicopter transfer to glacier dogsled base",
      "Musher-led dogsled segment on snow and ice conditions permitting",
      "Cold-weather gear support and operator briefing",
    ],
    benefitBullets: [
      "The strongest one-shot Alaska adventure for premium buyers",
      "Combines aerial spectacle with an on-glacier activity instead of only sightseeing",
      "Works best when you can give the day enough runway",
    ],
    detailIntro:
      "For travelers who do not want to play small with their Alaska day, this is the hero experience. The helicopter gets you onto the glacier and the dogsled component turns the outing from scenic to fully immersive.",
    experienceNote:
      "This is the luxury-adventure choice when you want the highest ceiling memory and have enough port time to support it.",
    heroImage:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Snowy Alaska landscape suited to glacier dogsled helicopter tours",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80",
        alt: "Snowfield scenery for a Juneau dogsled helicopter combo",
      },
      {
        src: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
        alt: "Wide aerial Alaska icefield view on a helicopter adventure",
      },
    ],
    fareharborMatch: [/\bdog.?sled\b/i],
  },
  {
    slug: "icefield-flightseeing",
    name: "Icefield Flightseeing",
    shortName: "Icefield Flightseeing",
    cardHighlight: "Pure aerial drama over ridgelines, glaciers, and deep blue crevasses.",
    durationLabel: "30 to 45 min flight time",
    cruiseTiming: "Great for tighter cruise schedules and photography-first buyers.",
    badges: ["Scenic Favorite", "Photography Focus"],
    highlights: [
      "Big-view flight path over multiple glaciers and mountain ridges",
      "Lower-friction option for travelers who want the helicopter spectacle fast",
      "Excellent if weather or timing makes a landing less attractive",
    ],
    included: [
      "Extended scenic helicopter routing over Juneau icefields",
      "Pilot narration focused on glacier terrain and mountain landmarks",
      "Direct booking via FareHarbor with live item availability",
    ],
    benefitBullets: [
      "Strongest fit when aerial scenery matters more than stepping onto the ice",
      "Often the easiest premium helicopter option to fit into a cruise day",
      "Cleaner move for photography-minded travelers who want maximum views per minute",
    ],
    detailIntro:
      "Some travelers want the helicopter and the views, not the extra ground time. This flightseeing option leans into what helicopters do best: distance, drama, and an Alaska skyline that keeps changing every minute.",
    experienceNote:
      "Ideal for scenic-first travelers, shorter port windows, and anyone who values the flight itself over the landing.",
    heroImage:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Helicopter flightseeing above icy mountain ridges in Alaska",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1200&q=80",
        alt: "Icefield aerial view for Juneau helicopter flightseeing",
      },
      {
        src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
        alt: "Mountain and glacier panorama near Juneau, Alaska",
      },
    ],
    fareharborMatch: [/\bicefield\b/i, /\bflightseeing\b/i, /\bhelicopter\b/i],
  },
  {
    slug: "private-helicopter-charter",
    name: "Private Helicopter Charter",
    shortName: "Private Charter",
    cardHighlight: "A private helicopter format for couples, families, photographers, or custom Alaska moments.",
    durationLabel: "Custom duration based on route",
    cruiseTiming: "Best when you want privacy, a custom route, or a milestone experience.",
    badges: ["Private", "Best for Special Occasions"],
    highlights: [
      "More privacy, more control, and a more tailored glacier experience",
      "Ideal for milestone trips, proposal energy, or serious photography",
      "Best route when the standard group format feels too generic",
    ],
    included: [
      "Private helicopter routing subject to operator format",
      "Custom timing and scenic emphasis based on availability",
      "Direct booking request through FareHarbor item or charter contact",
    ],
    benefitBullets: [
      "The most exclusive helicopter option on the site",
      "Better fit for couples, families, and travelers who want less noise around the experience",
      "Useful when you care as much about privacy as the glacier itself",
    ],
    detailIntro:
      "Private helicopter charters are for travelers who want Alaska to feel personal. That could mean a quieter glacier moment, a custom scenic route, or simply avoiding the standard shared-tour pacing.",
    experienceNote:
      "Best when the goal is exclusivity, flexibility, or a more cinematic private moment on the ice.",
    heroImage:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Private helicopter experience above glacier scenery in Juneau",
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
        alt: "Premium Alaska scenery for a private helicopter charter",
      },
      {
        src: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
        alt: "High-end aerial glacier landscape suited to a private helicopter tour",
      },
    ],
    fareharborMatch: [/\bprivate\b/i, /\bcharter\b/i],
  },
];

export const sharedGallery = [
  {
    src: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1400&q=80",
    alt: "Helicopter tour mood image for Alaska adventure travel",
  },
  {
    src: "https://images.unsplash.com/photo-1517821099601-3ecf4bf9db7b?auto=format&fit=crop&w=1400&q=80",
    alt: "Cinematic glacier and mountain scene for Juneau helicopter marketing",
  },
  {
    src: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1400&q=80",
    alt: "Glacier landing environment in Alaska",
  },
];
