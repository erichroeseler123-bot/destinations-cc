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
];

export function buildRuntimeRedirects() {
  return DCC_RUNTIME_REDIRECTS;
}
