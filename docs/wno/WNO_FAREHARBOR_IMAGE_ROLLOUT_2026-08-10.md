# WelcomeToNewOrleansTours.com — FareHarbor Image Governance + Rollout

**Date:** 2026-08-10  
**Goal:** Replace generic or weak commerce imagery with product-accurate, rights-cleared imagery while preserving truthful fallbacks and existing booking flows.

## Confirmed operator permissions

The site owner has confirmed image-use permission for these WNO operator relationships:

- **Gray Line / New Orleans Steamboat Company** — approved for operator-direct commerce imagery.
- **Ragin Cajun Tours / Ragin Randy** — approved for operator-direct commerce imagery.
- **Southern Style Tours** — approved for operator-direct commerce imagery.

These operators should no longer be treated as waiting on image-rights approval. Product-accurate assets from these approved operator sources may be added to the governed product image registry as they are collected and matched to the correct tour.

FareHarbor also confirmed separately that FHDN affiliates may use images in the FareHarbor Marketplace. That is an additional rights path; it does not replace the direct operator permissions above.

## Source-of-truth policy

Commercial product imagery must be governed at the product registry layer, never patched independently page-by-page.

Allowed image sources:

1. **FareHarbor Marketplace** — allowed when WNO's applicable FHDN/affiliate relationship authorizes marketplace image use for the product.
2. **Operator Direct** — allowed when the operator has granted image usage rights or FareHarbor/operator partnership terms explicitly cover the image. Gray Line/New Orleans Steamboat Company, Ragin Cajun Tours, and Southern Style Tours are currently confirmed approved operator-direct sources for WNO.
3. **Wikimedia Commons / public-domain editorial** — allowed only when license/attribution requirements are satisfied and the image is accurate enough for the subject.
4. **Local editorial asset** — allowed only when provenance/rights are known.
5. **Text-only fallback** — required when no product-accurate rights-cleared image exists.

Do not use random stock imagery to imply it depicts a specific bookable tour.

## Required product image fields

Every commerce image record should support these fields:

```ts
export type CommerceImageSource =
  | "FareHarbor Marketplace"
  | "Operator Direct"
  | "Wikimedia Commons"
  | "Local Editorial";

export type ImageRightsStatus =
  | "approved"
  | "pending"
  | "not-approved";

export interface CommerceImageRecord {
  url: string;
  alt: string;
  source: CommerceImageSource;
  rightsStatus: ImageRightsStatus;
  rightsBasis?:
    | "FHDN marketplace authorization"
    | "operator image agreement"
    | "direct partnership authorization"
    | "Creative Commons"
    | "public domain"
    | "owned/local";
  operatorName?: string;
  fareHarborCompanyShortname?: string;
  fareHarborItemId?: string;
  sourceUrl?: string;
  evidenceNote?: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
}
```

### Rendering rule

A commercial card/detail hero may render an image only when `rightsStatus === "approved"`.

Precedence:

1. approved FareHarbor Marketplace product image
2. approved Operator Direct product image
3. approved product-specific Wikimedia image
4. approved local/editorial image only when it does not misrepresent the specific experience
5. text-only fallback

For combo products, do not show an image of only one component unless the record explicitly states that the image accurately represents the marketed combined experience.

## Existing architecture to preserve

The current WNO system already centralizes product images in `app/new-orleans/data/imageRegistry.ts` and resolves them through `app/new-orleans/lib/imageResolver.ts`. Preserve this structure.

Do not add a second product-image registry.

`pageConfig.ts` may retain `imageUrl` temporarily for compatibility, but the commerce UI should continue to resolve through the governed image registry rather than trust `imageUrl` blindly.

## Migration status vocabulary

For each of the 21 live storefront products, assign exactly one status:

- **FH-APPROVED** — FareHarbor Marketplace image authorized and mapped.
- **OPERATOR-APPROVED** — direct/operator-authorized image mapped.
- **LICENSED-EDITORIAL** — accurate licensed editorial image is intentionally used.
- **NEEDS-FH-IMAGE** — product is bookable but should be upgraded with authorized FareHarbor imagery.
- **TEXT-ONLY** — intentionally no commerce image until an accurate authorized asset exists.

## 21-product audit worksheet

For every `STOREFRONT_PRODUCTS` item capture:

- slug
- product title
- operator
- FareHarbor company shortname
- item ID / booking variant IDs
- current image URL
- current image source
- current rights basis
- current image accuracy (exact product / representative / generic)
- target image source
- target image URL
- target rights basis
- migration status
- notes

