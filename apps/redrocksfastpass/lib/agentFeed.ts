type AgentFeedEntry = {
  path: string;
  title: string;
  description: string;
  topics: string[];
};

const ENTRIES: AgentFeedEntry[] = [
  {
    path: "/",
    title: "Red Rocks Fast Pass home",
    description:
      "Mobile-first express shuttle booking for quick Red Rocks visits from Downtown Denver.",
    topics: ["red-rocks", "denver", "shuttle", "express-loop"],
  },
  {
    path: "/checkout",
    title: "Red Rocks Fast Pass checkout",
    description:
      "Short checkout flow for reserving a Red Rocks Fast Pass loop with DCC handoff attribution.",
    topics: ["checkout", "red-rocks", "mobile-booking"],
  },
];

export function listRedRocksFastPassAgentPaths() {
  return ENTRIES.map((entry) => entry.path);
}

export function getRedRocksFastPassAgentFeed(path: string) {
  const normalized = path === "/checkout" ? "/checkout" : "/";
  const entry = ENTRIES.find((item) => item.path === normalized);
  if (!entry) return null;

  return {
    siteId: "redrocksfastpass",
    path: entry.path,
    url: `https://redrocksfastpass.com${entry.path === "/" ? "" : entry.path}`,
    title: entry.title,
    description: entry.description,
    topics: entry.topics,
    network: {
      authority: "https://www.destinationcommandcenter.com/red-rocks-shuttle",
      relatedSites: [
        "https://www.partyatredrocks.com",
        "https://www.destinationcommandcenter.com",
      ],
    },
  };
}
