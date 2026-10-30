# Published swamp-tour pages: search indexing repair

## Confirmed production defect

On October 30, 2026, HTTPS requests to the DCC custom domain returned HTTP 200
with `X-Robots-Tag: noindex, nofollow` for both:

- `/new-orleans-swamp-tours`
- `/guides/new-orleans-airboat-vs-covered-swamp-boat`

Both pages have self-referencing canonical URLs and HTML `robots=index, follow`.
The production sitemap lists the swamp hub and published guides. The stricter
HTTP header prevents indexing despite those positive signals.

The proxy uses `isIndexableSurfacePath`; the coordinate-only allowlist omitted
the published swamp cluster. This is a confirmed indexing blocker for these
pages, not a complete diagnosis of network-wide traffic or historical sales.

## Change

Explicitly allow the existing swamp hub, its six decision guides, the guides
index, and New Orleans guide category. The proxy and sitemap already consume
the shared allowlist, so no routing, checkout, domain, or payment changes are
needed. Unknown guides, utility routes, and other unpromoted pages stay excluded.

## Validation and release

- The focused regression fails on the original allowlist and passes with this
  change. It checks every guide actually linked from the swamp hub, exclusions,
  uniqueness, and preservation of existing coordinate/public routes.
- The proxy indexability suite also asserts `index, follow` for all nine paths.
- Full repository checks and a production build must pass before release.
- After release, verify HTTPS/custom-host redirects, robots.txt and sitemap,
  and response headers for the nine paths. Check that unknown guides remain
  excluded and the existing Welcome to the Swamp booking handoff still works.
- This makes pages eligible for indexing; it does not establish that Google has
  indexed them, ranked them, or sent additional visitors.
