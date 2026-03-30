import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";

type MediaRegistryEntry = {
  key: string;
  aliases?: string[];
  imageSet: NodeImageSet;
};

function ownedAsset(
  src: string,
  alt: string,
  extra?: Partial<NodeImageAsset>,
): NodeImageAsset {
  return {
    src,
    alt,
    source: "local",
    providerTermsBucket: "owned",
    canIndex: true,
    hotlinkOnly: false,
    priority: 100,
    ...extra,
  };
}

function buildOwnedImageSet(input: {
  hero?: { src: string; alt: string };
  card?: { src: string; alt: string };
  gallery?: Array<{ src: string; alt: string }>;
}): NodeImageSet {
  return {
    hero: input.hero ? ownedAsset(input.hero.src, input.hero.alt) : null,
    card: input.card ? ownedAsset(input.card.src, input.card.alt) : null,
    gallery: (input.gallery || []).map((item) => ownedAsset(item.src, item.alt)),
  };
}

function wikimediaAsset(
  src: string,
  alt: string,
  attribution: string,
  license: string,
  licenseUrl: string,
  sourceId?: string,
): NodeImageAsset {
  return {
    src,
    alt,
    source: "wikimedia",
    attribution: {
      label: attribution,
      href: licenseUrl,
    },
    sourceId,
    license,
    licenseUrl,
    pageUrl: sourceId ? `https://commons.wikimedia.org/wiki/${sourceId}` : undefined,
    providerTermsBucket: "open-license",
    canIndex: true,
    hotlinkOnly: false,
    priority: 90,
  };
}

function buildWikimediaImageSet(input: {
  hero?: {
    src: string;
    alt: string;
    attribution: string;
    license: string;
    licenseUrl: string;
    sourceId?: string;
  };
  card?: {
    src: string;
    alt: string;
    attribution: string;
    license: string;
    licenseUrl: string;
    sourceId?: string;
  };
}): NodeImageSet {
  return {
    hero: input.hero
      ? wikimediaAsset(
          input.hero.src,
          input.hero.alt,
          input.hero.attribution,
          input.hero.license,
          input.hero.licenseUrl,
          input.hero.sourceId,
        )
      : null,
    card: input.card
      ? wikimediaAsset(
          input.card.src,
          input.card.alt,
          input.card.attribution,
          input.card.license,
          input.card.licenseUrl,
          input.card.sourceId,
        )
      : null,
    gallery: [],
  };
}

