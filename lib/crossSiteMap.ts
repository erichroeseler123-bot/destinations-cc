const DCC_ORIGIN = "https://destinationcommandcenter.com";

export type CrossSiteVenueMapEntry = {
  slug: string;
  parrVenuePath: string;
  parrBookingPath: string;
  dccAuthorityPath: string;
};

export const CROSS_SITE_VENUE_MAP: Record<string, CrossSiteVenueMapEntry> = {
  "red-rocks-amphitheatre": {
    slug: "red-rocks-amphitheatre",
    parrVenuePath: "/venues/red-rocks-amphitheatre",
    parrBookingPath: "/book/red-rocks-amphitheatre/custom/shared",
    dccAuthorityPath: `${DCC_ORIGIN}/red-rocks`,
  },
  "mission-ballroom": {
    slug: "mission-ballroom",
    parrVenuePath: "/venues/mission-ballroom",
    parrBookingPath: "/book/mission-ballroom",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/mission-ballroom`,
  },
  "ball-arena": {
    slug: "ball-arena",
    parrVenuePath: "/venues/ball-arena",
    parrBookingPath: "/book/ball-arena",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/ball-arena`,
  },
  "fiddlers-green-amphitheatre": {
    slug: "fiddlers-green-amphitheatre",
    parrVenuePath: "/venues/fiddlers-green-amphitheatre",
    parrBookingPath: "/book/fiddlers-green-amphitheatre",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/fiddlers-green-amphitheatre`,
  },
  "ogden-theatre": {
    slug: "ogden-theatre",
    parrVenuePath: "/venues/ogden-theatre",
    parrBookingPath: "/book/ogden-theatre",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/ogden-theatre`,
  },
  "gothic-theatre": {
    slug: "gothic-theatre",
    parrVenuePath: "/venues/gothic-theatre",
    parrBookingPath: "/book/gothic-theatre",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/gothic-theatre`,
  },
  "cervantes-masterpiece": {
    slug: "cervantes-masterpiece",
    parrVenuePath: "/venues/cervantes-masterpiece",
    parrBookingPath: "/book/cervantes-masterpiece",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/cervantes-masterpiece`,
  },
  "bluebird-theater": {
    slug: "bluebird-theater",
    parrVenuePath: "/venues/bluebird-theater",
    parrBookingPath: "/book/bluebird-theater",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/bluebird-theater`,
  },
  "summit-music-hall": {
    slug: "summit-music-hall",
    parrVenuePath: "/venues/summit-music-hall",
    parrBookingPath: "/book/summit-music-hall",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/summit-music-hall`,
  },
  "marquis-theater": {
    slug: "marquis-theater",
    parrVenuePath: "/venues/marquis-theater",
    parrBookingPath: "/book/marquis-theater",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/marquis-theater`,
  },
  "boulder-theater": {
    slug: "boulder-theater",
    parrVenuePath: "/venues/boulder-theater",
    parrBookingPath: "/book/boulder-theater",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/boulder-theater`,
  },
  "fox-theatre": {
    slug: "fox-theatre",
    parrVenuePath: "/venues/fox-theatre",
    parrBookingPath: "/book/fox-theatre",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/fox-theatre`,
  },
  "mishawaka-amphitheatre": {
    slug: "mishawaka-amphitheatre",
    parrVenuePath: "/venues/mishawaka-amphitheatre",
    parrBookingPath: "/venues/mishawaka-amphitheatre",
    dccAuthorityPath: `${DCC_ORIGIN}/transportation/venues/mishawaka-amphitheatre`,
  },
};

export function getCrossSiteVenue(slug: string) {
  return CROSS_SITE_VENUE_MAP[slug] ?? null;
}
