export type VenueResolution = {
  venueId: string | null;
  venueName: string | null;
  sameAs: string[];
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
  "blue nile": "blue-nile",
  "d.b.a.": "dba",
  "dba": "dba",
  "howlin' wolf": "howlin-wolf",
  "the howlin' wolf": "howlin-wolf",
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
  if (!venueName) {
    return {
      venueId: null,
      venueName: null,
      sameAs: sourceVenueId ? [`${source}:${sourceVenueId}`] : [],
    };
  }

  const normalizedName = venueName.trim().toLowerCase();
  const alias = destinationId === "new-orleans" ? NEW_ORLEANS_VENUE_ALIASES[normalizedName] : undefined;
  const slug = alias || slugifyVenueName(venueName);

  return {
    venueId: slug ? `${destinationId}/${slug}` : null,
    venueName,
    sameAs: sourceVenueId ? [`${source}:${sourceVenueId}`] : [],
  };
}
