import { recordUpstreamFetchCall, type TelemetryReadOptions } from "@/lib/dcc/locationIntelligence";

export type Coordinate = { lat: number; lng: number };

function resolveRevalidate(defaultSeconds: number, options?: TelemetryReadOptions): number {
  return Math.max(defaultSeconds, options?.minRevalidateSeconds ?? 0);
}

type SourceState<T> = {
  provider: string;
  attribution: string;
  available: boolean;
  checkedAt: string;
  data: T | null;
  error?: string;
};

const UA = "DestinationCommandCenter/2.1 (+https://destinationcommandcenter.com/developers)";
const NDBC_RELEVANCE_KM = 100;

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
    if (!response.ok) {
      recordUpstreamFetchCall(url, true);
      throw new Error(`${response.status} ${response.statusText}`);
    }
    recordUpstreamFetchCall(url, false);
    return await response.json();
  } catch (err) {
    if (!(err instanceof Error && /^\d{3}\s/.test(err.message))) {
      recordUpstreamFetchCall(url, true);
    }
    throw err;
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
    if (!response.ok) {
      recordUpstreamFetchCall(url, true);
      throw new Error(`${response.status} ${response.statusText}`);
    }
    recordUpstreamFetchCall(url, false);
    return await response.text();
  } catch (err) {
    if (!(err instanceof Error && /^\d{3}\s/.test(err.message))) {
      recordUpstreamFetchCall(url, true);
    }
    throw err;
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

export async function readNearbyInfrastructure({ lat, lng }: Coordinate, options?: TelemetryReadOptions) {
  return source("openstreetmap-overpass", "Nearby infrastructure: OpenStreetMap contributors via Overpass API", async () => {
    const query = `[out:json][timeout:12];(nwr(around:5000,${lat},${lng})[\"aeroway\"=\"aerodrome\"];nwr(around:5000,${lat},${lng})[\"amenity\"~\"^(hospital|clinic|police|fire_station|fuel|charging_station|bus_station|ferry_terminal)$\"];nwr(around:5000,${lat},${lng})[\"railway\"~\"^(station|halt)$\"];nwr(around:5000,${lat},${lng})[\"public_transport\"~\"^(station|stop_position)$\"];nwr(around:2500,${lat},${lng})[\"highway\"=\"motorway_junction\"];);out center tags 100;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const payload: any = await readJson(url, resolveRevalidate(1800, options), 12000);
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

export async function readAviationWeather(
  coordinate: Coordinate,
  infrastructure: any[] = [],
  options?: TelemetryReadOptions,
) {
  return source("aviationweather-gov", "Aviation observations and forecasts: NOAA/NWS Aviation Weather Center", async () => {
    const osmAirports = infrastructure
      .filter((item) => item?.kind === "airport" && item?.icao && item.distanceKm <= 120)
      .slice(0, 4);

    if (osmAirports.length > 0) {
      const ids = osmAirports.map((item) => item.icao).join(",");
      const [metars, tafs] = await Promise.all([
        readJson(`https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(ids)}&format=json`, resolveRevalidate(120, options)).catch(() => []),
        readJson(`https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(ids)}&format=json`, resolveRevalidate(600, options)).catch(() => []),
      ]);
      const metarList = Array.isArray(metars) ? metars : [];
      const tafList = Array.isArray(tafs) ? tafs : [];
      return osmAirports.map((airport) => {
        const metar = metarList.find((row: any) => row?.icaoId === airport.icao || row?.stationId === airport.icao) || null;
        const taf = tafList.find((row: any) => row?.icaoId === airport.icao || row?.stationId === airport.icao) || null;
        return { airport, metar, taf };
      });
    }

    // Fallback: query NOAA/NWS Aviation Weather Center directly by bounding box (~75km radius)
    // so airports outside the 5km Overpass radius (e.g., PAJN 13km from Downtown Juneau) still resolve.
    const latDelta = 0.65;
    const lngDelta = Math.min(2.0, 0.65 / Math.max(0.25, Math.cos((coordinate.lat * Math.PI) / 180)));
    const bbox = [
      (coordinate.lat - latDelta).toFixed(4),
      (coordinate.lng - lngDelta).toFixed(4),
      (coordinate.lat + latDelta).toFixed(4),
      (coordinate.lng + lngDelta).toFixed(4),
    ].join(",");
    const bboxMetars = await readJson(
      `https://aviationweather.gov/api/data/metar?bbox=${encodeURIComponent(bbox)}&format=json`,
      resolveRevalidate(120, options),
    ).catch(() => []);
    const metarList = (Array.isArray(bboxMetars) ? bboxMetars : [])
      .map((row: any) => {
        const lat = Number(row?.lat);
        const lng = Number(row?.lon);
        const distanceKm =
          Number.isFinite(lat) && Number.isFinite(lng)
            ? Math.round(haversineKm(coordinate, { lat, lng }) * 10) / 10
            : Infinity;
        return { row, lat, lng, distanceKm };
      })
      .filter((entry) => entry.row?.icaoId && entry.distanceKm <= 120)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 4);

    if (!metarList.length) throw new Error("no nearby ICAO-tagged aerodromes within 120 km");

    const ids = metarList.map((entry) => entry.row.icaoId).join(",");
    const tafs = await readJson(
      `https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(ids)}&format=json`,
      resolveRevalidate(600, options),
    ).catch(() => []);
    const tafList = Array.isArray(tafs) ? tafs : [];

    return metarList.map(({ row, lat, lng, distanceKm }) => {
      const icao = row.icaoId;
      const taf = tafList.find((t: any) => t?.icaoId === icao || t?.stationId === icao) || null;
      return {
        airport: {
          id: `icao/${icao}`,
          kind: "airport",
          name: row.name || icao,
          lat,
          lng,
          distanceKm,
          icao,
          iata: null,
        },
        metar: row,
        taf,
      };
    });
  });
}

