type SotsLiveDealsResponse = {
  site?: string;
  status?: string;
  refreshedAt?: string;
  featuredDeals?: Array<{
    slug?: string;
    label?: string;
    href?: string;
    note?: string;
  }>;
  shows?: Array<{
    id?: string;
    name?: string;
    venueName?: string | null;
    localDate?: string | null;
  }>;
  tours?: Array<{
    id?: string;
    name?: string;
    areaLabel?: string;
    fromPrice?: string | null;
  }>;
};

type ParrLiveBookingsResponse = {
  site?: string;
  status?: string;
  refreshedAt?: string;
  recentBookingCount?: number;
  activeVenues?: Array<{
    slug?: string;
    label?: string;
    productCount?: number;
    products?: Array<{
      productCode?: string | null;
      name?: string | null;
      fromPrice?: number | null;
    }>;
  }>;
};

type FastPassLiveBookingsResponse = {
  site?: string;
  status?: string;
  refreshedAt?: string;
  recentBookingCount?: number;
  activeVenues?: Array<{
    slug?: string;
    label?: string;
    productCount?: number;
    products?: Array<{
      productCode?: string | null;
      name?: string | null;
      fromPrice?: number | null;
      seatsLeft?: number | null;
    }>;
  }>;
};

export type NetworkLaneCard = {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function buildParrLane(feed: ParrLiveBookingsResponse | null): NetworkLaneCard {
  const redRocks = feed?.activeVenues?.find((venue) => venue.slug === "red-rocks-amphitheatre");
  if (feed?.status === "ok" && redRocks && typeof redRocks.productCount === "number") {
    const firstPrice = redRocks.products?.find((product) => typeof product.fromPrice === "number")?.fromPrice ?? null;
    return {
      href: "https://www.partyatredrocks.com",
      eyebrow: "Colorado shuttles",
      title: "PartyAtRedRocks",
      body:
        redRocks.productCount > 0
          ? `Red Rocks is active with ${redRocks.productCount} live products${firstPrice ? ` starting around $${firstPrice}` : ""}.`
          : "Red Rocks transportation is live and routing through the Colorado execution site.",
      cta: "Open booking site",
    };
  }

  return {
    href: "https://www.partyatredrocks.com",
    eyebrow: "Colorado shuttles",
    title: "PartyAtRedRocks",
    body: "Direct Red Rocks and Denver venue shuttle booking with guaranteed return service.",
    cta: "Open booking site",
  };
}

function buildSotsLane(feed: SotsLiveDealsResponse | null): NetworkLaneCard {
  if (feed?.status === "ok") {
    const showCount = feed.shows?.length ?? 0;
    const tourCount = feed.tours?.length ?? 0;
    return {
      href: "https://saveonthestrip.com",
      eyebrow: "Vegas planning",
      title: "Save On The Strip",
      body:
        showCount || tourCount
          ? `Vegas lane is live with ${showCount} featured shows and ${tourCount} featured tours in the current feed.`
          : "Shows, tours, hotel changes, free things, and direct deal-routing for Las Vegas.",
      cta: "Open Vegas site",
    };
  }

  return {
    href: "https://saveonthestrip.com",
    eyebrow: "Vegas planning",
    title: "Save On The Strip",
    body: "Shows, tours, hotel changes, free things, and direct deal-routing for Las Vegas.",
    cta: "Open Vegas site",
  };
}

function buildWtaLane(): NetworkLaneCard {
  return {
    href: "https://welcometoalaskatours.com",
    eyebrow: "Juneau tours",
    title: "Welcome To Alaska Tours",
    body: "Live cruise-port helicopter, glacier, and excursion products for Juneau travelers.",
    cta: "Open Juneau tours",
  };
}

function buildFastPassLane(feed: FastPassLiveBookingsResponse | null): NetworkLaneCard {
  const venue = feed?.activeVenues?.find((entry) => entry.slug === "red-rocks-amphitheatre");
  if (feed?.status === "ok" && venue) {
    const firstProduct = venue.products?.find((product) => typeof product.fromPrice === "number");
    return {
      href: "https://redrocksfastpass.com",
      eyebrow: "Express Red Rocks",
      title: "Red Rocks Fast Pass",
      body:
        typeof venue.productCount === "number" && venue.productCount > 0
          ? `${venue.productCount} fast-pass loops are live${firstProduct?.fromPrice ? ` from $${firstProduct.fromPrice}` : ""}.`
          : "Short-loop Red Rocks inventory is live for quick mobile booking.",
      cta: "Open fast-pass site",
    };
  }

  return {
    href: "https://redrocksfastpass.com",
    eyebrow: "Express Red Rocks",
    title: "Red Rocks Fast Pass",
    body: "Short-loop Red Rocks inventory for fast mobile booking and overflow capture.",
    cta: "Open fast-pass site",
  };
}

export async function getNetworkLanes() {
  const [sots, parr, fastPass] = await Promise.all([
    fetchJson<SotsLiveDealsResponse>("https://saveonthestrip.com/api/live-deals"),
    fetchJson<ParrLiveBookingsResponse>("https://www.partyatredrocks.com/api/live-bookings"),
    fetchJson<FastPassLiveBookingsResponse>("https://redrocksfastpass.com/api/live-bookings"),
  ]);

  return {
    sots,
    parr,
    fastPass,
    refreshedAt: new Date().toISOString(),
    lanes: [buildParrLane(parr), buildFastPassLane(fastPass), buildSotsLane(sots), buildWtaLane()],
  };
}
