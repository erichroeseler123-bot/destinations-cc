import type { AttractionPillarConfig } from "@/app/components/dcc/AttractionPillarTemplate";

export const FREMONT_STREET_PILLAR: AttractionPillarConfig = {
  slug: "fremont-street",
  pageUrl: "https://destinationcommandcenter.com/fremont-street",
  eyebrow: "DCC District Hub",
  title: "Fremont Street hotels, casinos, nightlife, and downtown Vegas planning",
  description:
    "Fremont Street is the downtown Vegas district hub. This page covers classic-casino energy, bars and nightlife, Fremont attractions, nearby hotels, and how downtown fits differently from Strip-first itineraries.",
  placeName: "Fremont Street",
  gridTitle: "Best Fremont and downtown booking lanes",
  gridDescription:
    "These links focus on downtown Vegas booking behavior: Fremont nightlife, old-Vegas attractions, bar crawls, and nearby experience inventory.",
  schemaType: "CollectionPage",
  tripPlanningSnapshot: [
    { label: "Best time to go", value: "Evening into late night when canopy shows, bars, and casino energy are at full strength." },
    { label: "Typical visit style", value: "Shorter walking loops with casino hopping, bars, and old-Vegas attractions." },
    { label: "Good for", value: "Nightlife • Casual groups • Lower-cost casino energy • Old Vegas contrast" },
    { label: "Popular ways to experience it", value: "Canopy walk • Bar crawl • Casino hop • Downtown hotel stay" },
    { label: "Nearby highlights", value: "Golden Nugget • Circa • SlotZilla • Neon Museum" },
    { label: "Main planning risk", value: "Crowding, noise, and nightlife spillover intensify quickly after dark." },
  ],
  highlights: [
    { title: "Best for downtown energy", body: "Fremont works for buyers who want old-Vegas contrast, shorter walking loops, and lower-cost casino energy than the Strip." },
    { title: "Best for nightlife spillover", body: "Downtown supports bar crawls, canopy spectacle, casino hopping, and late-night routing without needing a full Strip commitment." },
    { title: "Best for mesh depth", body: "This hub naturally connects downtown hotels, casinos, attractions, bars, and future restaurant nodes." },
  ],
  realityCheckSummary: [
    "Fremont is denser and easier to cover than the Strip, but that also means noise, crowding, and late-night spillover hit faster.",
    "People treat it like a simple cheap alternative to the Strip when it is really a different nightlife and casino mode.",
    "Hotel choice matters because the feel changes quickly once you are a few blocks off the canopy core.",
  ],
  realityCheckEvidence: [
    {
      title: "Fremont Street Experience crowd flow at night",
      url: "https://www.youtube.com/watch?v=9dz1Jm4xv8I",
      source: "Recent downtown Las Vegas walk-through",
      type: "video",
      whyItMatters:
        "Shows the actual canopy crowd density, noise level, and why Fremont works well for some nightlife buyers and badly for others.",
      tags: ["crowds", "nightlife", "downtown"],
    },
    {
      title: "Hotels near Fremont Street Experience",
      url: "https://destinationcommandcenter.com/hotels-near/fremont-street-experience",
      source: "DCC relationship guide",
      type: "traveler-tip",
      whyItMatters:
        "Useful route-planning evidence when the real question is not whether to visit Fremont, but where to stay to make downtown easier.",
      tags: ["hotels", "relationship", "planning"],
    },
  ],
  tourFallbacks: [
    { label: "Fremont Street tours", query: "fremont street tour las vegas" },
    { label: "Downtown Las Vegas nightlife experiences", query: "downtown las vegas nightlife experience" },
    { label: "Fremont bar crawls", query: "fremont street bar crawl" },
    { label: "Old Vegas walking tours", query: "old vegas walking tour" },
    { label: "Neon Museum and Fremont tours", query: "neon museum fremont tour" },
    { label: "Downtown Las Vegas attractions", query: "downtown las vegas attractions" },
  ],
  sections: [
    { title: "Fremont versus the Strip", body: "Downtown is not just a cheaper Strip. It solves a different trip shape: shorter blocks, old-Vegas identity, casino density, and easier late-night movement." },
    { title: "Casinos, canopy, and nightlife", body: "The district matters because casinos, Fremont Street Experience, bar energy, and nearby attractions sit inside one tighter geography that visitors naturally search as one area." },
    { title: "Hotels and stay patterns", body: "Downtown hotel buyers behave differently from Strip hotel buyers. They usually prioritize price, old-Vegas feel, or Fremont access over flagship-resort prestige." },
    { title: "Why this hub matters in the graph", body: "Fremont gives Vegas a second true district hub. That makes near-X, bars-near, hotels-near, and attraction-near pages much cleaner to scale later." },
  ],
  faq: [
    { q: "Is Fremont Street worth visiting?", a: "Yes. Fremont Street is one of the clearest alternative Vegas modes because it compresses casinos, nightlife, and spectacle into a smaller, denser district." },
    { q: "Is downtown Las Vegas better than the Strip?", a: "It depends on the trip. Downtown is usually better for cheaper, denser, more casual casino and nightlife routing, while the Strip wins on flagship resorts and show density." },
    { q: "Can I stay downtown and still do the Strip?", a: "Yes, but they should be treated as different district modes rather than one continuous walkable zone." },
  ],
  relatedLinks: [
    { href: "/vegas", title: "Back to Las Vegas hub", body: "Return to the main city authority page for Strip, day trips, sports, and broader routing." },
    { href: "/las-vegas/hotels", title: "Las Vegas hotels", body: "Compare downtown hotel nodes against Strip and overlay-based hotel discovery." },
    { href: "/las-vegas-strip", title: "Las Vegas Strip district hub", body: "Cross-link directly because many users compare Fremont and the Strip as rival district choices." },
    { href: "/hotel/golden-nugget", title: "Golden Nugget hotel node", body: "Jump into one of the strongest downtown hotel nodes already seeded in the Vegas hotel mesh." },
    { href: "/hotels-near/fremont-street-experience", title: "Hotels near Fremont Street Experience", body: "Use the relationship page when the trip starts from Fremont itself and the main question becomes where to stay nearby." },
  ],
  lastModified: "2026-03-12",
};

