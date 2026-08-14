# WNO Site-wide Design + Implementation Spec

## Purpose

Make WelcomeToNewOrleansTours.com feel like one premium New Orleans visitor-help product, not a collection of unrelated marketplace pages.

The visual north star is the approved cinematic black/gold homepage concept: richly layered New Orleans artwork, integrated calls to action, elegant serif/script typography, and category discovery that feels embedded in the art rather than appended as a generic grid.

The product north star remains the decision layer:

> Facts determine eligibility. Visitor intent determines ranking. Commercial value only breaks close ties.

The design must reinforce that product model. Every major page should help a visitor decide, act, or reach a human.

---

# 1. Shared design system

## Palette

Use one canonical token set across the WNO app.

```css
--wno-bg: #050505;
--wno-surface: #0b0b0b;
--wno-surface-2: #11100e;
--wno-gold: #c9a86a;
--wno-gold-strong: #d4af37;
--wno-cream: #f5e7c6;
--wno-ivory: #f7f1e7;
--wno-muted: #b8b0a5;
--wno-border: rgba(201,168,106,.42);
--wno-border-soft: rgba(201,168,106,.18);
--wno-overlay: rgba(0,0,0,.62);
```

Do not create page-specific golds, blacks, button systems, or unrelated card languages unless a documented accessibility requirement demands it.

## Typography

Production target:

- Display / major headings: Cormorant Garamond or the current WNO serif if already standardized in the standalone app.
- Script accent: use sparingly for words such as `experience`; one accent per hero maximum.
- Body / UI: Inter or the current standardized WNO sans.
- Navigation, eyebrows, micro-labels: uppercase with controlled letter spacing.

Rules:

- Large cinematic typography is reserved for page heroes and major editorial statements.
- Transactional controls must remain extremely legible.
- Never render critical booking information in script type.

## Shared chrome

One header and one footer across the entire public WNO app.

### Header

Desktop:

- left: Welcome to New Orleans Tours brand mark
- center: Tours / Help Me Choose / Today / Tonight / Compare / Concierge
- right: `CALL OR TEXT` + `504-484-9687`
- sticky after initial scroll
- black or near-black with subtle translucent treatment where appropriate
- thin gold lower rule

Mobile:

- compact logo
- menu trigger
- persistent phone/text action
- no horizontal nav overflow

### Footer

Must preserve commercial/support trust content and provide:

- Tours
- Help Me Choose
- Today
- Tonight
- Compare
- Concierge
- About
- FAQ
- Booking Help
- Cancellation Policy
- Affiliate Disclosure
- Privacy
- Terms
- Accessibility
- phone/text

---

# 2. Shared component architecture

Build a small WNO-specific design layer rather than page-by-page CSS.

Target shared components:

```text
components/wno/
  WnoShell
  WnoHeader
  WnoFooter
  WnoHero
  WnoSectionHeading
  WnoPrimaryCta
  WnoSecondaryCta
  WnoCategoryCard
  WnoExperienceCard
  WnoTrustStrip
  WnoDecisionReason
  WnoComparisonTable
  WnoConciergeCard
  WnoFareHarborFrame
  WnoMobileActionBar
```

Rules:

- Page components consume shared WNO tokens/components.
- Do not duplicate header/footer markup inside route pages.
- Do not make the approved visual design a single flattened image.
- Artwork is presentation; all text, navigation, category links and booking controls remain real HTML.

---

# 3. Homepage implementation

## Goal

The homepage should make the visitor feel New Orleans immediately and establish WNO as the place that helps choose the right experience.

## Above the fold

### Cinematic hero

Desktop composition should closely match the approved mockup:

- full-width New Orleans nighttime artwork
- French Quarter architecture / wrought iron / warm gas-lamp mood
- visual depth rather than a flat dark background
- left-biased content zone so the artwork remains visible
- overlay only as dark as required for text readability

Hero copy:

- eyebrow: `FIND THE RIGHT`
- primary: `NEW ORLEANS`
- script accent: `experience`
- primary continuation: `FOR YOUR GROUP`
- supporting copy explaining WNO can compare local tours, current times/prices and narrow choices

### Three integrated actions

1. `FIND SOMETHING TODAY`
   - supporting line: availability/current options
   - route to Today experience
2. `HELP ME CHOOSE`
   - supporting line: answer a few questions
   - route to decision engine
3. `CALL OR TEXT 504-484-9687`
   - real `tel:` / text action as appropriate
   - analytics event

These should visually feel embedded in the artwork: strong bordered panels, icon + label + supporting line + arrow.

## Category discovery band

Heading:

`EXPLORE NEW ORLEANS YOUR WAY`

Initial eight visual category cards:

1. City Tours
2. Swamps & Airboats
3. River Cruises
4. Plantations
5. Food & Cocktails
6. Ghosts & Cemetery
7. Garden District
8. Jazz / Music

Every card:

- real link
- art-directed portrait/vertical image
- canonical category name
- one short value line
- gold frame / ornamental detail
- visible hover/focus state
- analytics category click

The category registry, not inline homepage literals, should own slug/title/image/description where practical.

