import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const destinationsDir = path.join(repoRoot, "data", "destinations");
const cityAliasesPath = path.join(repoRoot, "data", "city-aliases.json");
const attractionsPath = path.join(repoRoot, "data", "attractions.json");
const portMappingsPath = path.join(repoRoot, "data", "port-tour-destinations.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function listDestinationFiles() {
  return fs
    .readdirSync(destinationsDir)
    .filter((name) => name.endsWith(".json") && name !== "index.json")
    .sort();
}

function buildDerivativesFromDestinations() {
  const cityAliases = {};
  const attractions = {};
  const portMappings = {};

  for (const fileName of listDestinationFiles()) {
    const destination = readJson(path.join(destinationsDir, fileName));
    const slug = destination.slug;

    if (!slug) {
      throw new Error(`Destination file ${fileName} is missing slug`);
    }

    if (Array.isArray(destination.aliases) && destination.aliases.length > 0) {
      const preferredAlias =
        destination.aliases.find((alias) => alias === `${slug}-guide`) ??
        destination.aliases[0];
      cityAliases[slug] = preferredAlias;
    }

    attractions[slug] = Array.isArray(destination.starter_intents)
      ? destination.starter_intents
      : [];

    if (Array.isArray(destination.gateway_mappings)) {
      for (const mapping of destination.gateway_mappings) {
        if (mapping?.kind !== "port_tours_handoff" || !mapping?.source_slug) continue;
        portMappings[mapping.source_slug] = slug;
      }
    }
  }

  const sortedCityAliases = Object.fromEntries(
    Object.entries(cityAliases).sort(([a], [b]) => a.localeCompare(b))
  );
  const sortedAttractions = Object.fromEntries(
    Object.entries(attractions).sort(([a], [b]) => a.localeCompare(b))
  );
  const sortedPortMappings = Object.fromEntries(
    Object.entries(portMappings).sort(([a], [b]) => a.localeCompare(b))
  );

  return {
    cityAliases: sortedCityAliases,
    attractions: sortedAttractions,
    portMappings: sortedPortMappings,
  };
}

function camelCase(slug) {
  return slug.replace(/-([a-z0-9])/g, (g) => g[1].toUpperCase());
}