function stationDistance(origin: Coordinate, station: any) {
  const lat = Number(station?.lat ?? station?.latitude);
  const lng = Number(station?.lng ?? station?.lon ?? station?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Infinity;
  return haversineKm(origin, { lat, lng });
}

function normalizeCoopsTargetDate(rawDate?: string): {
  yyyymmdd: string;
  isoDate: string;
} | null {
  if (!rawDate || typeof rawDate !== "string") return null;
  const trimmed = rawDate.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    return {
      yyyymmdd: `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`,
      isoDate: trimmed,
    };
  }
  const compactMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
  if (compactMatch) {
    return {
      yyyymmdd: trimmed,
      isoDate: `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`,
    };
  }
  return null;
}

const KNOWN_COOPS_FALLBACK_STATIONS = [
  {
    id: "9452210",
    name: "Juneau",
    state: "AK",
    lat: 58.2983,
    lng: -134.4117,
    tidal: true,
    portscode: "JNU",
  },
];

export async function readCoops(coordinate: Coordinate, options?: TelemetryReadOptions) {
  return source("noaa-coops", "Tides, water levels and coastal stations: NOAA CO-OPS", async () => {
    if (options?.simulateNoaaTimeout) {
      throw new Error("NOAA CO-OPS request timed out (simulated timeout)");
    }

    const timeoutMs = options?.timeoutMs ?? 12000;
    const targetDateSpec = normalizeCoopsTargetDate(options?.targetDate);
    const predictionTimeZone =
      options?.coopsTimeZone ?? (targetDateSpec ? "lst_ldt" : "gmt");

    const payload: any = await readJson(
      "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=waterlevels",
      resolveRevalidate(21600, options),
      timeoutMs,
    ).catch(() => ({ stations: KNOWN_COOPS_FALLBACK_STATIONS }));

    const rawStations =
      Array.isArray(payload?.stations) && payload.stations.length > 0
        ? payload.stations
        : KNOWN_COOPS_FALLBACK_STATIONS;

    const stations = rawStations
      .map((station: any) => ({ ...station, distanceKm: stationDistance(coordinate, station) }))
      .filter((station: any) => Number.isFinite(station.distanceKm) && station.distanceKm <= 125)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
    if (!stations.length) throw new Error("no NOAA CO-OPS water-level stations within 125 km");

    return Promise.all(
      stations.map(async (station: any) => {
        const obsCommon = `station=${encodeURIComponent(station.id)}&time_zone=gmt&units=metric&format=json&application=DestinationCommandCenter`;
        const predCommon = `station=${encodeURIComponent(station.id)}&time_zone=${predictionTimeZone}&units=metric&format=json&application=DestinationCommandCenter`;
        const observationUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&product=water_level&datum=MLLW&${obsCommon}`;
        const predictionDateQuery = targetDateSpec
          ? `begin_date=${targetDateSpec.yyyymmdd}&end_date=${targetDateSpec.yyyymmdd}`
          : "date=today";
        const predictionUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${predictionDateQuery}&product=predictions&datum=MLLW&interval=hilo&${predCommon}`;

        const [observation, prediction] = await Promise.all([
          readJson(observationUrl, resolveRevalidate(360, options), timeoutMs).catch(() => null),
          station.tidal
            ? readJson(predictionUrl, resolveRevalidate(1800, options), timeoutMs).catch(() => null)
            : Promise.resolve(null),
        ]);

        const rawPreds: Array<{ t: string; v: string; type?: "H" | "L" | string }> = (
          prediction?.predictions || []
        ).slice(0, 6);

        const highLowPredictions = rawPreds.map((row) => {
          const heightM = Number(row.v);
          const heightFt = Number.isFinite(heightM)
            ? Number((heightM * 3.28084).toFixed(2))
            : 0;
          const tideType = row.type === "L" ? ("L" as const) : ("H" as const);
          return {
            time: String(row.t || ""),
            heightM: Number.isFinite(heightM) ? Number(heightM.toFixed(2)) : 0,
            heightFt,
            type: tideType,
            label: tideType === "H" ? ("High" as const) : ("Low" as const),
          };
        });

        return {
          id: String(station.id),
          name: String(station.name),
          datum: "MLLW" as const,
          requestedDate: targetDateSpec ? targetDateSpec.isoDate : "today",
          predictionTimeZone,
          lat: Number(station.lat),
          lng: Number(station.lng),
          distanceKm: Math.round(station.distanceKm),
          tidal: Boolean(station.tidal),
          portscode: station.portscode || null,
          observation: observation?.data?.[0] || null,
          predictions: rawPreds,
          highLowPredictions,
          pageUrl: `https://tidesandcurrents.noaa.gov/stationhome.html?id=${station.id}`,
        };
      }),
    );
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

export async function readNdbc(coordinate: Coordinate, options?: TelemetryReadOptions) {
  return source("noaa-ndbc", "Buoy and coastal observations: NOAA National Data Buoy Center", async () => {
    const xml = await readText("https://www.ndbc.noaa.gov/activestations.xml", resolveRevalidate(21600, options), 12000);
    const stations = [...xml.matchAll(/<station\s+([^>]+?)\s*\/>/g)]
      .map((match) => parseXmlAttributes(match[1]))
      .map((station) => ({ ...station, distanceKm: stationDistance(coordinate, station) }))
      .filter((station: any) => Number.isFinite(station.distanceKm) && station.distanceKm <= NDBC_RELEVANCE_KM)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
    if (!stations.length) throw new Error(`no active NDBC stations within ${NDBC_RELEVANCE_KM} km`);

    return Promise.all(stations.map(async (station: any) => {
      const latest = await readText(`https://www.ndbc.noaa.gov/data/realtime2/${encodeURIComponent(station.id)}.txt`, resolveRevalidate(300, options)).catch(() => "");
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

export async function readExtendedCoordinateFeeds(coordinate: Coordinate, options?: TelemetryReadOptions) {
  const [infrastructure, aviation, coops, ndbc] = await Promise.all([
    readNearbyInfrastructure(coordinate, options),
    readAviationWeather(coordinate, [], options),
    readCoops(coordinate, options),
    readNdbc(coordinate, options),
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
