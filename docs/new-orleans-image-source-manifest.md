# Welcome to New Orleans Tours — Image Source Manifest

Last audit start: 2026-08-09

This file is the source-of-truth checklist for images used by the New Orleans storefront. An image is not considered production-approved merely because it exists in `public/` or looks relevant.

## Production rule

For commerce surfaces (tour cards, tour detail heroes, recommendation cards, category merchandising), prefer imagery in this order:

1. Exact operator/FareHarbor experience photography with documented affiliate/marketing permission.
2. Operator-provided media-kit photography with documented permission.
3. Original photography owned by the site.
4. Properly licensed Wikimedia Commons imagery for editorial/history/landmark context.
5. Properly licensed commercial stock for generic gaps.
6. AI imagery only for clearly decorative/editorial use; never imply it depicts the actual operator, guide, vehicle, vessel, property, or booked experience.

Never use a random Google Images result as a source. Google may be used to discover a source, but the original license/permission must be verified and recorded.

## Required metadata for every production image

- Asset path
- Page/route/component usages
- Experience/content title
- Source/provenance
- Rights/license/permission evidence
- Depiction type: `EXACT`, `REPRESENTATIVE`, `EDITORIAL`, or `UNKNOWN`
- Alt text
- Status: `VERIFIED`, `NEEDS_SOURCE`, `NEEDS_PERMISSION`, `NEEDS_REPLACEMENT`, or `REVIEW`
- Notes/replacement target

No new production image should be added without this information.

## Immediate audit findings

The storefront data currently reuses a small number of generic images across many distinct FareHarbor products. That is acceptable only when the imagery is genuinely representative and does not imply the wrong operator/property/vessel. Several current assignments need replacement.

