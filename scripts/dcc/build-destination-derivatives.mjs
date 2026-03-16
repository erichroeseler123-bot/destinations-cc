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

function main() {
  const derivatives = buildDerivativesFromDestinations();

  writeJson(cityAliasesPath, derivatives.cityAliases);
  writeJson(attractionsPath, derivatives.attractions);
  writeJson(portMappingsPath, derivatives.portMappings);

  console.log(
    JSON.stringify(
      {
        destinations_read: listDestinationFiles().length,
        city_aliases: Object.keys(derivatives.cityAliases).length,
        attractions: Object.keys(derivatives.attractions).length,
        port_mappings: Object.keys(derivatives.portMappings).length,
      },
      null,
      2
    )
  );
}

main();