export const ARTS_DISTRICT_PILLAR: AttractionPillarConfig = {
  slug: "las-vegas-arts-district",
  pageUrl: "https://destinationcommandcenter.com/las-vegas-arts-district",
  eyebrow: "DCC District Hub",
  title: "Las Vegas Arts District bars, restaurants, galleries, and local-night planning",
  description:
    "The Arts District is the local-leaning creative district hub inside the Vegas graph. This page covers galleries, breweries, restaurants, vintage shopping, and why the district works differently from both Fremont and the Strip.",
  placeName: "Las Vegas Arts District",
  gridTitle: "Best Arts District booking lanes",
  gridDescription:
    "These routes focus on local-night and neighborhood-led booking behavior: food, bar hopping, brewery stops, and gallery-adjacent exploration.",
  schemaType: "CollectionPage",
  highlights: [
    { title: "Best for local texture", body: "The Arts District matters because it gives Vegas a non-casino district with bars, restaurants, and galleries that feel more local than resort-heavy corridors." },
    { title: "Best for dining and bar routes", body: "This district is more about food, breweries, and neighborhood movement than spectacle attractions." },
    { title: "Best for spiderweb depth", body: "Arts District pages will eventually support bars, restaurants, events, and near-X overlays that the Strip and Fremont do not cover well." },
  ],
  tourFallbacks: [
    { label: "Las Vegas Arts District tours", query: "las vegas arts district tour" },
    { label: "Las Vegas brewery tours", query: "las vegas brewery tour arts district" },
    { label: "Arts District food tours", query: "las vegas arts district food tour" },
    { label: "Downtown Las Vegas art walks", query: "downtown las vegas art walk" },
    { label: "Vintage shopping Las Vegas", query: "las vegas arts district vintage shopping" },
    { label: "Local nightlife Las Vegas", query: "las vegas local nightlife arts district" },
  ],
  sections: [
    { title: "Why the Arts District deserves its own node", body: "This area behaves more like a neighborhood discovery hub than a tourist-attraction page. Users come here for bars, restaurants, galleries, and a more local night shape." },
    { title: "Restaurants, breweries, and gallery movement", body: "The district should connect food, drinks, and gallery browsing in one route layer. That is different from both Fremont nightlife and the Strip’s resort-centered planning." },
    { title: "Who this district is for", body: "It fits return visitors, locals-minded travelers, and people who want one lighter, more local evening rather than a casino-led route." },
    { title: "How it fits the Vegas graph", body: "This hub gives the Vegas mesh a local-neighborhood layer, which is critical if the site is going to scale beyond only flagship-resort content." },
  ],
  faq: [
    { q: "What is the Las Vegas Arts District known for?", a: "It is known for galleries, bars, breweries, restaurants, and a more local-feeling night out than either the Strip or Fremont." },
    { q: "Is the Arts District worth visiting in Las Vegas?", a: "Yes, especially for repeat visitors or travelers who want a non-casino district with food, drinks, and creative energy." },
    { q: "Is the Arts District the same as Fremont?", a: "No. They are close in the broader downtown zone, but Fremont is more casino and spectacle driven while the Arts District is more local and food-and-bar driven." },
  ],
  relatedLinks: [
    { href: "/vegas", title: "Back to Las Vegas hub", body: "Return to the main city authority page for the wider Vegas trip structure." },
    { href: "/fremont-street", title: "Fremont Street district hub", body: "Cross-link because users often compare these two downtown-adjacent district modes." },
    { href: "/las-vegas/hotels", title: "Las Vegas hotels", body: "Use the hotel mesh to compare downtown-adjacent or Strip-based stay decisions against local-night routing." },
  ],
  lastModified: "2026-03-12",
};

