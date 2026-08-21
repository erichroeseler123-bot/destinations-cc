const DCC_RUNTIME_REDIRECTS = [
  {
    source: "/book/red-rocks",
    destination: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
    permanent: true,
  },
  {
    source: "/book/red-rocks-amphitheatre",
    destination: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
    permanent: true,
  },
  {
    source: "/book/red-rocks-amphitheatre/private",
    destination: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private",
    permanent: true,
  },
  {
    source: "/best-transportation-options-denver-to-red-rocks",
    destination: "/red-rocks-transportation",
    permanent: true,
  },
  {
    source: "/denver-concert-shuttle",
    destination: "/red-rocks-transportation",
    permanent: true,
  },
  {
    source: "/red-rocks/transportation",
    destination: "/red-rocks-transportation",
    permanent: true,
  },
  {
    source: "/red-rocks/parking",
    destination: "/red-rocks-parking",
    permanent: true,
  },
  {
    source: "/checkout",
    has: [
      {
        type: "query",
        key: "route",
        value: "parr-private",
      },
    ],
    destination: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private",
    permanent: true,
  },
  {
    source: "/categories/french-quarter-tours",
    destination: "/areas/french-quarter",
    permanent: true,
  },
  {
    source: "/categories/swamp-tours",
    destination: "/swamp-tours",
    permanent: true,
  },
  {
    source: "/categories/airboat-tours",
    destination: "/airboat-tours",
    permanent: true,
  },
  {
    source: "/categories/covered-swamp-boat-tours",
    destination: "/covered-swamp-boat-tours",
    permanent: true,
  },
  {
    source: "/categories/plantation-tours",
    destination: "/plantation-tours",
    permanent: true,
  },
  {
    source: "/categories/city-tours",
    destination: "/city-tours",
    permanent: true,
  },
  {
    source: "/how-we-rank-tours",
    destination: "/about",
    permanent: true,
  },
  {
    source: "/how-to-choose-the-best-new-orleans-swamp-tour",
    destination: "/compare/covered-swamp-boat-vs-airboat",
    permanent: true,
  },
  {
    source: "/best-new-orleans-swamp-tour",
    destination: "/swamp-tours",
    permanent: true,
  },
  {
    source: "/guides/best-new-orleans-swamp-tour",
    destination: "/swamp-tours",
    permanent: true,
  },
  {
    source: "/things-to-do-today",
    destination: "/guides/things-to-do-in-new-orleans-today",
    permanent: true,
  },
  {
    source: "/tours-tonight",
    destination: "/guides/new-orleans-tours-tonight",
    permanent: true,
  },
  {
    source: "/high-intent-tours",
    destination: "/guides/plan-new-orleans-tours",
    permanent: true,
  },
  {
    source: "/things-to-do-in-new-orleans-today",
    destination: "/guides/things-to-do-in-new-orleans-today",
    permanent: true,
  },
  {
    source: "/new-orleans-tours-tonight",
    destination: "/guides/new-orleans-tours-tonight",
    permanent: true,
  },
  {
    source: "/4-hours-in-new-orleans",
    destination: "/guides/4-hours-in-new-orleans",
    permanent: true,
  },
  {
    source: "/first-time-new-orleans-tours",
    destination: "/guides/first-time-new-orleans-tours",
    permanent: true,
  },
  {
    source: "/new-orleans-tours-for-families",
    destination: "/guides/new-orleans-tours-for-families",
    permanent: true,
  },
  {
    source: "/best-swamp-tour-with-transportation",
    destination: "/guides/best-swamp-tour-with-transportation",
    permanent: true,
  },
  {
    source: "/new-orleans-tours-with-transportation",
    destination: "/guides/new-orleans-tours-with-transportation",
    permanent: true,
  },
  {
    source: "/new-orleans-plantation-and-swamp-tour",
    destination: "/guides/new-orleans-plantation-and-swamp-tour",
    permanent: true,
  },
  {
    source: "/things-to-do-before-a-cruise-new-orleans",
    destination: "/guides/things-to-do-before-a-cruise-new-orleans",
    permanent: true,
  },
  {
    source: "/things-to-do-after-a-cruise-new-orleans",
    destination: "/guides/things-to-do-after-a-cruise-new-orleans",
    permanent: true,
  },
];

export function buildRuntimeRedirects() {
  return DCC_RUNTIME_REDIRECTS;
}
