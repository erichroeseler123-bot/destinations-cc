const LABEL_OVERRIDES: Record<string, string> = {
  "arts-district": "Arts district",
  "cocktail-bar": "Cocktail bar",
  "convention-heavy": "Convention-heavy",
  "date-night": "Date night",
  "downtown-core": "Downtown Core",
  "event-heavy": "Event-heavy",
  "food-and-drink": "Food and drink",
  "gastropub": "Gastropub",
  "group-spot": "Group spot",
  "high_impact": "High impact",
  "hotel-bars": "Hotel bars",
  "italian-cocktails": "Italian • cocktails",
  "major-event-campus": "Major event campus",
  "mixed-use-core": "Mixed-use core",
  "nightlife-corridor": "Nightlife corridor",
  "nightlife-heavy": "Nightlife-heavy",
  "pre-game": "Pre-game",
  "pre-show": "Pre-show",
  "restaurant-bar": "Restaurant bar",
  "restaurant-cafe": "Restaurant • cafe",
  "restaurant-nightlife": "Restaurant • nightlife",
  "riverfront": "Riverfront",
  "rooftop-bar": "Rooftop bar",
  "source_backed": "Source-backed",
  "spanish-tapas": "Spanish • tapas",
  "stadium-district": "Stadium district",
  "theater-comedy-live": "Theater • comedy • live",
};

export function titleize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

export function beautifyCategory(value: string) {
  if (LABEL_OVERRIDES[value]) {
    return LABEL_OVERRIDES[value];
  }

  return value
    .replaceAll("_", "-")
    .split("-")
    .map((part) => {
      if (part === "lodo") {
        return "LoDo";
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" • ");
}

export function getAnchorLabel(name: string) {
  return name
    .replace(/^The\s+/i, "")
    .replace(/\s+(Denver|Chicago|Miami|Nashville|Austin|New York City)$/i, "");
}