export const CHINATOWN_PILLAR: AttractionPillarConfig = {
  slug: "las-vegas-chinatown",
  pageUrl: "https://destinationcommandcenter.com/las-vegas-chinatown",
  eyebrow: "DCC District Hub",
  title: "Las Vegas Chinatown restaurants, nightlife, and late-night food planning",
  description:
    "Las Vegas Chinatown is a food-and-nightlife district hub. This page covers ramen, sushi, Korean barbecue, karaoke, bars, and why Chinatown is one of the strongest non-Strip dining clusters in the city.",
  placeName: "Las Vegas Chinatown",
  gridTitle: "Best Chinatown booking lanes",
  gridDescription:
    "These routes focus on Chinatown’s strongest search and booking intent: restaurants, late-night food, karaoke, and nightlife-adjacent planning.",
  schemaType: "CollectionPage",
  highlights: [
    { title: "Best for food-first Vegas", body: "Chinatown gives Vegas a major dining district outside the resort corridor, which matters for restaurant-led and late-night search intent." },
    { title: "Best for nightlife adjacency", body: "The district supports karaoke, bars, and late-night meals in a way that complements but does not duplicate Strip nightlife." },
    { title: "Best for future restaurant graph depth", body: "This hub is a strong anchor for later restaurant nodes, near-X pages, and cuisine overlays." },
  ],
  tourFallbacks: [
    { label: "Las Vegas Chinatown food tours", query: "las vegas chinatown food tour" },
    { label: "Las Vegas Chinatown restaurants", query: "las vegas chinatown restaurants" },
    { label: "Las Vegas Chinatown karaoke", query: "las vegas chinatown karaoke" },
    { label: "Late night food Las Vegas Chinatown", query: "late night food las vegas chinatown" },
    { label: "Asian restaurants Las Vegas", query: "asian restaurants las vegas chinatown" },
    { label: "Las Vegas local dining tours", query: "las vegas local dining tour" },
  ],
  sections: [
    { title: "Why Chinatown should be a district hub", body: "Chinatown is one of the strongest food-search ecosystems in Vegas and should not be buried as a generic restaurant note on the city page." },
    { title: "Restaurants, bars, and karaoke", body: "The district naturally connects dining, late-night food, bars, and karaoke. Those patterns are commercially and semantically stronger when grouped as one district." },
    { title: "Who searches this district", body: "Locals-minded visitors, repeat Vegas travelers, and food-first buyers often search the district directly or search for cuisine and nightlife that maps to it." },
    { title: "How it fits the mesh", body: "This hub gives the Vegas graph a true off-Strip dining district, which is important if the site is going to scale into restaurants and neighborhood overlays." },
  ],
  faq: [
    { q: "What is Las Vegas Chinatown known for?", a: "It is known for strong Asian dining clusters, late-night food, karaoke, and a more local nightlife feel than the Strip." },
    { q: "Is Las Vegas Chinatown worth visiting?", a: "Yes, especially for food-first travelers and visitors who want an off-Strip district with real restaurant density." },
    { q: "Is Chinatown near the Strip?", a: "It is close enough to function as a practical off-Strip dining move, but it should still be treated as its own district." },
  ],
  relatedLinks: [
    { href: "/vegas", title: "Back to Las Vegas hub", body: "Return to the city authority page for the wider Vegas trip structure." },
    { href: "/las-vegas-strip", title: "Las Vegas Strip district hub", body: "Cross-link because Strip visitors often branch into Chinatown for dining and late-night food." },
    { href: "/las-vegas/hotels", title: "Las Vegas hotels", body: "Use the hotel mesh to compare Strip-based stays against off-Strip dining routes." },
  ],
  lastModified: "2026-03-12",
};

