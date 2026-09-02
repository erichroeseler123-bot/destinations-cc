export type VenueResolution = {
  venueId: string | null;
  venueName: string | null;
  sameAs: string[];
};

const NEW_ORLEANS_TICKETMASTER_VENUE_IDS: Record<string, string> = {
  rZ7HnEZ174zuz: "snug-harbor-jazz-bistro",
  ZFr9jZa7va: "le-petit-theatre",
  rZ7HnEZ17aKef: "gasa-gasa",
  rZ7HnEZ17j_8N: "no-dice",
  rZ7HnEZadkE: "tipitinas",
  rZ7HnEZ17qkPV: "chickie-wah-wah",
  rZ7HnEZ17a_FA: "howlin-wolf-den",
  KovZpZA6tdnA: "caesars-superdome",
  KovZpZAE6vtA: "house-of-blues-new-orleans",
};

const NEW_ORLEANS_VENUE_ALIASES: Record<string, string> = {
  "preservation hall": "preservation-hall",
  "saenger theatre-new orleans": "saenger-theatre",
  "saenger theatre": "saenger-theatre",
  "the fillmore new orleans": "fillmore-new-orleans",
  "fillmore new orleans": "fillmore-new-orleans",
  "house of blues new orleans": "house-of-blues-new-orleans",
  "tipitina's": "tipitinas",
  "tipitinas": "tipitinas",
  "the joy theater": "joy-theater",
  "joy theater": "joy-theater",
  "orpheum theater": "orpheum-theater",
  "orpheum theater new orleans": "orpheum-theater",
  "smoothie king center": "smoothie-king-center",
  "caesars superdome": "caesars-superdome",
  "mahalia jackson theater for the performing arts": "mahalia-jackson-theater",
  "civic theatre": "civic-theatre",
  "toulouse theatre": "toulouse-theatre",
  "maple leaf bar": "maple-leaf-bar",
  "snug harbor jazz bistro": "snug-harbor-jazz-bistro",
  "le petit theatre": "le-petit-theatre",
  "gasa gasa": "gasa-gasa",
  "no dice": "no-dice",
  "blue nile": "blue-nile",
  "d.b.a.": "dba",
  "dba": "dba",
  "howlin' wolf": "howlin-wolf",
  "the howlin' wolf": "howlin-wolf",
  "the den at howlin' wolf": "howlin-wolf-den",
  "broadside": "broadside",
  "chickie wah wah": "chickie-wah-wah",
};

function slugifyVenueName(name: string) {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function resolveVenueGraphId(args: {
  destinationId: string;
  venueName: string | null;
  source: "ticketmaster" | "eventbrite" | "city-calendar";
  sourceVenueId?: string | null;
}): VenueResolution {
  const { destinationId, venueName, source, sourceVenueId } = args;
  const exactTicketmasterSlug =
    destinationId === "new-orleans" && source === "ticketmaster" && sourceVenueId
      ? NEW_ORLEANS_TICKETMASTER_VENUE_IDS[sourceVenueId]
      : undefined;

  if (!venueName && !exactTicketmasterSlug) {
    return {
      venueId: null,
      venueName: null,
      sameAs: sourceVenueId ? [`${source}:${sourceVenueId}`] : [],
    };
  }

  const normalizedName = venueName?.trim().toLowerCase() ?? "";
  const alias = destinationId === "new-orleans" ? NEW_ORLEANS_VENUE_ALIASES[normalizedName] : undefined;
  const slug = exactTicketmasterSlug || alias || (venueName ? slugifyVenueName(venueName) : "");

  return {
    venueId: slug ? `${destinationId}/${slug}` : null,
    venueName,
    sameAs: sourceVenueId ? [`${source}:${sourceVenueId}`] : [],
  };
}
