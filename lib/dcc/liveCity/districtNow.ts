import austinDistricts from "@/data/cities/austin/districts.json";
import chicagoDistricts from "@/data/cities/chicago/districts.json";
import denverDistricts from "@/data/cities/denver/districts.json";
import lasVegasDistricts from "@/data/cities/las-vegas/districts.json";
import miamiDistricts from "@/data/cities/miami/districts.json";
import nashvilleDistricts from "@/data/cities/nashville/districts.json";
import newOrleansDistricts from "@/data/cities/new-orleans/districts.json";
import newYorkDistricts from "@/data/cities/new-york-city/districts.json";
import { DURABLE_DISTRICTS, type DurableDistrict } from "@/lib/dcc/liveCity/durableDistricts";

type District = {
  slug: string;
  name: string;
  center?: { lat?: number; lng?: number };
  radius_m?: number;
  vibe_tags?: string[];
};

type GeoSignal = {
  id: string;
  title: string;
  kind: string;
  provider: string;
  latitude?: number | null;
  longitude?: number | null;
  severity?: string | null;
  updatedAt?: string | null;
};

type EventSignal = {
  id: string;
  name: string;
  venue?: string | null;
  category?: string | null;
  start?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const DISTRICTS: Record<string, District[]> = {
  ...DURABLE_DISTRICTS,
  austin: austinDistricts.districts,
  chicago: chicagoDistricts.districts,
  denver: denverDistricts.districts,
  "las-vegas": lasVegasDistricts.districts,
  miami: miamiDistricts.districts,
  nashville: nashvilleDistricts.districts,
  "new-orleans": newOrleansDistricts.districts,
  "new-york-city": newYorkDistricts.districts,
};

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = 6371000;
  const p1 = (aLat * Math.PI) / 180;
  const p2 = (bLat * Math.PI) / 180;
  const dp = ((bLat - aLat) * Math.PI) / 180;
  const dl = ((bLng - aLng) * Math.PI) / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function classify(kinds: string[], eventCount: number) {
  if (kinds.some((kind) => kind === "traffic")) return { label: "TRAFFIC PRESSURE", tone: "movement" };
  if (kinds.some((kind) => kind === "transit")) return { label: "TRANSIT DISRUPTION", tone: "movement" };
  if (kinds.some((kind) => kind === "water")) return { label: "WATER CONDITIONS", tone: "weather" };
  if (kinds.some((kind) => kind === "earth")) return { label: "RECENT SEISMIC ACTIVITY", tone: "alert" };
  if (eventCount >= 2) return { label: "EVENT ENERGY", tone: "energy" };
  if (eventCount === 1) return { label: "ACTIVE NOW", tone: "energy" };
  return { label: "QUIET RIGHT NOW", tone: "quiet" };
}

export function deriveDistrictNow(citySlug: string, machineSignals: GeoSignal[], events: EventSignal[]) {
  const districts = DISTRICTS[citySlug] || [];
  const mapped = districts.map((district) => {
    const lat = district.center?.lat;
    const lng = district.center?.lng;
    const base = {
      slug: district.slug,
      name: district.name,
      center: typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null,
      radius_m: Number(district.radius_m) || 1400,
      vibe_tags: district.vibe_tags || [],
    };

    if (typeof lat !== "number" || typeof lng !== "number") {
      return { ...base, label: "NO LIVE GEO SIGNAL", tone: "quiet", signalCount: 0, eventCount: 0, signals: [], events: [], ephemeral: true };
    }

    const radius = Math.max(800, Math.min(6500, Number(district.radius_m) || 1400));
    const signals = machineSignals.filter((signal) =>
      typeof signal.latitude === "number" && typeof signal.longitude === "number" && distanceMeters(lat, lng, signal.latitude, signal.longitude) <= radius
    );
    const districtEvents = events.filter((event) =>
      typeof event.latitude === "number" && typeof event.longitude === "number" && distanceMeters(lat, lng, event.latitude, event.longitude) <= Math.max(radius, 1800)
    );
    const state = classify(signals.map((signal) => signal.kind), districtEvents.length);

    return {
      ...base,
      label: state.label,
      tone: state.tone,
      signalCount: signals.length,
      eventCount: districtEvents.length,
      signals: signals.slice(0, 4).map((signal) => ({ id: signal.id, title: signal.title, kind: signal.kind, provider: signal.provider, severity: signal.severity || null, updatedAt: signal.updatedAt || null })),
      events: districtEvents.slice(0, 4).map((event) => ({ id: event.id, name: event.name, venue: event.venue || null, category: event.category || null, start: event.start || null })),
      ephemeral: true,
    };
  });

  return mapped.sort((a, b) => (b.signalCount + b.eventCount) - (a.signalCount + a.eventCount));
}