export const SUMMERLIN_PILLAR: AttractionPillarConfig = {
  slug: "summerlin",
  pageUrl: "https://destinationcommandcenter.com/summerlin",
  eyebrow: "DCC District Hub",
  title: "Summerlin shopping, dining, and Red Rock access from Las Vegas",
  description:
    "Summerlin is the west-side district hub that connects shopping, local dining, Red Rock access, and a cleaner suburban alternative to Strip-first trip planning.",
  placeName: "Summerlin",
  gridTitle: "Best Summerlin booking lanes",
  gridDescription:
    "These routes focus on Summerlin’s strongest search intent: shopping, dining, west-side recreation, and Red Rock-adjacent planning.",
  schemaType: "CollectionPage",
  highlights: [
    { title: "Best for west-side routing", body: "Summerlin matters because it links Vegas shopping, suburban dining, and Red Rock access into one cleaner district layer." },
    { title: "Best for Red Rock crossover", body: "This district works especially well for buyers whose Vegas trip includes outdoor time but not only Strip nights." },
    { title: "Best for alternative Vegas", body: "Summerlin helps the graph reach travelers who want a less tourist-saturated mode of Vegas." },
  ],
  tourFallbacks: [
    { label: "Summerlin shopping and dining", query: "summerlin las vegas shopping dining" },
    { label: "Downtown Summerlin tours", query: "downtown summerlin las vegas" },
    { label: "Red Rock Canyon from Summerlin", query: "red rock canyon from summerlin" },
    { label: "Summerlin local experiences", query: "summerlin las vegas local experiences" },
    { label: "West Las Vegas attractions", query: "west las vegas attractions" },
    { label: "Red Rock resort experiences", query: "red rock resort las vegas" },
  ],
  sections: [
    { title: "Why Summerlin is a district, not a side note", body: "Summerlin gives Vegas a west-side suburban district with shopping, dining, and outdoor access that should not be flattened into generic city copy." },
    { title: "Shopping, dining, and local-night movement", body: "This hub is strongest when it connects shopping, local dining, and Red Rock adjacency instead of pretending it is just one attraction." },
    { title: "Summerlin and Red Rock", body: "The district naturally ties into Red Rock Canyon and west-side recreation, which makes it an important bridge between hotel and outdoor layers." },
    { title: "How it fits the spiderweb", body: "Summerlin creates a practical non-Strip district for near-X and lifestyle-oriented overlays later in the graph." },
  ],
  faq: [
    { q: "What is Summerlin known for in Las Vegas?", a: "It is known for shopping, dining, cleaner suburban planning, and easier access to Red Rock Canyon and west-side recreation." },
    { q: "Is Summerlin worth visiting for tourists?", a: "Yes, especially for visitors who want a less casino-heavy district or who are pairing Vegas with Red Rock and west-side outdoor time." },
    { q: "Is Summerlin close to Red Rock Canyon?", a: "Yes. That proximity is one of the main reasons it matters inside the Vegas graph." },
  ],
  relatedLinks: [
    { href: "/vegas", title: "Back to Las Vegas hub", body: "Return to the city authority page for the broader Vegas route plan." },
    { href: "/red-rock-canyon", title: "Red Rock Canyon pillar", body: "Cross-link because Summerlin naturally feeds into Red Rock planning." },
    { href: "/las-vegas/hotels", title: "Las Vegas hotels", body: "Use the hotel mesh to compare Summerlin-adjacent alternatives against Strip and downtown stays." },
  ],
  lastModified: "2026-03-12",
};

