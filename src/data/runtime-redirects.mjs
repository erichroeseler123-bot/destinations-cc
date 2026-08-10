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
    source: "/things-to-do-today",
    destination: "/things-to-do-in-new-orleans-today",
    permanent: true,
  },
  {
    source: "/tours-tonight",
    destination: "/new-orleans-tours-tonight",
    permanent: true,
  },
];

export function buildRuntimeRedirects() {
  return DCC_RUNTIME_REDIRECTS;
}
