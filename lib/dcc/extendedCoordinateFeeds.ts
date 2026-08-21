export type Coordinate = { lat: number; lng: number };

type SourceState<T> = {
  provider: string;
  attribution: string;
  available: boolean;
  checkedAt: string;
  data: T | null;
  error?: string;
};

const UA = "DestinationCommandCenter/2.1 (+https://destinationcommandcenter.com/developers)";

function haversineKm(a: Coordinate, b: Coordinate) {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

async function readJson(url: string, revalidate: number, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": UA },
      next: { revalidate },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function readText(url: string, revalidate: number, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/plain,application/xml,text/xml,*/*", "User-Agent": UA },
      next: { revalidate },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function source<T>(provider: string, attribution: string, reader: () => Promise<T>): Promise<SourceState<T>> {
  const checkedAt = new Date().toISOString();
  try {
    return { provider, attribution, available: true, checkedAt, data: await reader() };
  } catch (error) {
    return {
      provider,
      attribution,
      available: false,
      checkedAt,
      data: null,
      error: error instanceof Error ? error.message : "unavailable",
    };
  }
}

function elementPoint(element: any): Coordinate | null {
  const lat = Number(element?.lat ?? element?.center?.lat);
  const lng = Number(element?.lon ?? element?.center?.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function infrastructureKind(tags: Record<string, string>) {
  if (tags.aeroway === "aerodrome") return "airport";
  if (tags.amenity === "ferry_terminal") return "ferry_terminal";
  if (tags.amenity === "hospital" || tags.amenity === "clinic") return "medical";
  if (tags.amenity === "police") return "police";
  if (tags.amenity === "fire_station") return "fire_station";
  if (tags.amenity === "fuel") return "fuel";
  if (tags.amenity === "charging_station") return "charging_station";
  if (tags.amenity === "bus_station") return "bus_station";
  if (tags.railway === "station" || tags.railway === "halt") return "rail_station";
  if (tags.public_transport === "station" || tags.public_transport === "stop_position") return "transit";
  if (tags.highway === "motorway_junction") return "road_junction";
  return "infrastructure";
}

export async function readNearbyInfrastructure({ lat, lng }: Coordinate) {
  return source("openstreetmap-overpass", "Nearby infrastructure: OpenStreetMap contributors via Overpass API", async () => {
    const query = `[out:json][timeout:12];(nwr(around:5000,${lat},${lng})[\"aeroway\"=\"aerodrome\"];nwr(around:5000,${lat},${lng})[\"amenity\"~\"^(hospital|clinic|police|fire_station|fuel|charging_station|bus_station|ferry_terminal)$\"];nwr(around:5000,${lat},${lng})[\"railway\"~\"^(station|halt)$\"];nwr(around:5000,${lat},${lng})[\"public_transport\"~\"^(station|stop_position)$\"];nwr(around:2500,${lat},${lng})[\"highway\"=\"motorway_junction\"];);out center tags 100;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const payload: any = await readJson(url, 1800, 12000);
    const items = (payload?.elements || [])
      .map((element: any) => {
        const point = elementPoint(element);
        if (!point) return null;
        const tags = element?.tags || {};
        return {
          id: `${element.type}/${element.id}`,
          kind: infrastructureKind(tags),
          name: tags.name || tags.ref || tags.icao || tags.iata || tags.operator || infrastructureKind(tags),
          lat: point.lat,
          lng: point.lng,
          distanceKm: Math.round(haversineKm({ lat, lng }, point) * 10) / 10,
          operator: tags.operator || null,
          network: tags.network || null,
          ref: tags.ref || null,
          icao: tags.icao || null,
          iata: tags.iata || null,
          emergency: tags.emergency || null,
          website: tags.website || tags["contact:website"] || null,
          osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

    const deduped: any[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.kind}:${String(item.name).toLowerCase()}:${item.lat.toFixed(4)}:${item.lng.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= 50) break;
    }
    return deduped;
  });
}

export async function readAviationWeather(coordinate: Coordinate, infrastructure: any[]) {
  return source("aviationweather-gov", "Aviation observations and forecasts: NOAA/NWS Aviation Weather Center", async () => {
    const airports = infrastructure
      .filter((item) => item?.kind === "airport" && item?.icao && item.distanceKm <= 120)
      .slice(0, 4);
    if (!airports.length) throw new Error("no nearby ICAO-tagged aerodromes");
    const ids = airports.map((item) => item.icao).join(",");
    const [metars, tafs] = await Promise.all([
      readJson(`https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(ids)}&format=json`, 120).catch(() => []),
      readJson(`https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(ids)}&format=json`, 600).catch(() => []),
    ]);
    const metarList = Array.isArray(metars) ? metars : [];
    const tafList = Array.isArray(tafs) ? tafs : [];
    return airports.map((airport) => {
      const metar = metarList.find((row: any) => row?.icaoId === airport.icao || row?.stationId === airport.icao) || null;
      const taf = tafList.find((row: any) => row?.icaoId === airport.icao || row?.stationId === airport.icao) || null;
      return { airport, metar, taf };
    });
  });
}

function stationDistance(origin: Coordinate, station: any) {
  const lat = Number(station?.lat ?? station?.latitude);
  const lng = Number(station?.lng ?? station?.lon ?? station?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Infinity;
  return haversineKm(origin, { lat, lng });
}

export async function readCoops(coordinate: Coordinate) {
  return source("noaa-coops", "Tides, water levels and coastal stations: NOAA CO-OPS", async () => {
    const payload: any = await readJson("https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=waterlevels", 21600, 12000);
    const stations = (payload?.stations || [])
      .map((station: any) => ({ ...station, distanceKm: stationDistance(coordinate, station) }))
      .filter((station: any) => Number.isFinite(station.distanceKm) && station.distanceKm <= 125)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
    if (!stations.length) throw new Error("no NOAA CO-OPS water-level stations within 125 km");

    return Promise.all(stations.map(async (station: any) => {
      const common = `station=${encodeURIComponent(station.id)}&time_zone=gmt&units=metric&format=json&application=DestinationCommandCenter`;
      const observationUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&product=water_level&datum=MLLW&${common}`;
      const predictionUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&product=predictions&datum=MLLW&interval=hilo&${common}`;
      const [observation, prediction] = await Promise.all([
        readJson(observationUrl, 360).catch(() => null),
        station.tidal ? readJson(predictionUrl, 1800).catch(() => null) : Promise.resolve(null),
      ]);
      return {
        id: station.id,
        name: station.name,
        lat: Number(station.lat),
        lng: Number(station.lng),
        distanceKm: Math.round(station.distanceKm),
        tidal: Boolean(station.tidal),
        portscode: station.portscode || null,
        observation: observation?.data?.[0] || null,
        predictions: (prediction?.predictions || []).slice(0, 6),
        pageUrl: `https://tidesandcurrents.noaa.gov/stationhome.html?id=${station.id}`,
      };
    }));
  });
}

function parseXmlAttributes(fragment: string) {
  const attrs: Record<string, string> = {};
  for (const match of fragment.matchAll(/([A-Za-z0-9_:-]+)="([^"]*)"/g)) attrs[match[1]] = match[2];
  return attrs;
}

function parseNdbcObservation(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 3) return null;
  const headers = lines[0].replace(/^#/, "").trim().split(/\s+/);
  const values = lines[2].trim().split(/\s+/);
  const row: Record<string, string | number | null> = {};
  headers.forEach((header, index) => {
    const raw = values[index];
    if (raw == null || raw === "MM") row[header] = null;
    else if (/^-?\d+(?:\.\d+)?$/.test(raw)) row[header] = Number(raw);
    else row[header] = raw;
  });
  return row;
}

export async function readNdbc(coordinate: Coordinate) {
  return source("noaa-ndbc", "Buoy and coastal observations: NOAA National Data Buoy Center", async () => {
    const xml = await readText("https://www.ndbc.noaa.gov/activestations.xml", 21600, 12000);
    const stations = [...xml.matchAll(/<station\s+([^>]+?)\s*\/>/g)]
      .map((match) => parseXmlAttributes(match[1]))
      .map((station) => ({ ...station, distanceKm: stationDistance(coordinate, station) }))
      .filter((station: any) => Number.isFinite(station.distanceKm) && station.distanceKm <= 250)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
    if (!stations.length) throw new Error("no active NDBC stations within 250 km");

    return Promise.all(stations.map(async (station: any) => {
      const latest = await readText(`https://www.ndbc.noaa.gov/data/realtime2/${encodeURIComponent(station.id)}.txt`, 300).catch(() => "");
      return {
        id: station.id,
        name: station.name || station.id,
        owner: station.owner || null,
        lat: Number(station.lat),
        lng: Number(station.lon),
        distanceKm: Math.round(station.distanceKm),
        capabilities: {
          meteorology: station.met === "y",
          currents: station.currents === "y",
          waterQuality: station.waterquality === "y",
          tsunami: station.dart === "y",
        },
        latest: latest ? parseNdbcObservation(latest) : null,
        pageUrl: `https://www.ndbc.noaa.gov/station_page.php?station=${encodeURIComponent(station.id)}`,
      };
    }));
  });
}

export async function readExtendedCoordinateFeeds(coordinate: Coordinate) {
  const infrastructure = await readNearbyInfrastructure(coordinate);
  const [aviation, coops, ndbc] = await Promise.all([
    readAviationWeather(coordinate, infrastructure.data || []),
    readCoops(coordinate),
    readNdbc(coordinate),
  ]);
  return {
    nearby: infrastructure.data || [],
    aviation: aviation.data || [],
    coastal: {
      coops: coops.data || [],
      ndbc: ndbc.data || [],
    },
    sources: [infrastructure, aviation, coops, ndbc].map((entry) => ({
      provider: entry.provider,
      attribution: entry.attribution,
      available: entry.available,
      checkedAt: entry.checkedAt,
      error: entry.available ? undefined : entry.error,
    })),
  };
}
