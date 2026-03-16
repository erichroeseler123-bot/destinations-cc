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

function titleCaseFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 2) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function invertGatewayMappings(mappingTable) {
  const result = new Map();

  for (const [portSlug, destinationSlug] of Object.entries(mappingTable)) {
    if (!result.has(destinationSlug)) {
      result.set(destinationSlug, []);
    }

    result.get(destinationSlug).push({
      kind: "port_tours_handoff",
      source_slug: portSlug,
    });
  }

  return result;
}

function buildDestinationRecord(slug, intents, cityAliases, gatewayMappingsByDestination) {
  const aliasValue = cityAliases[slug];
  const aliases = aliasValue && aliasValue !== slug ? [aliasValue] : [];
  const gatewayMappings = gatewayMappingsByDestination.get(slug) || [];

  return {
    slug,
    display_name: titleCaseFromSlug(slug),
    aliases,
    starter_intents: intents,
    ...(gatewayMappings.length ? { gateway_mappings: gatewayMappings } : {}),
    status: "active",
    visibility: "public",
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function clearGeneratedDestinationFiles(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".json")) continue;
    if (entry.name === "index.json") continue;
    fs.unlinkSync(path.join(dirPath, entry.name));
  }
}

function main() {
  const cityAliases = readJson(cityAliasesPath);
  const attractions = readJson(attractionsPath);
  const portMappings = readJson(portMappingsPath);
  const gatewayMappingsByDestination = invertGatewayMappings(portMappings);

  fs.mkdirSync(destinationsDir, { recursive: true });
  clearGeneratedDestinationFiles(destinationsDir);

  const destinationSlugs = Object.keys(attractions).sort();

  for (const slug of destinationSlugs) {
    const record = buildDestinationRecord(
      slug,
      attractions[slug],
      cityAliases,
      gatewayMappingsByDestination
    );
    writeJson(path.join(destinationsDir, `${slug}.json`), record);
  }

  console.log(
    JSON.stringify(
      {
        created: destinationSlugs.length,
        output_dir: "data/destinations",
      },
      null,
      2
    )
  );
}

main();