export const MEDIA_REGISTRY: MediaRegistryEntry[] = [
  {
    key: "venue:red-rocks-amphitheatre",
    aliases: ["sg_venue:196", "route:denver-red-rocks"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/authority/venues/red-rocks-amphitheatre/hero.webp",
        alt: "Red Rocks Amphitheatre bowl at sunset",
      },
      card: {
        src: "/images/authority/venues/red-rocks-amphitheatre/section-1.webp",
        alt: "Red Rocks Amphitheatre seating bowl and stage",
      },
      gallery: [
        {
          src: "/images/authority/venues/red-rocks-amphitheatre/gallery-1.webp",
          alt: "Red Rocks concert-night venue photography",
        },
        {
          src: "/images/authority/venues/red-rocks-amphitheatre/gallery-2.webp",
          alt: "Red Rocks venue overview photography",
        },
      ],
    }),
  },
  {
    key: "city:denver",
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/authority/cities/denver/hero.webp",
        alt: "Denver skyline and foothills",
      },
      card: {
        src: "/images/authority/cities/denver/section-1.webp",
        alt: "Denver city photography",
      },
      gallery: [
        {
          src: "/images/authority/cities/denver/gallery-1.webp",
          alt: "Denver neighborhood photography",
        },
        {
          src: "/images/authority/cities/denver/gallery-2.webp",
          alt: "Denver city and mountain-edge photography",
        },
      ],
    }),
  },
  {
    key: "city:boston",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Boston_Skyline_Panorama.jpg/1920px-Boston_Skyline_Panorama.jpg",
        alt: "Boston skyline panorama above the Charles River",
        attribution: "Juneau Wang",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
        sourceId: "File:Boston_Skyline_Panorama.jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Boston_Skyline_Panorama.jpg/1280px-Boston_Skyline_Panorama.jpg",
        alt: "Boston skyline and river view",
        attribution: "Juneau Wang",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
        sourceId: "File:Boston_Skyline_Panorama.jpg",
      },
    }),
  },
  {
    key: "city:seattle",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Seattle_Skyline.jpg",
        alt: "Seattle skyline viewed from the waterfront",
        attribution: "Doug Brown",
        license: "CC BY-SA 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
        sourceId: "File:Seattle_Skyline.jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Seattle_Skyline.jpg/1280px-Seattle_Skyline.jpg",
        alt: "Seattle skyline waterfront card view",
        attribution: "Doug Brown",
        license: "CC BY-SA 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
        sourceId: "File:Seattle_Skyline.jpg",
      },
    }),
  },
  {
    key: "city:washington-dc",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/2/26/National_Mall_WDC.JPG",
        alt: "National Mall and Washington Monument in Washington DC",
        attribution: "Christoph Radtke",
        license: "CC BY 3.0",
        licenseUrl: "https://creativecommons.org/licenses/by/3.0",
        sourceId: "File:National_Mall_WDC.JPG",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/National_Mall_WDC.JPG/1280px-National_Mall_WDC.JPG",
        alt: "National Mall and Washington Monument card view",
        attribution: "Christoph Radtke",
        license: "CC BY 3.0",
        licenseUrl: "https://creativecommons.org/licenses/by/3.0",
        sourceId: "File:National_Mall_WDC.JPG",
      },
    }),
  },
  {
    key: "city:phoenix",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Phoenix_Skyline_from_South_Mountain_at_Night.2010.jpg/1280px-Phoenix_Skyline_from_South_Mountain_at_Night.2010.jpg",
        alt: "Phoenix skyline at night viewed from South Mountain",
        attribution: "Alan Stark",
        license: "CC BY-SA 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
        sourceId: "File:Phoenix_Skyline_from_South_Mountain_at_Night.2010.jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Phoenix_Skyline_from_South_Mountain_at_Night.2010.jpg/1280px-Phoenix_Skyline_from_South_Mountain_at_Night.2010.jpg",
        alt: "Phoenix skyline at night with desert mountain backdrop",
        attribution: "Alan Stark",
        license: "CC BY-SA 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
        sourceId: "File:Phoenix_Skyline_from_South_Mountain_at_Night.2010.jpg",
      },
    }),
  },
  {
    key: "city:salt-lake-city",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Salt_Lake_City_skyline_%282020%29_from_Ensign_Peak.jpg/1280px-Salt_Lake_City_skyline_%282020%29_from_Ensign_Peak.jpg",
        alt: "Salt Lake City skyline and Wasatch Mountains from Ensign Peak",
        attribution: "Iansmh98",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
        sourceId: "File:Salt_Lake_City_skyline_(2020)_from_Ensign_Peak.jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Salt_Lake_City_skyline_%282020%29_from_Ensign_Peak.jpg/1280px-Salt_Lake_City_skyline_%282020%29_from_Ensign_Peak.jpg",
        alt: "Salt Lake City skyline from Ensign Peak",
        attribution: "Iansmh98",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
        sourceId: "File:Salt_Lake_City_skyline_(2020)_from_Ensign_Peak.jpg",
      },
    }),
  },
  {
    key: "city:honolulu",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Hawaii_Honolulu_Waikiki_beach.JPG/1280px-Hawaii_Honolulu_Waikiki_beach.JPG",
        alt: "Waikiki Beach and Diamond Head in Honolulu",
        attribution: "A. Coppens",
        license: "CC BY 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0",
        sourceId: "File:Hawaii_Honolulu_Waikiki_beach.JPG",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Hawaii_Honolulu_Waikiki_beach.JPG/1280px-Hawaii_Honolulu_Waikiki_beach.JPG",
        alt: "Waikiki Beach shoreline with Diamond Head backdrop",
        attribution: "A. Coppens",
        license: "CC BY 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0",
        sourceId: "File:Hawaii_Honolulu_Waikiki_beach.JPG",
      },
    }),
  },
  {
    key: "city:tampa",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tampa_Skyline.jpg/1920px-Tampa_Skyline.jpg",
        alt: "Tampa skyline above the waterfront",
        attribution: "Ebyabe",
        license: "CC BY-SA 3.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
        sourceId: "File:Tampa_Skyline.jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tampa_Skyline.jpg/1920px-Tampa_Skyline.jpg",
        alt: "Tampa waterfront skyline card view",
        attribution: "Ebyabe",
        license: "CC BY-SA 3.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
        sourceId: "File:Tampa_Skyline.jpg",
      },
    }),
  },
  {
    key: "city:scottsdale",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Scottsdale%2C_Arizona_%28101299903%29.jpg",
        alt: "Scottsdale city view with desert-edge urban grid",
        attribution: "Ken Lund",
        license: "CC BY-SA 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
        sourceId: "File:Scottsdale,_Arizona_(101299903).jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Scottsdale%2C_Arizona_%28101299903%29.jpg/1280px-Scottsdale%2C_Arizona_%28101299903%29.jpg",
        alt: "Scottsdale city grid and low-desert surroundings",
        attribution: "Ken Lund",
        license: "CC BY-SA 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
        sourceId: "File:Scottsdale,_Arizona_(101299903).jpg",
      },
    }),
  },
  {
    key: "city:san-antonio",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Skyline_of_San_Antonio.jpg/1920px-Skyline_of_San_Antonio.jpg",
        alt: "San Antonio skyline above downtown at dusk",
        attribution: "Medialecent",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
        sourceId: "File:Skyline_of_San_Antonio.jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Skyline_of_San_Antonio.jpg/960px-Skyline_of_San_Antonio.jpg",
        alt: "San Antonio skyline card view",
        attribution: "Medialecent",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
        sourceId: "File:Skyline_of_San_Antonio.jpg",
      },
    }),
  },
  {
    key: "city:portland",
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Portland_Skyline_%2818169410045%29.jpg/1920px-Portland_Skyline_%2818169410045%29.jpg",
        alt: "Portland skyline with downtown towers and tree-lined foreground",
        attribution: "Tony Webster",
        license: "CC BY 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0",
        sourceId: "File:Portland_Skyline_(18169410045).jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Portland_Skyline_%2818169410045%29.jpg/1280px-Portland_Skyline_%2818169410045%29.jpg",
        alt: "Portland skyline card view",
        attribution: "Tony Webster",
        license: "CC BY 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0",
        sourceId: "File:Portland_Skyline_(18169410045).jpg",
      },
    }),
  },
  {
    key: "attraction:mighty-argo",
    aliases: ["attraction:mighty-argo-cable-car", "region:idaho-springs"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/argo/hero.jpg",
        alt: "Mighty Argo proof image from Idaho Springs",
      },
      card: {
        src: "/images/argo-hero.jpg",
        alt: "Mighty Argo cable car and mine-area image",
      },
    }),
  },
  {
    key: "attraction:mendenhall-glacier",
    aliases: ["attraction:mendenhall"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/authority/attractions/mendenhall-glacier/hero.webp",
        alt: "Mendenhall Glacier overview photography",
      },
      card: {
        src: "/images/authority/attractions/mendenhall-glacier/section-1.webp",
        alt: "Mendenhall Glacier shore-excursion photography",
      },
      gallery: [
        {
          src: "/images/authority/attractions/mendenhall-glacier/gallery-1.webp",
          alt: "Mendenhall Glacier landscape photography",
        },
        {
          src: "/images/authority/attractions/mendenhall-glacier/gallery-2.webp",
          alt: "Juneau glacier access photography",
        },
      ],
    }),
  },
  {
    key: "port:juneau-alaska",
    aliases: ["city:juneau"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/authority/ports/juneau/hero.webp",
        alt: "Juneau cruise port and mountain backdrop",
      },
      card: {
        src: "/images/authority/ports/juneau/section-1.webp",
        alt: "Juneau port-day planning photography",
      },
      gallery: [
        {
          src: "/images/authority/ports/juneau/gallery-1.webp",
          alt: "Juneau waterfront and port photography",
        },
        {
          src: "/images/authority/ports/juneau/gallery-2.webp",
          alt: "Juneau shore-day destination photography",
        },
      ],
    }),
  },
  {
    key: "hotel:bellagio",
    aliases: ["casino:bellagio-casino", "attraction:fountains-of-bellagio"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/las-vegas/hotels/bellagio-hero.svg",
        alt: "Bellagio hotel hero artwork",
      },
      card: {
        src: "/images/las-vegas/hotels/bellagio-card.svg",
        alt: "Bellagio hotel card artwork",
      },
    }),
  },
  {
    key: "hotel:caesars-palace",
    aliases: ["casino:caesars-palace-casino"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/las-vegas/hotels/caesars-hero.svg",
        alt: "Caesars Palace hotel hero artwork",
      },
      card: {
        src: "/images/las-vegas/hotels/caesars-card.svg",
        alt: "Caesars Palace hotel card artwork",
      },
    }),
  },
  {
    key: "hotel:mgm-grand",
    aliases: ["casino:mgm-grand-casino"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/las-vegas/hotels/mgm-grand-hero.svg",
        alt: "MGM Grand hotel hero artwork",
      },
      card: {
        src: "/images/las-vegas/hotels/mgm-grand-card.svg",
        alt: "MGM Grand hotel card artwork",
      },
    }),
  },
  {
    key: "hotel:venetian",
    aliases: ["casino:venetian-casino"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/las-vegas/hotels/venetian-hero.svg",
        alt: "Venetian hotel hero artwork",
      },
      card: {
        src: "/images/las-vegas/hotels/venetian-card.svg",
        alt: "Venetian hotel card artwork",
      },
    }),
  },
  {
    key: "hotel:wynn",
    aliases: ["casino:wynn-casino"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/las-vegas/hotels/wynn-hero.svg",
        alt: "Wynn hotel hero artwork",
      },
      card: {
        src: "/images/las-vegas/hotels/wynn-card.svg",
        alt: "Wynn hotel card artwork",
      },
    }),
  },
  {
    key: "hotel:rio",
    aliases: ["hotel:rio-las-vegas"],
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Rio_All-Suite_Hotel_%26_Casino_Las_Vegas.jpg/1280px-Rio_All-Suite_Hotel_%26_Casino_Las_Vegas.jpg",
        alt: "Rio All-Suite Hotel and Casino exterior in Las Vegas",
        attribution: "Tomás Del Coro / CC BY-SA 2.0 via Wikimedia Commons",
        license: "CC BY-SA 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
        sourceId: "File:Rio_All-Suite_Hotel_%26_Casino_Las_Vegas.jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Rio_All-Suite_Hotel_%26_Casino_Las_Vegas.jpg/1280px-Rio_All-Suite_Hotel_%26_Casino_Las_Vegas.jpg",
        alt: "Rio All-Suite Hotel and Casino exterior in Las Vegas",
        attribution: "Tomás Del Coro / CC BY-SA 2.0 via Wikimedia Commons",
        license: "CC BY-SA 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
        sourceId: "File:Rio_All-Suite_Hotel_%26_Casino_Las_Vegas.jpg",
      },
    }),
  },
  {
    key: "hotel:hard-rock-las-vegas",
    aliases: ["hotel:mirage-las-vegas"],
    imageSet: buildWikimediaImageSet({
      hero: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Mirage_Las_Vegas_December_2013.jpg/1280px-Mirage_Las_Vegas_December_2013.jpg",
        alt: "The Mirage hotel exterior on the Las Vegas Strip at night",
        attribution: "King of Hearts / CC BY-SA 3.0 via Wikimedia Commons",
        license: "CC BY-SA 3.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        sourceId: "File:Mirage_Las_Vegas_December_2013.jpg",
      },
      card: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Mirage_Las_Vegas_December_2013.jpg/1280px-Mirage_Las_Vegas_December_2013.jpg",
        alt: "The Mirage hotel exterior on the Las Vegas Strip at night",
        attribution: "King of Hearts / CC BY-SA 3.0 via Wikimedia Commons",
        license: "CC BY-SA 3.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        sourceId: "File:Mirage_Las_Vegas_December_2013.jpg",
      },
    }),
  },
  {
    key: "attraction:sphere-las-vegas",
    aliases: ["venue:sphere-las-vegas"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/las-vegas/attractions/sphere-las-vegas.svg",
        alt: "Sphere Las Vegas exterior artwork",
      },
      card: {
        src: "/images/las-vegas/attractions/sphere-las-vegas.svg",
        alt: "Sphere Las Vegas card artwork",
      },
    }),
  },
  {
    key: "attraction:fremont-street-experience",
    aliases: ["district:fremont-street"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/las-vegas/attractions/fremont-street-experience.svg",
        alt: "Fremont Street Experience artwork",
      },
      card: {
        src: "/images/las-vegas/attractions/fremont-street-experience.svg",
        alt: "Fremont Street Experience card artwork",
      },
    }),
  },
  {
    key: "attraction:grand-canyon",
    aliases: ["national-park:grand-canyon"],
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/grand-canyon/hero.svg",
        alt: "Grand Canyon sunrise panorama artwork",
      },
      card: {
        src: "/images/grand-canyon/west-rim.svg",
        alt: "Grand Canyon West Rim artwork",
      },
      gallery: [
        {
          src: "/images/grand-canyon/south-rim.svg",
          alt: "Grand Canyon South Rim artwork",
        },
        {
          src: "/images/grand-canyon/helicopter.svg",
          alt: "Grand Canyon helicopter tour artwork",
        },
      ],
    }),
  },
  {
    key: "attraction:hoover-dam",
    imageSet: buildOwnedImageSet({
      hero: {
        src: "/images/hoover-dam/hero.svg",
        alt: "Hoover Dam and Black Canyon artwork",
      },
      card: {
        src: "/images/hoover-dam/engineering.svg",
        alt: "Hoover Dam engineering artwork",
      },
      gallery: [
        {
          src: "/images/hoover-dam/lake-mead.svg",
          alt: "Lake Mead and Hoover Dam artwork",
        },
        {
          src: "/images/hoover-dam/aerial.svg",
          alt: "Hoover Dam aerial route artwork",
        },
      ],
    }),
  },
];

const MEDIA_REGISTRY_BY_KEY = new Map<string, MediaRegistryEntry>();

for (const entry of MEDIA_REGISTRY) {
  MEDIA_REGISTRY_BY_KEY.set(entry.key, entry);
  for (const alias of entry.aliases || []) {
    MEDIA_REGISTRY_BY_KEY.set(alias, entry);
  }
}

export function getMediaRegistryEntry(key: string): MediaRegistryEntry | null {
  return MEDIA_REGISTRY_BY_KEY.get(key) || null;
}

export function getMediaRegistryImageSet(keys: string[]): NodeImageSet | null {
  for (const key of keys) {
    const entry = getMediaRegistryEntry(key);
    if (entry?.imageSet) return entry.imageSet;
  }
  return null;
}
