import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PortSchema } from '../schemas/port.schema.js';
import { getDistanceKm } from '../utils/haversine.js';

const csvPath = path.join(__dirname, '../ingest/raw/ports-mvp.csv');
const csvData = fs.readFileSync(csvPath, 'utf-8');

const records = parse(csvData, { columns: true, skip_empty_lines: true });

const ports: any[] = [];

records.forEach((row: any, index: number) => {
  try {
    const parsed = PortSchema.parse({
      slug: row.slug,
      name: row.name,
      city: row.city,
      region: row.region,
      country: row.country,
      iso_country: row.iso_country,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      dock_notes: row.dock_notes || '',
      seasonal_notes: row.seasonal_notes || '',
      passenger_volume: row.passenger_volume ? parseInt(row.passenger_volume, 10) : undefined,
      volume_year: row.volume_year ? parseInt(row.volume_year, 10) : undefined,
      primary_type: row.primary_type || undefined,
      itinerary_role: row.itinerary_role || undefined,
      tags: row.tags ? row.tags.split('|') : [],
      sources: row.sources ? row.sources.split('|') : ['Unknown'],
    });
    ports.push(parsed);
  } catch (e) {
    console.error(`❌ Invalid port at row ${index + 2} (${row.slug || 'unknown'}):`, e);
    throw e; // FAIL BUILD on bad data
  }
});

// Compute neighbors inline (threshold 200 km for MVP)
const NEIGHBOR_THRESHOLD_KM = 200;
ports.forEach(port => {
  port.neighbors = ports
    .filter(p => p.slug !== port.slug)
    .filter(p => getDistanceKm(port.lat, port.lng, p.lat, p.lng) <= NEIGHBOR_THRESHOLD_KM)
    .map(p => p.slug)
    .sort();
});

const outputPath = path.join(__dirname, '../outputs/ports.generated.json');
fs.writeFileSync(outputPath, JSON.stringify(ports, null, 2));

console.log(`✅ Generated ${ports.length} valid ports with neighbors → ${outputPath}`);