| Experience | Current storefront image | Depiction | Status | Required action |
|---|---|---:|---|---|
| City Tour Of New Orleans — Southern Style | `/images/travel-markets/new-orleans/french-quarter-street.jpg` | REPRESENTATIVE | REVIEW | Prefer Southern Style actual city-tour/operator imagery if permitted. |
| Oak Alley Or Laura Plantation Tour — Southern Style | `/images/travel-markets/new-orleans/french-quarter-street.jpg` plus Oak Alley Wikimedia detail imagery | REPRESENTATIVE | REVIEW | Prefer operator imagery. If Oak Alley image is shown, retain clear representative disclosure because selected site may be Laura. |
| Covered Tour Boat — Ragin Cajun | `/images/travel-markets/new-orleans/covered-boat-swamp.png` | UNKNOWN | NEEDS_SOURCE | Verify origin/rights and whether vessel actually represents Ragin Cajun. |
| Ragin Cajun Airboat Options | `/images/travel-markets/new-orleans/airboat-swamp.png` | UNKNOWN | NEEDS_SOURCE | Verify origin/rights and whether airboat represents Ragin Cajun. |
| All-Day City + Plantation — Southern Style | `/images/travel-markets/new-orleans/french-quarter-street.jpg` | REPRESENTATIVE | NEEDS_REPLACEMENT | Replace with actual operator image or an accurate city + plantation composition. Current single city image does not sell the full experience. |
| Covered Boat + Plantation — Ragin Cajun | `/images/travel-markets/new-orleans/covered-boat-swamp.png` | REPRESENTATIVE | NEEDS_REPLACEMENT | Use accurate combination imagery or actual operator product photography. |
| Evening Jazz Cruise | `/images/travel-markets/new-orleans/steamboat-natchez.jpg` | LIKELY EXACT/REPRESENTATIVE | REVIEW | Confirm vessel/product match and rights. Keep only where factually appropriate. |
| Daytime Jazz Cruise | `/images/travel-markets/new-orleans/steamboat-natchez.jpg` | LIKELY EXACT/REPRESENTATIVE | REVIEW | Confirm vessel/product match and rights. |
| Sunday Jazz Brunch Cruise | `/images/travel-markets/new-orleans/steamboat-natchez.jpg` | LIKELY EXACT/REPRESENTATIVE | REVIEW | Prefer brunch-specific operator photo if available; confirm rights. |
| Oak Alley Plantation Tour — Gray Line | `/images/travel-markets/new-orleans/french-quarter-street.jpg` in central storefront data | WRONG/GENERIC | NEEDS_REPLACEMENT | Replace with exact Oak Alley/Gray Line imagery or correctly licensed Oak Alley representative image. |
| Whitney Plantation Tour — Gray Line | `/images/travel-markets/new-orleans/french-quarter-street.jpg` in central storefront data | WRONG/GENERIC | NEEDS_REPLACEMENT | Replace with Whitney-specific/operator imagery. Never use Oak Alley as if it depicts Whitney. |
| Swamp & Bayou Tour — Gray Line | `/images/travel-markets/new-orleans/covered-boat-swamp.png` | UNKNOWN | NEEDS_SOURCE | Verify source/rights and vessel accuracy; prefer product photography. |
| Small Airboat Swamp Adventure — Gray Line | `/images/travel-markets/new-orleans/airboat-swamp.png` | UNKNOWN | NEEDS_SOURCE | Verify source/rights and vessel accuracy; prefer product photography. |
| Large Airboat Swamp Adventure — Gray Line | `/images/travel-markets/new-orleans/airboat-swamp.png` | UNKNOWN | NEEDS_SOURCE | Verify source/rights and vessel accuracy; preferably distinguish small vs. large airboat visually. |
| Swamp Boat and Oak Alley Combination | `/images/travel-markets/new-orleans/french-quarter-street.jpg` | WRONG/GENERIC | NEEDS_REPLACEMENT | Use actual combo image or accurate swamp + Oak Alley composition. |
| Swamp Boat and Whitney Combination | `/images/travel-markets/new-orleans/french-quarter-street.jpg` | WRONG/GENERIC | NEEDS_REPLACEMENT | Use actual combo image or accurate swamp + Whitney composition. |
| Cocktail Walking Tour — Gray Line | `/images/travel-markets/new-orleans/french-quarter-street.jpg` in central storefront; historic French Market image is rendered on at least one recommendation/detail surface | WRONG | NEEDS_REPLACEMENT | Replace all commerce usages with cocktail/French Quarter bar/operator-tour photography. Historic French Market image must not merchandise this tour. |
| Craft Cocktail Walking Tour — Gray Line | `/images/travel-markets/new-orleans/french-quarter-street.jpg` in central storefront; historic French Market image is rendered on at least one recommendation/detail surface | WRONG | NEEDS_REPLACEMENT | Replace all commerce usages with craft-cocktail/operator-tour photography. |
| Ghosts & Spirits Walking Tour — Gray Line | `/images/travel-markets/new-orleans/french-quarter-street.jpg` in central storefront; historic/haunted imagery may appear on detail surfaces | REPRESENTATIVE | REVIEW | Prefer operator night-tour imagery; historic LaLaurie imagery is acceptable editorially if accurately captioned and licensed. |
| City, Cemetery and Garden District Tour — Gray Line | `/images/travel-markets/new-orleans/french-quarter-street.jpg` | REPRESENTATIVE | REVIEW | Prefer exact/operator photography or a city + cemetery + Garden District composition. |
| CITY of NEW ORLEANS Riverboat Cruise | `/images/travel-markets/new-orleans/steamboat-natchez.jpg` | POTENTIALLY WRONG VESSEL | NEEDS_REPLACEMENT | Do not use a clearly Natchez-specific image to sell CITY of NEW ORLEANS unless the operator confirms that image accurately represents the booked vessel/product. Prefer CITY of NEW ORLEANS photography. |

## Current New Orleans travel-market assets

These files exist in `public/images/travel-markets/new-orleans/`. Presence does not establish origin or permission.

| Asset | Source status | Production status | Notes |
|---|---|---|---|
| `airboat-swamp.png` | NEEDS_SOURCE | REVIEW | Used across multiple airboat products. Verify source and exact/representative nature. |
| `covered-boat-swamp.png` | NEEDS_SOURCE | REVIEW | Used across multiple swamp/covered-boat products. |
| `french-quarter-street.jpg` | NEEDS_SOURCE | REVIEW | Widely reused generic city image. Appropriate for some editorial/city contexts, not as universal tour art. |
| `hotel-pickup-airboat.png` | NEEDS_SOURCE | REVIEW | Verify source, rights, operator/product depiction, and actual usage. |
| `hotel-pickup-swamp-boat.png` | NEEDS_SOURCE | REVIEW | Verify source, rights, operator/product depiction, and actual usage. |
| `louisiana-bayou-swamp.jpg` | NEEDS_SOURCE | REVIEW | Likely editorial/representative landscape; verify origin/license. |
| `new-orleans-live-music.jpg` | NEEDS_SOURCE | REVIEW | Verify origin/license and usage. |
| `small-group-airboat.png` | NEEDS_SOURCE | REVIEW | Verify origin/license and product/operator specificity. |
| `steamboat-natchez.jpg` | NEEDS_SOURCE | REVIEW | Confirm origin/permission and restrict to products where Natchez depiction is accurate. |
| `swamp-boat.png` | NEEDS_SOURCE | REVIEW | Verify origin/license and product/operator specificity. |
| `swamp-plantation-combo.png` | NEEDS_SOURCE | REVIEW | Use only for combinations matching both pictured components; never for city + plantation. |