export const HENDERSON_PILLAR: AttractionPillarConfig = {
  slug: "henderson-las-vegas",
  pageUrl: "https://destinationcommandcenter.com/henderson-las-vegas",
  eyebrow: "DCC District Hub",
  title: "Henderson resorts, Lake Las Vegas, and outdoor planning near Las Vegas",
  description:
    "Henderson is the southeast district hub that connects Lake Las Vegas, resort stays, golf, and a more resort-recreation version of Vegas away from the Strip.",
  placeName: "Henderson and Lake Las Vegas",
  gridTitle: "Best Henderson and Lake Las Vegas booking lanes",
  gridDescription:
    "These routes focus on Henderson’s strongest booking behavior: lake resorts, golf, outdoor recreation, and Lake Las Vegas planning.",
  schemaType: "CollectionPage",
  highlights: [
    { title: "Best for resort-recreation stays", body: "Henderson matters because it gives Vegas a more relaxed lake-and-resort district outside the casino core." },
    { title: "Best for lake and golf crossover", body: "The district naturally connects Lake Las Vegas, golf, and resort-focused outdoor planning." },
    { title: "Best for suburban destination logic", body: "This hub expands Vegas beyond only Strip and downtown, which makes the city graph much more credible." },
  ],
  tourFallbacks: [
    { label: "Lake Las Vegas tours", query: "lake las vegas tour" },
    { label: "Henderson outdoor activities", query: "henderson las vegas outdoor activities" },
    { label: "Lake Las Vegas resort experiences", query: "lake las vegas resort experience" },
    { label: "Henderson golf and resort planning", query: "henderson las vegas golf resort" },
    { label: "Lake Las Vegas kayaking", query: "lake las vegas kayaking" },
    { label: "Henderson day trips from Las Vegas", query: "henderson las vegas day trip" },
  ],
  sections: [
    { title: "Why Henderson deserves a district node", body: "Henderson and Lake Las Vegas solve a different Vegas trip shape than the Strip: resorts, golf, water, and outdoor recreation over casino density." },
    { title: "Lake Las Vegas as the anchor", body: "Lake Las Vegas is the clearest node here and should eventually connect to resort, recreation, and outdoor overlays instead of living as a stray mention." },
    { title: "Who this district is for", body: "This district is strongest for families, couples, golf buyers, and travelers who want a calmer base while still staying in the broader Vegas ecosystem." },
    { title: "How it fits the city graph", body: "Henderson expands Vegas from a tourist corridor model into a full metro discovery graph, which is crucial for long-term scale." },
  ],
  faq: [
    { q: "Is Henderson part of a Las Vegas trip?", a: "Yes. Henderson works as a quieter district inside the broader Vegas metro experience, especially for resort and outdoor buyers." },
    { q: "What is Lake Las Vegas known for?", a: "It is known for resort stays, golf, lake recreation, and a calmer alternative to Strip-first planning." },
    { q: "Should I stay in Henderson instead of the Strip?", a: "It depends on the trip. Henderson is stronger for resort-recreation and calmer pacing, while the Strip is stronger for shows, nightlife, and flagship attractions." },
  ],
  relatedLinks: [
    { href: "/vegas", title: "Back to Las Vegas hub", body: "Return to the city authority page for the main Vegas route plan." },
    { href: "/lake-mead", title: "Lake Mead pillar", body: "Cross-link because the outdoor and water-recreation logic overlaps strongly." },
    { href: "/las-vegas/hotels", title: "Las Vegas hotels", body: "Use the hotel mesh to compare resort-recreation stays against Strip and downtown choices." },
  ],
  lastModified: "2026-03-12",
};