For Gray Line/New Orleans Steamboat Company, Ragin Cajun Tours, and Southern Style Tours, operator-rights status is already approved; the remaining work is product-to-image matching and asset intake, not permission collection.

## Page-by-page rollout

### Phase 1 — Core commerce surfaces

Update first:

1. `/tours`
2. `/tours/[slug]`
3. homepage product/experience cards that resolve to live products
4. live category hubs:
   - city tours
   - swamp tours
   - airboat tours
   - covered swamp boat tours
   - plantation tours
   - riverboat cruises
   - ghost tours
   - food/cocktail tours

Acceptance criteria:

- no broken images
- no image shown for an unapproved rights record
- product cards and detail pages resolve the same governed image
- alt text names the subject honestly and does not imply unsupported inclusions
- booking URLs/attribution remain unchanged

### Phase 2 — Decision surfaces

Update:

- `/compare` and `/compare/*`
- `/help-me-choose`
- high-intent `/guides/*` pages containing product cards
- Today/Tonight product recommendations

Acceptance criteria:

- image source remains consistent with core commerce surfaces
- no separate hard-coded tour image overrides
- comparison cards do not accidentally depict the wrong operator/product

### Phase 3 — Marketing surfaces

Update only after commerce surfaces are correct:

- OG/social images derived from product assets
- category hero imagery
- itinerary pages
- cruise/group landing pages

Editorial hero imagery may remain broader than product imagery, but must never be presented as the exact bookable tour unless it is.

## FareHarbor / operator asset intake workflow

For each live product:

1. locate the product in the approved operator/FareHarbor inventory
2. record the operator + product/item identity
3. select the strongest accurate image, prioritizing recognizable experience/vehicle/vessel/site imagery
4. store or reference the asset using the site's approved asset pipeline
5. add the image to `PRODUCT_IMAGES`
6. set source and rights metadata
7. for the three confirmed operators above, set direct operator imagery to approved once the asset is verified to belong to the correct product
8. verify card + detail rendering
9. verify booking attribution still points to the approved FareHarbor link

Do not scrape arbitrary unrelated third-party sites as an image source.

## Visual quality rules

Prefer:

- clear subject
- daylight or well-exposed night imagery
- real vessel/vehicle/site/activity where possible
- landscape crops that work on mobile and desktop
- images without embedded promotional text/logos unless operator-supplied and visually appropriate

Avoid:

- unrelated French Quarter stock imagery on plantation/swamp products
- generic alligator imagery when the product is primarily a boat format
- historical images on shopping cards when they could be mistaken for current product imagery
- the same hero repeated across many unrelated products unless it is legitimately the same vessel/product family

## Automated test requirements

Add/extend tests so that:

1. every rendered commerce image has `rightsStatus: "approved"`
2. FareHarbor Marketplace images include an explicit rights basis
3. `pending` / `not-approved` images resolve to null/text fallback
4. the four combo products remain text-only unless a product-accurate approved image is added
5. every live product has either an approved image or an explicit migration/fallback status
6. no product card bypasses `resolveProductImage`
7. operator-direct assets for Gray Line/New Orleans Steamboat Company, Ragin Cajun Tours, and Southern Style Tours can be accepted without a redundant pending-rights state

## QA checklist

For mobile (390px) and desktop:

- homepage
- `/tours`
- one city tour detail
- one swamp detail
- one airboat detail
- one plantation detail
- one river cruise detail
- one ghost/cocktail detail
- one comparison page
- Help Me Choose result cards

Check:

- crop quality
- loading/no layout jump
- alt text
- attribution where legally required
- correct product/operator match
- no accidental stock/fallback regressions
- no FareHarbor CTA changes
- no double analytics events

## Deployment order

1. land governance fields + tests
2. migrate already-authorized operator images into the explicit schema
3. inventory all 21 products
4. collect and map product-specific images from approved Gray Line, Ragin Cajun, Southern Style, and eligible FareHarbor Marketplace sources
5. preview deploy
6. perform visual + booking-path QA
7. merge only after preview is READY
8. production smoke test on WNO host

## Commercial objective

The goal is not merely prettier pages. Product-accurate imagery should improve trust and click-through while keeping image rights auditable. The image layer must remain subordinate to booking truth: no asset change may alter or obscure the operator, booking destination, attribution source, or product identity.
