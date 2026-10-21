import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 120; // 2 minutes

export interface WeatherCamFeed {
  siteId: number;
  siteName: string;
  icao: string | null;
  corridor: string;
  cameraId: number;
  direction: string;
  bearing: number;
  imageUrl: string;
  capturedAt: string;
  dispatchUtility: string;
  vfrThresholdNotes: string;
}

const JUNEAU_MONITORED_SITES = [
  {
    siteId: 8,
    siteName: "Pedersen Hill (Airport & Valley Pass)",
    icao: "PAJN",
    corridor: "Mendenhall Glacier Flight Corridor",
    dispatchUtility:
      "Primary visual baseline used by TEMSCO and NorthStar dispatch to check if cloud decks dip below the 1,000-ft alpine baseline required for VFR flight into Mendenhall Glacier.",
    vfrThresholdNotes: "Requires minimum 1,000 ft ceiling AGL and 3 statute miles visibility for FAA Part 135 commercial tour operations.",
    targetCameras: [10017, 10018],
  },
  {
    siteId: 849,
    siteName: "Juneau Tram (Mount Roberts Ridge)",
    icao: null,
    corridor: "Gastineau Channel Departure Corridor",
    dispatchUtility:
      "Monitors heavy morning marine mist and low ceiling decks rolling down Gastineau Channel before helicopters can clear the lower harbor towards icefields.",
    vfrThresholdNotes: "High ridge elevation (1,800 ft). Cloud deck covering this camera indicates alpine pass obstruction.",
    targetCameras: [13101],
  },
  {
    siteId: 848,
    siteName: "Spuhn Island (Auke Bay Approaches)",
    icao: null,
    corridor: "Lynn Canal & Outer Flight Corridor",
    dispatchUtility:
      "Tracks western maritime weather systems pushing in from Icy Strait and Lynn Canal toward the Juneau airport basin.",
    vfrThresholdNotes: "Early warning sentinel for incoming storm fronts moving from Chatham Strait into northern tour flightpaths.",
    targetCameras: [13099, 13110],
  },
];

export async function GET() {
  const feeds: WeatherCamFeed[] = [];

  for (const site of JUNEAU_MONITORED_SITES) {
    try {
      const res = await fetch(`https://weathercams.faa.gov/api/summary?siteId=${site.siteId}`, {
        headers: {
          "User-Agent": "JuneauFlightDeck/2.0 (+https://juneauflightdeck.com)",
          Referer: "https://weathercams.faa.gov/",
          Origin: "https://weathercams.faa.gov",
          Accept: "application/json, text/plain, */*",
        },
        next: { revalidate: 120 },
      });

      if (!res.ok) continue;

      const data = await res.json();
      const cameras = data?.payload?.site?.cameras || [];

      for (const cam of cameras) {
        if (!site.targetCameras.includes(cam.cameraId)) continue;
        const currentImg = cam.currentImages && cam.currentImages[0];
        if (!currentImg?.imageUri) continue;

        feeds.push({
          siteId: site.siteId,
          siteName: site.siteName,
          icao: site.icao,
          corridor: site.corridor,
          cameraId: cam.cameraId,
          direction: cam.cameraDirection || "Approach Vector",
          bearing: cam.cameraBearing || 0,
          imageUrl: currentImg.imageUri,
          capturedAt: currentImg.imageDatetime || new Date().toISOString(),
          dispatchUtility: site.dispatchUtility,
          vfrThresholdNotes: site.vfrThresholdNotes,
        });
      }
    } catch (err) {
      console.error(`[FAA Cams] Failed fetching site ${site.siteId}:`, err);
    }
  }

  return NextResponse.json(
    {
      source: "FAA WeatherCams Network (weathercams.faa.gov)",
      jurisdiction: "Federal Aviation Administration (FAA) Alaska Region",
      regulation: "FAA Part 135 VFR Helicopter Operations",
      updatedAt: new Date().toISOString(),
      feeds,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=240",
      },
    }
  );
}