## Current Wikimedia originals

These files exist in `public/images/wikimedia/originals/`. Each must retain per-file source URL, creator, license, attribution requirements, and any changes made. Do not assume every Commons file has the same license.

| Asset | Appropriate use | Commerce status |
|---|---|---|
| `above-ground-tomb.jpg` | Cemetery/history editorial; representative city/cemetery context | REVIEW before tour merchandising |
| `french-market-historic.jpg` | French Market/history/editorial context | **DO NOT use to merchandise cocktail tours** |
| `french-quarter-night.jpg` | French Quarter/nightlife/editorial; possibly representative walking-tour context | REVIEW |
| `gumbo-dish.jpg` | Food/culture editorial | REVIEW |
| `lalaurie-mansion-1906.jpg` | Haunted/history editorial context | REVIEW; label accurately |
| `new-orleans-map-1880.jpg` | History/editorial/map context | REVIEW |
| `oak-alley-front.jpg` | Oak Alley editorial/representative context | REVIEW; never imply Whitney or Laura |
| `st-louis-cemetery-1-gates.jpg` | Cemetery/history context | REVIEW |
| `stew-cooking.jpg` | Food/culture editorial | REVIEW |

## FareHarbor/operator replacement workflow

For every `NEEDS_REPLACEMENT` commerce image:

1. Identify the exact FareHarbor item / product and operator.
2. Check the operator's FareHarbor listing photos and/or official media kit.
3. Record the photo source and original source URL internally.
4. Confirm that our affiliate/marketing arrangement permits republishing the image on our own site. If permission is not explicit, obtain written operator/FareHarbor permission before copying the asset.
5. Download/store an approved production copy rather than depending on an unstable hotlink unless the approved integration specifically expects a remote URL.
6. Record creator/operator, permission/license, date acquired, exact product represented, and any attribution requirements.
7. Add descriptive alt text tied to what is actually visible.
8. QA desktop and mobile crop before production.

## Component/route audit requirement

The central `app/new-orleans/tours/pageConfig.ts` image assignment is only one layer. Before this audit is closed, scan all New Orleans code paths for rendered `<Image>`, `<img>`, CSS background images, metadata/OpenGraph images, and image helper mappings, including:

- Homepage
- `/tours`
- Tour detail pages
- `Also Consider` / related-tour cards
- Help Me Choose / recommendation results
- Category/anchor merchandising
- Concierge pages
- Editorial/guide pages
- OpenGraph/social metadata
- Mobile-only or breakpoint-specific image overrides

Every discovered usage must map back to an entry in this manifest. The visible historic French Market image on a cocktail recommendation proves that at least one rendering layer overrides or supplements the central `imageUrl`, so the audit must not stop at `pageConfig.ts`.

## Acceptance criteria

The image audit is complete only when:

- Every New Orleans image file and every rendered New Orleans image usage has a recorded source/provenance.
- Every commercial tour surface uses an exact or defensibly representative image.
- No card implies the wrong vessel, plantation, operator, vehicle, or experience.
- Cocktail tours visibly read as cocktail experiences at a glance.
- Whitney imagery is Whitney-specific or neutrally representative and never presented as Oak Alley.
- CITY of NEW ORLEANS imagery does not misleadingly depict NATCHEZ as the booked vessel.
- Combination-tour imagery represents both advertised components or uses exact operator product photography.
- Wikimedia attribution/license requirements are documented per file.
- Unknown provenance is resolved before an image is considered production-approved.
- Desktop and mobile crops are checked.

## Do not deploy image replacements yet

This manifest intentionally separates audit/provenance work from replacement work. Replace imagery only after the source and rights for each proposed replacement are documented here.
