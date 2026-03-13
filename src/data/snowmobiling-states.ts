export type SnowmobilingState = {
  slug: string;
  name: string;
  trailMilesNote: string;
  status: "verified";
  authorityName: string;
  officialUrl: string;
  trailMapUrl: string;
  topAreas: string[];
  permitNote: string;
  updatedAt: string;
};

export const SNOWMOBILING_STATES: SnowmobilingState[] = [
  {
    slug: "michigan",
    name: "Michigan",
    trailMilesNote: "About 6,500 miles of designated trails",
    status: "verified",
    authorityName: "Michigan Department of Natural Resources",
    officialUrl: "https://www.michigan.gov/dnr/things-to-do/snowmobiling/where",
    trailMapUrl: "https://www.michigan.gov/dnr/things-to-do/snowmobiling/snowmobile-maps-in-list-format",
    topAreas: ["Upper Peninsula", "Ironwood", "Munising", "Newberry"],
    permitNote:
      "Use the Michigan DNR snowmobiling pages for current permits, closures, and route conditions before publishing trip-specific guidance.",
    updatedAt: "2026-03-11",
  },
  {
    slug: "minnesota",
    name: "Minnesota",
    trailMilesNote: "Over 22,000 miles of groomed snowmobile trails",
    status: "verified",
    authorityName: "Minnesota Department of Natural Resources",
    officialUrl: "https://www.dnr.state.mn.us/snowmobiling/index.html",
    trailMapUrl: "https://www.dnr.state.mn.us/snowmobiling/interactive_map",
    topAreas: ["Iron Range", "Brainerd Lakes", "North Shore"],
    permitNote:
      "Check the Minnesota DNR site for current registration, trail pass, and in-season conditions before turning this into buyer guidance.",
    updatedAt: "2026-03-11",
  },
  {
    slug: "wisconsin",
    name: "Wisconsin",
    trailMilesNote: "Large statewide network with official county-based trail management",
    status: "verified",
    authorityName: "Wisconsin Department of Natural Resources",
    officialUrl: "https://dnr.wisconsin.gov/topic/Snowmobile",
    trailMapUrl: "https://dnr.wisconsin.gov/topic/Snowmobile/trails",
    topAreas: ["Vilas County", "Oneida County", "Sawyer County", "Bayfield County"],
    permitNote:
      "Wisconsin DNR currently lists a $50 nonresident trail pass. Recheck the official trail-pass page before publishing fees or booking guidance.",
    updatedAt: "2026-03-11",
  },
  {
    slug: "maine",
    name: "Maine",
    trailMilesNote: "Large interconnected ITS trail network",
    status: "verified",
    authorityName: "Maine Snowmobile Association",
    officialUrl: "https://www.mainesnowmobileassociation.com/the-its-map/",
    trailMapUrl: "https://www.mainesnowmobileassociation.com/the-its-map/",
    topAreas: ["Aroostook County", "Katahdin region", "ITS corridor network"],
    permitNote:
      "Use the Maine Snowmobile Association trail resources and state registration guidance before publishing exact permit pricing or route recommendations.",
    updatedAt: "2026-03-11",
  },
];