## Trust strip

Three initial values:

- Trusted Local Partners
- Curated Experiences
- Local Concierge Support

Below the cinematic discovery block, continue with existing commercial depth rather than ending the page:

- featured/recommended experiences
- comparisons
- situation entry points
- orientation / concierge
- guide/help layer

---

# 4. Tours hub

## Goal

Make `/tours` a curated discovery surface, not a dense inventory dump.

## Structure

1. compact editorial hero using the same black/gold system
2. primary category gallery
3. secondary category/filter controls
4. live product cards grouped by category or visitor intent
5. human-help fallback

## Product cards

Each card should prioritize decision facts visitors care about:

- tour name
- category
- duration
- transport/pickup indicator when verified
- family/mobility indicator when verified
- current booking source / CTA
- concise `Why this fits` cue when surfaced through a decision context

Do not expose unknown claims as badges.

## Inventory rule

The 21 current parent FareHarbor products remain factual commercial center until deliberately expanded.

---

# 5. Help Me Choose

## Goal

This is the flagship product page for the decision engine.

## Visual intensity

Keep the black/gold brand but make the questionnaire calmer than the homepage hero. Functional clarity beats ornament here.

## Flow

Use progressive questions, one decision group at a time where possible:

- available time / duration
- transportation situation
- walking / mobility needs
- family/group composition
- weather/situation
- time of day
- cruise context
- experience preference

## Result state

Return a ranked shortlist, not a giant catalog.

Each result must show:

- recommendation position
- title
- image
- key verified facts
- `Why this fits` reasons from decision engine
- warnings/caveats when present
- booking/fulfillment CTA
- `Want a local to choose for you?` phone/text fallback

The UI must consume the shared decision engine; it may not introduce a second scoring system.

---

# 6. Today

## Goal

Capture high-velocity same-day intent.

## Design

Faster and cleaner than homepage. Still premium, but content density can be higher.

## Structure

1. `What can I do in New Orleans today?` hero
2. current date/context
3. decision shortcuts: time available / group / transport / weather where useful
4. ranked same-day compatible experiences
5. concierge fallback

Never imply live availability unless a real source supports it.

If exact same-day FareHarbor availability is unavailable, language must distinguish `good fit for today` from `available today`.

---

# 7. Tonight

## Goal

Own evening-intent searches and late-planner conversion.

## Visual intensity

This can be one of the most cinematic pages on the site: dark street/jazz/nightlife image treatment is appropriate.

## Primary experience families

When supported by fulfillment:

- river / dinner / jazz cruises
- ghost / cemetery / haunted experiences
- music / jazz
- cocktail / food
- evening walking / city options

## Rules

- current-time claims require verified/current data
- fallback to human help when booking certainty is low
- retain correct canonical/indexable metadata already recovered

---

# 8. Compare

## Goal

Win the high-intent decision query.

## Structure

Comparison hub:

- visual comparison cards grouped by common visitor questions

Comparison detail:

- clear title (`Whitney vs Oak Alley`, etc.)
- shared fact-table comparison
- `Best for` summary
- differences in duration, transportation, walking, family fit, weather exposure, time fit, cruise fit and fulfillment where applicable
- recommendation explanation based on visitor priorities
- booking CTA for each valid option
- human-help fallback

Decoration must never reduce table readability.

---

# 9. Concierge

## Goal

Make human help a first-class product outcome.

## Page hierarchy

1. strong local-help hero
2. Call / Text 504-484-9687
3. Help Me Choose handoff
4. $5 French Quarter Orientation
5. future premium planning products when intentionally launched

Do not promise a $49 or $149 service until the business has intentionally launched and can fulfill it.

Current orientation operational truth must remain intact until intentionally changed.

---

# 10. Tour detail pages

## Goal

Convert confidence into booking while remaining factual.

## Standard template

1. category breadcrumb
2. cinematic but compact tour hero
3. title + operator
4. verified quick facts
5. recommendation context / `Good fit if...`
6. description
7. logistics
8. FareHarbor booking area
9. alternatives / comparison links
10. concierge fallback

All decision badges come from normalized product facts.

---

# 11. FareHarbor integration

## Principle

WNO owns the decision context. FareHarbor fulfills transactions.

## Primary treatment

Use a themed wrapper component around supported FareHarbor embed/lightframe behavior.

```css
.wno-fareharbor-frame {
  border: 1px solid var(--wno-border);
  background: var(--wno-surface);
  padding: 12px;
}
```

The wrapper can match WNO; the embedded FareHarbor interface may retain its own styling.

Do not attempt unsupported cross-origin iframe restyling.

## Usage

- Tour detail / strong transactional contexts: inline or current supported FareHarbor flow when reliable.
- Secondary calls to action: supported lightframe/lightbox where appropriate.
- Today/Tonight: do not replace factual availability logic with a generic iframe and call it `live`.

## Attribution

Preserve current FareHarbor operator/item/flow/ASN attribution exactly unless separately audited and intentionally changed.

---

# 12. Situation + guide pages