function main() {
  const derivatives = buildDerivativesFromDestinations();

  writeJson(cityAliasesPath, derivatives.cityAliases);
  writeJson(attractionsPath, derivatives.attractions);
  writeJson(portMappingsPath, derivatives.portMappings);

  const destinationFiles = listDestinationFiles();

  // 1. Sync data/destinations/index.json with all 113 destinations
  const registryDestinations = [];
  const countryMap = {
    "athens": "GR",
    "rome": "IT",
    "nassau": "BS",
    "amsterdam": "NL",
    "barcelona": "ES",
    "copenhagen": "DK",
    "dubai": "AE",
    "dubrovnik": "HR",
    "ephesus": "TR",
    "florence": "IT",
    "helsinki": "FI",
    "istanbul": "TR",
    "lisbon": "PT",
    "marseille": "FR",
    "merida": "MX",
    "naples": "IT",
    "singapore": "SG",
    "southampton": "GB",
    "stockholm": "SE",
    "sydney": "AU",
    "vancouver": "CA",
    "venice": "IT",
    "yokohama": "JP",
    "cabo-san-lucas": "MX",
    "cozumel": "MX",
    "mahahual": "MX",
    "puerto-vallarta": "MX"
  };

  for (const fileName of destinationFiles) {
    const destination = readJson(path.join(destinationsDir, fileName));
    registryDestinations.push({
      slug: destination.slug,
      name: destination.display_name || destination.slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      country_code: countryMap[destination.slug] || "US",
      status: destination.status || "active",
      visibility: destination.visibility || "public"
    });
  }

  const registryOutput = {
    version: 1,
    updated_at: new Date().toISOString(),
    destinations: registryDestinations.sort((a, b) => a.slug.localeCompare(b.slug))
  };
  writeJson(path.join(destinationsDir, "index.json"), registryOutput);

  // 2. Generate lib/dcc/destinations/index.ts dynamically
  const importLines = [];
  const dataEntries = [];

  for (const fileName of destinationFiles) {
    const slug = fileName.replace(/\.json$/, "");
    const varName = `${camelCase(slug)}Json`;
    importLines.push(`import ${varName} from "@/data/destinations/${fileName}";`);
    dataEntries.push(`  "${slug}": DestinationRecordSchema.parse(${varName}),`);
  }

  const tsCode = [
    `import registryJson from "@/data/destinations/index.json";`,
    importLines.join("\n"),
    `import {`,
    `  DestinationRecordSchema,`,
    `  DestinationRegistrySchema,`,
    `  type DestinationRecord,`,
    `} from "@/lib/dcc/destinations/schema";`,
    ``,
    `export const DESTINATION_REGISTRY = DestinationRegistrySchema.parse(registryJson);`,
    ``,
    `const DESTINATION_DATA = {`,
    dataEntries.join("\n"),
    `} as const;`,
    ``,
    `export type DestinationKey = keyof typeof DESTINATION_DATA;`,
    ``,
    `export function listDestinationKeys(): DestinationKey[] {`,
    `  return Object.keys(DESTINATION_DATA) as DestinationKey[];`,
    `}`,
    ``,
    `export function isDestinationKey(value: string): value is DestinationKey {`,
    `  return value in DESTINATION_DATA;`,
    `}`,
    ``,
    `export function getDestination(slug: string): DestinationRecord | null {`,
    `  if (isDestinationKey(slug)) {`,
    `    return DESTINATION_DATA[slug];`,
    `  }`,
    ``,
    `  const normalized = slug.trim().toLowerCase();`,
    `  for (const destination of Object.values(DESTINATION_DATA)) {`,
    `    if (destination.aliases.includes(normalized)) {`,
    `      return destination;`,
    `    }`,
    `  }`,
    ``,
    `  return null;`,
    `}`,
    ``,
    `export function getDestinationByPortGateway(portSlug: string): DestinationRecord | null {`,
    `  const normalized = portSlug.trim().toLowerCase();`,
    `  for (const destination of Object.values(DESTINATION_DATA)) {`,
    `    if (destination.port_gateways.some((gateway) => gateway.port_slug === normalized)) {`,
    `      return destination;`,
    `    }`,
    `  }`,
    ``,
    `  return null;`,
    `}`,
    ``
  ].join("\n");

  fs.writeFileSync(path.join(repoRoot, "lib", "dcc", "destinations", "index.ts"), tsCode, "utf8");

  // 3. Generate data/dynamic-routes.json
  const dynamicRoutes = new Set();

  for (const fileName of destinationFiles) {
    const slug = fileName.replace(/\.json$/, "");
    dynamicRoutes.add(`/${slug}`);
    dynamicRoutes.add(`/${slug}/tours`);
    dynamicRoutes.add(`/${slug}/attractions`);
    dynamicRoutes.add(`/${slug}/day-trips`);
    dynamicRoutes.add(`/${slug}/shows`);
    dynamicRoutes.add(`/${slug}/helicopter`);
    dynamicRoutes.add(`/${slug}/shows-this-week`);
    dynamicRoutes.add(`/${slug}/food`);
    dynamicRoutes.add(`/${slug}/sports`);
    dynamicRoutes.add(`/${slug}/things-to-do`);
  }

  // 4. Statically register Resort OS dynamic routes
  dynamicRoutes.add("/resort/kalahari-resort-dells");
  dynamicRoutes.add("/resort/wilderness-resort-dells");
  dynamicRoutes.add("/resort/chula-vista-resort-dells");
  dynamicRoutes.add("/resort/grand-geneva-resort");

  // 5. Dynamically register all cruise port routes from PORT_AUTHORITY_CONFIG
  try {
    const portConfigPath = path.join(repoRoot, "src", "data", "port-authority-config.ts");
    if (fs.existsSync(portConfigPath)) {
      const portConfigContent = fs.readFileSync(portConfigPath, "utf8");
      const configMatch = portConfigContent.match(/export const PORT_AUTHORITY_CONFIG: Record<string, PortAuthorityConfig> = \{([\s\S]+?)\n\};/);
      if (configMatch) {
        const block = configMatch[1];
        const keyRegex = /^\s+([a-zA-Z0-9-"'\s]+):\s*\{/gm;
        let match;
        while ((match = keyRegex.exec(block)) !== null) {
          const key = match[1].trim().replace(/['"]/g, "");
          if (key) {
            dynamicRoutes.add(`/cruise-ports/${key}`);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Error dynamically generating cruise port routes:", e.message);
  }


  const attractionsDir = path.join(repoRoot, "data", "attractions");
  if (fs.existsSync(attractionsDir)) {
    const files = fs.readdirSync(attractionsDir).filter(f => f.endsWith(".json"));
    for (const file of files) {
      const city = file.replace(/\.json$/, "");
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(attractionsDir, file), "utf8"));
        if (manifest && Array.isArray(manifest.attractions)) {
          for (const entry of manifest.attractions) {
            if (entry.slug) {
              dynamicRoutes.add(`/${city}/${entry.slug}`);
              dynamicRoutes.add(`/${city}/${entry.slug}/tours`);
            }
          }
        }
      } catch (e) {
        console.warn(`Error reading attractions for ${city}:`, e.message);
      }
    }
  }

  const categoriesDir = path.join(repoRoot, "data", "categories");
  if (fs.existsSync(categoriesDir)) {
    const files = fs.readdirSync(categoriesDir).filter(f => f.endsWith(".json"));
    for (const file of files) {
      const city = file.replace(/\.json$/, "");
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(categoriesDir, file), "utf8"));
        if (manifest && Array.isArray(manifest.categories)) {
          for (const entry of manifest.categories) {
            if (entry.slug) {
              dynamicRoutes.add(`/${city}/${entry.slug}`);
            }
          }
        }
      } catch (e) {
        console.warn(`Error reading categories for ${city}:`, e.message);
      }
    }
  }

  const venuesFile = path.join(repoRoot, "src", "data", "sports-venues-config.ts");
  if (fs.existsSync(venuesFile)) {
    const content = fs.readFileSync(venuesFile, "utf8");
    const regex = /slug:\s*["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      dynamicRoutes.add(`/venues/${match[1]}`);
    }
  }

  const sortedRoutes = Array.from(dynamicRoutes).sort();
  writeJson(path.join(repoRoot, "data", "dynamic-routes.json"), sortedRoutes);

  console.log(
    JSON.stringify(
      {
        destinations_read: destinationFiles.length,
        city_aliases: Object.keys(derivatives.cityAliases).length,
        attractions: Object.keys(derivatives.attractions).length,
        port_mappings: Object.keys(derivatives.portMappings).length,
        dynamic_routes_generated: sortedRoutes.length
      },
      null,
      2
    )
  );
}

main();
