type WeatherState = {
  available?: boolean;
  current?: {
    description?: string | null;
    windMph?: number | null;
    precipitationIn?: number | null;
    isDay?: boolean | null;
  };
};

type TicketmasterState = {
  available?: boolean;
  events?: Array<{
    name?: string;
    start?: string | null;
    status?: string | null;
    category?: string | null;
  }>;
};

type MachineFeed = {
  available?: boolean;
  kind?: string;
  provider?: string;
  items?: Array<{
    title?: string;
    severity?: string | null;
    updatedAt?: string | null;
  }>;
};

export type CityNowState = {
  label: string;
  summary: string;
  signals: Array<{
    kind: string;
    label: string;
    source: string;
  }>;
  derivedAt: string;
  ephemeral: true;
};

function activeEvents(ticketmaster: TicketmasterState) {
  return (ticketmaster.events || []).filter((event) => event.status !== "cancelled");
}

function hasKind(feeds: MachineFeed[], kind: string) {
  return feeds.some((feed) => feed.available && feed.kind === kind && (feed.items?.length || 0) > 0);
}

function itemsFor(feeds: MachineFeed[], kind: string) {
  return feeds.flatMap((feed) => (feed.available && feed.kind === kind ? feed.items || [] : []));
}

export function deriveCityNow({
  cityName,
  weather,
  ticketmaster,
  machineFeeds,
  now = new Date(),
}: {
  cityName: string;
  weather: WeatherState;
  ticketmaster: TicketmasterState;
  machineFeeds: MachineFeed[];
  now?: Date;
}): CityNowState {
  const signals: CityNowState["signals"] = [];
  const events = activeEvents(ticketmaster);
  const sports = events.filter((event) => event.category === "Sports");
  const music = events.filter((event) => event.category === "Music");
  const weatherDescription = weather.current?.description || "";
  const wind = weather.current?.windMph || 0;
  const precipitation = weather.current?.precipitationIn || 0;

  if (hasKind(machineFeeds, "weather")) {
    const first = itemsFor(machineFeeds, "weather")[0];
    signals.push({ kind: "weather", label: first?.title || "Active weather alert", source: "National Weather Service" });
  }
  if (hasKind(machineFeeds, "water")) {
    const first = itemsFor(machineFeeds, "water")[0];
    signals.push({ kind: "water", label: first?.title || "Elevated water conditions", source: "NOAA" });
  }
  if (hasKind(machineFeeds, "earth")) {
    const first = itemsFor(machineFeeds, "earth")[0];
    signals.push({ kind: "earth", label: first?.title || "Recent seismic activity", source: "USGS" });
  }
  if (hasKind(machineFeeds, "traffic")) {
    const count = itemsFor(machineFeeds, "traffic").length;
    signals.push({ kind: "traffic", label: `${count} current road signal${count === 1 ? "" : "s"}`, source: "official traffic feeds" });
  }
  if (hasKind(machineFeeds, "transit")) {
    const count = itemsFor(machineFeeds, "transit").length;
    signals.push({ kind: "transit", label: `${count} current transit alert${count === 1 ? "" : "s"}`, source: "official transit feeds" });
  }
  if (sports.length) signals.push({ kind: "sports", label: `${sports.length} sports event${sports.length === 1 ? "" : "s"} in the next 48 hours`, source: "Ticketmaster" });
  if (music.length) signals.push({ kind: "music", label: `${music.length} music event${music.length === 1 ? "" : "s"} in the next 48 hours`, source: "Ticketmaster" });

  let label = "NORMAL CITY RHYTHM";
  let summary = `${cityName} has no dominant live disruption signal right now.`;

  if (hasKind(machineFeeds, "weather") || /thunder|storm|snow|rain/i.test(weatherDescription) || precipitation > 0) {
    label = "WEATHER IS SHAPING THE CITY";
    summary = `Weather is the strongest live factor affecting ${cityName} right now.`;
  } else if (hasKind(machineFeeds, "water")) {
    label = "WATER CONDITIONS NEED ATTENTION";
    summary = `Nearby river or coastal conditions are the strongest unusual live signal around ${cityName}.`;
  } else if (hasKind(machineFeeds, "traffic") && hasKind(machineFeeds, "transit")) {
    label = "MOVEMENT IS DISRUPTED";
    summary = `Road and transit feeds both show current disruptions around ${cityName}.`;
  } else if (hasKind(machineFeeds, "transit")) {
    label = "TRANSIT IS UNDER PRESSURE";
    summary = `Current transit alerts are the strongest movement signal in ${cityName}.`;
  } else if (sports.length >= 2) {
    label = "GAME-DAY ENERGY";
    summary = `${cityName} has multiple sports events in the near-term event window.`;
  } else if (music.length >= 3 || events.length >= 8) {
    label = weather.current?.isDay === false ? "NIGHT-OUT ENERGY" : "EVENT-HEAVY CITY";
    summary = `${cityName} has a dense near-term event calendar right now.`;
  } else if (wind >= 25) {
    label = "WINDY CITY CONDITIONS";
    summary = `Strong winds are a notable live condition in ${cityName}.`;
  } else if (hasKind(machineFeeds, "earth")) {
    label = "RECENT SEISMIC ACTIVITY";
    summary = `USGS reports recent nearby earthquake activity around ${cityName}.`;
  }

  return {
    label,
    summary,
    signals: signals.slice(0, 6),
    derivedAt: now.toISOString(),
    ephemeral: true,
  };
}