Guides should use a shared editorial/decision template rather than bespoke styling.

Common hero / content system for:

- rainy day
- before dinner
- 4-hour / 6-hour windows
- families
- mobility
- cruise
- near French Quarter
- first-time visitor
- weekend

Pages should render product recommendations from shared facts where possible, rather than copying ungoverned product claims into prose.

---

# 13. Mobile behavior

Mobile is not a shrunken desktop mockup.

## Header

- compact header
- menu
- persistent call/text access

## Hero

- preserve New Orleans artwork
- avoid covering all meaningful art with text
- headline roughly 42-52px depending viewport
- CTAs stack vertically
- primary action first

## Categories

Use one of:

- horizontal snap cards with clear affordance, or
- two-column compact art cards

Do not reduce eight categories to tiny unreadable thumbnails.

## Transaction pages

- booking CTA reachable quickly
- no modal interaction that becomes trapped on small screens
- FareHarbor flows tested on actual mobile viewport

---

# 14. Accessibility + performance rules

- text contrast must pass reasonable WCAG AA targets
- all image cards need meaningful alt text or intentional decorative handling
- keyboard focus must be visible
- buttons/links must be semantic HTML
- no text embedded only inside generated artwork
- hero image must have responsive optimized formats
- below-fold category/product images lazy load
- avoid giant uncompressed generated artwork
- target good Core Web Vitals on homepage and money pages

---

# 15. Analytics vocabulary

Track at minimum:

- header_nav_click
- hero_today_click
- hero_choose_click
- hero_phone_click
- category_click
- chooser_started
- chooser_completed
- recommendation_viewed
- recommendation_booking_click
- comparison_viewed
- comparison_booking_click
- fareharbor_opened
- phone_click
- text_click
- orientation_click

Use one event vocabulary; do not create page-specific synonyms for the same action.

---

# 16. Build order

## Phase A — Foundation

1. Create canonical WNO tokens.
2. Build WnoShell / Header / Footer.
3. Build shared CTA, section-heading, category-card, experience-card and trust-strip components.
4. Restore/organize WNO assets inside the standalone app/repo.
5. Ensure mobile shell is stable.

Exit gate: current pages can render through shared shell without commercial behavior changes.

## Phase B — Homepage north star

6. Rebuild homepage to closely match approved cinematic mockup.
7. Wire real Today / Help Me Choose / phone actions.
8. Wire eight category cards to real routes/registry.
9. Add trust strip and below-fold existing commercial modules.
10. Desktop + mobile visual QA.

Exit gate: homepage feels like approved concept and all links/actions work.

## Phase C — Decision surfaces

11. Restyle Help Me Choose and expose decision explanations.
12. Restyle Today.
13. Restyle Tonight.
14. Restyle Compare hub + comparison detail template.
15. Restyle Concierge / orientation entry points.

Exit gate: all primary nav destinations share one visual system and preserve current functionality.

## Phase D — Commerce surfaces

16. Build standard tour-detail template.
17. Apply category/tours hub template.
18. Add consistent FareHarbor wrapper/lightframe treatment.
19. Verify 21 current products and attribution.
20. Add concierge fallback to money pages.

Exit gate: representative booking journeys pass desktop/mobile tests.

## Phase E — Long-tail decision architecture

21. Apply shared guide template to situation/intent pages.
22. Render recommendation modules from normalized facts.
23. Remove duplicate visual/page-specific product logic.
24. Add demand-taxonomy fulfillment expansion.

Exit gate: situation pages are expressions of shared facts/decision logic, not disconnected mini-sites.

## Phase F — Standalone cutover

25. Full preview parity gates from `STANDALONE_CUTOVER_RUNBOOK.md`.
26. Performance/accessibility pass.
27. Schema/canonical/sitemap/robots/AI endpoint pass.
28. Only then repoint production Vercel Git connection to standalone repository.

---

# 17. Non-negotiables

1. Do not flatten the new design into one giant image.
2. Do not change FareHarbor attribution casually.
3. Do not invent availability, accessibility or suitability claims.
4. Do not let commercial margin override materially better visitor fit.
5. Do not create a second decision engine for individual pages.
6. Do not expose DCC styling/routes/entities in WNO.
7. Do not cut over standalone production until parity is green.
8. Keep phone/text visible as a first-class conversion path.
9. Preserve New Orleans atmosphere without sacrificing functional clarity.
10. The homepage is the most cinematic page; transactional pages may use a quieter version of the same design system.

---

# 18. Definition of done

The redesign is complete when:

- a visitor can move from Home -> Help Me Choose -> recommendation -> booking/human help without visual or logic discontinuity;
- Tours, Today, Tonight, Compare and Concierge unmistakably belong to the same brand;
- category and product cards render from governed registries/facts;
- the decision engine remains the recommendation authority;
- phone/text and orientation remain first-class outcomes;
- FareHarbor fulfillment remains correctly attributed;
- desktop and mobile both retain the premium New Orleans character;
- no page depends on a flattened mockup image for navigation or text;
- performance, route, booking, schema and SEO parity gates pass before standalone cutover.
