import fs from "fs";

const IN = "data/nodes/locations.jsonl";
const OUT = "data/nodes/locations.jsonl"; // in-place overwrite
const lines = fs.readFileSync(IN, "utf8").split("\n").filter(Boolean);

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

const now = new Date().toISOString();

const updated = [];
for (let i = 0; i < lines.length; i++) {
  const node = JSON.parse(lines[i]);
  const lat = node.geo?.lat;
  const lon = node.geo?.lon;

  if (typeof lat !== "number" || typeof lon !== "number") {
    updated.push(node);
    continue;
  }

  // lightweight current + daily high/low sample
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,precipitation,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=auto`;

  try {
    const wx = await fetchJSON(url);

    const current = wx.current || null;
    const daily = wx.daily || null;

    node.weather = {
      ...(node.weather || {}),
      forecast_provider: "open-meteo",
      current: current
        ? {
            temperature_2m: current.temperature_2m,
            precipitation: current.precipitation,
            wind_speed_10m: current.wind_speed_10m,
            time: current.time,
          }
        : null,
      daily: daily
        ? {
            time: daily.time?.slice(0, 3) || [],
            temperature_2m_max: daily.temperature_2m_max?.slice(0, 3) || [],
            temperature_2m_min: daily.temperature_2m_min?.slice(0, 3) || [],
            precipitation_sum: daily.precipitation_sum?.slice(0, 3) || [],
          }
        : null,
      updated_at: now,
    };

    node.updated_at = now;
  } catch (e) {
    // don't fail the whole run
    node.weather = {
      ...(node.weather || {}),
      forecast_provider: "open-meteo",
      error: String(e.message || e),
      updated_at: now,
    };
  }

  updated.push(node);

  // Be nice to the API
  await new Promise(r => setTimeout(r, 80));
}

fs.writeFileSync(OUT, updated.map(x => JSON.stringify(x)).join("\n") + "\n", "utf8");
console.log(`Weather enrichment complete: ${updated.length} nodes updated.`);
