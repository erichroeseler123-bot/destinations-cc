type LiveMachineItem = {
  id: string;
  title: string;
  description?: string | null;
  kind: "transit" | "traffic" | "weather";
  provider: string;
  updatedAt?: string | null;
  severity?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type LiveMachineFeed = {
  available: boolean;
  configured: boolean;
  provider: string;
  kind: "transit" | "traffic" | "weather";
  mode: "public-feed" | "api-key";
  items: LiveMachineItem[];
  error?: string;
};

const USER_AGENT = "DestinationCommandCenter/1.0 (https://destinationcommandcenter.com)";

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json, application/json, text/xml, */*" },
    });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url: string) {
  const text = await fetchText(url);
  return JSON.parse(text);
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function xmlTag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

async function readNwsAlerts(lat: number, lng: number): Promise<LiveMachineFeed> {
  try {
    const url = new URL("https://api.weather.gov/alerts/active");
    url.searchParams.set("point", `${lat},${lng}`);
    const data = await fetchJson(url.toString());
    const features = Array.isArray(data?.features) ? data.features : [];
    const items = features.slice(0, 15).map((feature: any, index: number) => {
      const p = feature?.properties || {};
      return {
        id: String(feature?.id || p.id || `nws-alert-${index}`),
        title: p.headline || p.event || "National Weather Service alert",
        description: p.description || p.instruction || null,
        kind: "weather" as const,
        provider: "National Weather Service",
        severity: p.severity || p.urgency || null,
        updatedAt: p.sent || p.effective || p.onset || null,
      };
    });
    return { available: true, configured: true, provider: "National Weather Service", kind: "weather", mode: "public-feed", items };
  } catch (error) {
    return { available: false, configured: true, provider: "National Weather Service", kind: "weather", mode: "public-feed", items: [], error: error instanceof Error ? error.message : "feed error" };
  }
}

async function readBostonMbtaAlerts(): Promise<LiveMachineFeed> {
  try {
    const data = await fetchJson("https://api-v3.mbta.com/alerts?page%5Blimit%5D=20&sort=-updated_at");
    const rows = Array.isArray(data?.data) ? data.data : [];
    const now = Date.now();
    const items = rows
      .map((row: any, index: number) => {
        const a = row?.attributes || {};
        const periods = Array.isArray(a.active_period) ? a.active_period : [];
        const active = !periods.length || periods.some((period: any) => {
          const start = period?.start ? new Date(period.start).getTime() : -Infinity;
          const end = period?.end ? new Date(period.end).getTime() : Infinity;
          return now >= start && now <= end;
        });
        if (!active) return null;
        return {
          id: String(row?.id || `mbta-alert-${index}`),
          title: a.header || a.short_header || a.service_effect || "MBTA service alert",
          description: a.description || a.service_effect || null,
          kind: "transit" as const,
          provider: "Massachusetts Bay Transportation Authority",
          severity: a.severity != null ? String(a.severity) : a.effect || null,
          updatedAt: a.updated_at || a.created_at || null,
        };
      })
      .filter((item: LiveMachineItem | null): item is LiveMachineItem => Boolean(item))
      .slice(0, 15);
    return { available: true, configured: true, provider: "Massachusetts Bay Transportation Authority", kind: "transit", mode: "public-feed", items };
  } catch (error) {
    return { available: false, configured: true, provider: "Massachusetts Bay Transportation Authority", kind: "transit", mode: "public-feed", items: [], error: error instanceof Error ? error.message : "feed error" };
  }
}

async function readChicagoAlerts(): Promise<LiveMachineFeed> {
  try {
    const xml = await fetchText("https://www.transitchicago.com/api/1.0/alerts.aspx?activeonly=true");
    const blocks = xml.match(/<Alert>[\s\S]*?<\/Alert>/gi) || [];
    const items = blocks.slice(0, 15).map((block, index) => {
      const headline = xmlTag(block, "Headline") || xmlTag(block, "ShortDescription") || "CTA service alert";
      const description = xmlTag(block, "FullDescription") || xmlTag(block, "ShortDescription") || null;
      const id = xmlTag(block, "AlertId") || xmlTag(block, "AlertID") || `cta-alert-${index}`;
      const severity = xmlTag(block, "SeverityScore") || xmlTag(block, "Impact") || null;
      const updatedAt = xmlTag(block, "LastUpdate") || xmlTag(block, "EventStart") || null;
      return {
        id,
        title: headline,
        description,
        kind: "transit" as const,
        provider: "Chicago Transit Authority",
        severity,
        updatedAt,
      };
    });
    return { available: true, configured: true, provider: "Chicago Transit Authority", kind: "transit", mode: "public-feed", items };
  } catch (error) {
    return { available: false, configured: true, provider: "Chicago Transit Authority", kind: "transit", mode: "public-feed", items: [], error: error instanceof Error ? error.message : "feed error" };
  }
}

function coordinateFromGeometry(geometry: any) {
  const coords = geometry?.coordinates;
  if (!Array.isArray(coords)) return { latitude: null, longitude: null };
  const first = typeof coords[0] === "number" ? coords : Array.isArray(coords[0]) ? coords[0] : null;
  if (!first || first.length < 2) return { latitude: null, longitude: null };
  return { longitude: Number(first[0]) || null, latitude: Number(first[1]) || null };
}

async function readNewYorkWorkZones(lat: number, lng: number): Promise<LiveMachineFeed> {
  try {
    const data = await fetchJson("https://511ny.org/api/wzdx");
    const features = Array.isArray(data?.features) ? data.features : [];
    const items = features
      .map((feature: any, index: number) => {
        const point = coordinateFromGeometry(feature.geometry);
        const p = feature?.properties || {};
        return {
          id: String(p.id || p.core_details?.id || feature.id || `ny-wzdx-${index}`),
          title: p.core_details?.description || p.description || p.event_type || "NY road work zone",
          description: p.core_details?.road_names?.join?.(", ") || p.road_name || p.vehicle_impact || null,
          kind: "traffic" as const,
          provider: "511NY / NYSDOT",
          severity: p.vehicle_impact || p.event_status || null,
          updatedAt: p.update_date || p.last_updated_date || p.core_details?.update_date || null,
          latitude: point.latitude,
          longitude: point.longitude,
        };
      })
      .filter((item: LiveMachineItem) => item.latitude == null || item.longitude == null || (Math.abs(item.latitude - lat) < 1.1 && Math.abs(item.longitude - lng) < 1.1))
      .slice(0, 15);
    return { available: true, configured: true, provider: "511NY / NYSDOT", kind: "traffic", mode: "public-feed", items };
  } catch (error) {
    return { available: false, configured: true, provider: "511NY / NYSDOT", kind: "traffic", mode: "public-feed", items: [], error: error instanceof Error ? error.message : "feed error" };
  }
}

async function readNewYork511Keyed(lat: number, lng: number): Promise<LiveMachineFeed | null> {
  const key = process.env.NY511_API_KEY;
  if (!key) return null;
  try {
    const url = `https://511ny.org/api/v2/get/event?key=${encodeURIComponent(key)}&format=json`;
    const data = await fetchJson(url);
    const items = (Array.isArray(data) ? data : [])
      .map((event: any) => ({
        id: String(event.ID),
        title: event.RoadwayName || event.EventType || "New York traffic event",
        description: event.Description || null,
        kind: "traffic" as const,
        provider: "511NY / NYSDOT",
        severity: event.Severity || null,
        updatedAt: event.LastUpdated ? new Date(Number(event.LastUpdated) * 1000).toISOString() : null,
        latitude: Number(event.Latitude) || null,
        longitude: Number(event.Longitude) || null,
      }))
      .filter((item: LiveMachineItem) => item.latitude == null || item.longitude == null || (Math.abs(item.latitude - lat) < 1.1 && Math.abs(item.longitude - lng) < 1.1))
      .slice(0, 15);
    return { available: true, configured: true, provider: "511NY / NYSDOT", kind: "traffic", mode: "api-key", items };
  } catch (error) {
    return { available: false, configured: true, provider: "511NY / NYSDOT", kind: "traffic", mode: "api-key", items: [], error: error instanceof Error ? error.message : "feed error" };
  }
}

async function readSeattleWsdot(lat: number, lng: number): Promise<LiveMachineFeed | null> {
  const key = process.env.WSDOT_ACCESS_CODE;
  if (!key) return null;
  try {
    const url = `https://wsdot.wa.gov/Traffic/api/HighwayAlerts/HighwayAlertsREST.svc/GetAlertsAsJson?AccessCode=${encodeURIComponent(key)}`;
    const data = await fetchJson(url);
    const items = (Array.isArray(data) ? data : [])
      .map((alert: any) => ({
        id: String(alert.AlertID),
        title: alert.HeadlineDescription || alert.EventCategory || "Washington highway alert",
        description: alert.ExtendedDescription || null,
        kind: "traffic" as const,
        provider: "Washington State Department of Transportation",
        severity: alert.Priority || alert.EventStatus || null,
        updatedAt: alert.LastUpdatedTime || null,
        latitude: Number(alert.StartRoadwayLocation?.Latitude) || null,
        longitude: Number(alert.StartRoadwayLocation?.Longitude) || null,
      }))
      .filter((item: LiveMachineItem) => item.latitude == null || item.longitude == null || (Math.abs(item.latitude - lat) < 1.5 && Math.abs(item.longitude - lng) < 1.5))
      .slice(0, 15);
    return { available: true, configured: true, provider: "Washington State Department of Transportation", kind: "traffic", mode: "api-key", items };
  } catch (error) {
    return { available: false, configured: true, provider: "Washington State Department of Transportation", kind: "traffic", mode: "api-key", items: [], error: error instanceof Error ? error.message : "feed error" };
  }
}

export async function readMachineFeeds(citySlug: string, lat: number, lng: number): Promise<LiveMachineFeed[]> {
  const feeds: Array<Promise<LiveMachineFeed | null>> = [readNwsAlerts(lat, lng)];
  if (citySlug === "boston") feeds.push(readBostonMbtaAlerts());
  if (citySlug === "chicago") feeds.push(readChicagoAlerts());
  if (citySlug === "new-york-city") {
    feeds.push(readNewYorkWorkZones(lat, lng));
    feeds.push(readNewYork511Keyed(lat, lng));
  }
  if (citySlug === "seattle") feeds.push(readSeattleWsdot(lat, lng));
  return (await Promise.all(feeds)).filter((feed): feed is LiveMachineFeed => Boolean(feed));
}
