import type { SoutheastAlaskaPlaceRecord } from "../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import type { LfsePortDirectoryCardItem } from "../components/LfsePortsDirectoryClient";

export const STANDARDIZED_TWO_HOUR_PLANNING_NOTE =
  "Cruise Promenade and the DCC network recommend planning for tours that return at least two hours before all-aboard.";

export type DestinationTypePillLabel =
  | "Cruise Port Town"
  | "Cruise Terminal"
  | "Community & Harbor"
  | "Scenic Cruising — Non-Disembarkation"
  | "Gateway Community";

export function classifyDestinationType(place: SoutheastAlaskaPlaceRecord): {
  key: LfsePortDirectoryCardItem["destinationTypeKey"];
  label: DestinationTypePillLabel;
} {
  if (place.placeType === "scenic_cruise_destination") {
    return {
      key: "scenic_cruising",
      label: "Scenic Cruising — Non-Disembarkation",
    };
  }
  if (place.placeType === "cruise_terminal") {
    return {
      key: "cruise_terminal",
      label: "Cruise Terminal",
    };
  }
  if (place.publicPortSlug === "gustavus") {
    return {
      key: "gateway_community",
      label: "Gateway Community",
    };
  }
  if (
    place.publicPortSlug === "hoonah" ||
    place.publicPortSlug === "petersburg" ||
    place.publicPortSlug === "klawock"
  ) {
    return {
      key: "community_harbor",
      label: "Community & Harbor",
    };
  }
  return {
    key: "cruise_port_town",
    label: "Cruise Port Town",
  };
}

export function resolveDestinationHeroMedia(place: SoutheastAlaskaPlaceRecord): {
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
} {
  if (place.publicPortSlug === "gustavus") {
    return {
      heroImage: "/images/alaska/allen-marine-catamaran.jpg",
      heroImageAlt:
        "Day-tour vessel cruising glaciated waters of Glacier Bay National Park out of Bartlett Cove near Gustavus, Alaska",
      heroImageCredit: "Public domain · National Park Service",
    };
  }
  return {
    heroImage: place.heroImage,
    heroImageAlt: place.heroImageAlt,
    heroImageCredit: place.heroImageCredit,
  };
}

export function formatCleanPlaceBaseName(rawName: string): string {
  return rawName.replace(/\s*\(Scenic Cruising\)\s*/gi, "").trim();
}

export function buildPortDetailH1(place: SoutheastAlaskaPlaceRecord): string {
  const cleanName = formatCleanPlaceBaseName(place.name);
  if (place.placeType === "scenic_cruise_destination") {
    return `${cleanName} — Scenic Cruising (Non-Disembarkation) Guide`;
  }
  if (place.publicPortSlug === "gustavus") {
    return `${cleanName} — Gateway Community & Bartlett Cove Guide`;
  }
  return `${cleanName} Shore Excursions & Local Port Guide`;
}
