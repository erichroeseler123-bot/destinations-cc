# City Gauntlet

This is the required path for any DCC city node that is being added, promoted, or refreshed.

Use it for:
- brand-new city rollouts
- older city upgrades
- satellite-facing city nodes that need to consume the same DCC standards
- category and tour-vertical pages that inherit city context and live inventory

The rule is simple: a city is not "done" because it exists. It is done when it passes the full gauntlet.

## Status Levels

- `planned`: exists in backlog or data, not ready for promotion
- `in-progress`: being upgraded now
- `live`: safe to surface in DCC registry and discovery
- `improving`: live, but still needs content/media/feed quality work
- `needs-work`: live enough to resolve, not good enough to feature

## Gate 1: Registry

Required:
- rollout entry exists in `src/data/city-rollout-priority.ts`
- city registry node resolves in `src/data/cities-registry.ts`
- slug is canonical and stable
- state, timezone, centroid, and supported modes exist in `data/cities/index.json`

Pass when:
- the city resolves cleanly in search/discovery data
- the canonical route is unambiguous

## Gate 2: Manifest

Required:
- city manifest exists at `data/cities/[slug].json`
- hero title is present
- summary is present
- trust line is present
- categories are present
- attractions are present
- FAQ block exists

Pass when:
- the page has a real structure and does not read like a stub

## Gate 3: Media

Required:
- a `city:[slug]` entry exists in `src/data/media-registry.ts`
- hero image is wired in the city manifest
- alt text is specific
- source and license metadata are tracked
- image URLs are direct and reliable

Preferred source order:
1. owned/local assets
2. provider-native assets where appropriate
3. Wikimedia Commons direct URLs
4. Unsplash filler only if needed

Pass when:
- the page does not render with a blank hero
- the image source is rights-safe and reproducible

## Gate 4: Specificity

Required:
- hero copy is city-specific, not template-generic
- at least 3 local hooks are visible on-page
- attraction blurbs feel native to the city
- fallback queries are city-specific
- FAQs answer actual trip-structure questions

Pass when:
- the page feels like a real city guide, not just a slug with modules

## Gate 5: Live Layer

Required:
- `next48` or live-city support has been checked for the city
- any city-specific feeds/fallbacks have been tested
- no obviously fake-live or stale module is left visible

Pass when:
- live modules either work or safely downgrade

Notes:
- not every city needs strong live inventory on day one
- every city does need honest fallback behavior

## Gate 6: Verification

Required:
- `npm run build` passes
- production deploy reaches `Ready`
- production alias resolves
- live page has been checked in a real browser session

Pass when:
- the page looks correct on production, not just in local build output

## Promotion Rules

Only promote a city into stronger homepage or `/cities` visibility when:
- Gates 1-4 are complete
- Gate 6 has at least one live visual confirmation

Do not spotlight a city that still feels thin or generic.

## Batch Rules

- work in batches of 2 to 5 cities
- finish the same gate across the whole batch
- deploy
- verify live
- only then move to the next batch

This keeps rollout clean and makes regressions easy to spot.

## Current Default Workflow

1. Add or confirm rollout registry coverage.
2. Confirm manifest quality.
3. Add one strong hero image and one card image.
4. Sharpen hero copy, trust line, categories, attractions, and FAQs.
5. Build locally.
6. Deploy.
7. Verify the live page visually.
8. Mark the city in the tracker.

## Definition Of Done

A city is "done for now" when:
- it is live in registry
- it has non-generic copy
- it has real imagery
- it does not expose blank or fake-live sections
- it has been visually checked on production

That is the standard for both new cities and upgrades to older cities.

## Category Page Pattern

Tour-category pages use the same discipline, but with three extra rules:

1. hero cannot open dead
- inherit the city hero if no category-specific hero exists yet
- do not leave the page as a text-only wall

2. inventory must lead
- put the tour grid near the top, directly after the hero
- do not bury high-intent listings below long explainer sections

3. relevance beats volume
- if live inventory is not clearly category-matched, filter it harder
- if filtering removes the junk and leaves nothing useful, show clean fallback intents instead of irrelevant products

Pass when:
- the page opens visually
- top listings sit above the explainer content
- no obvious junk inventory survives in the lead cards
