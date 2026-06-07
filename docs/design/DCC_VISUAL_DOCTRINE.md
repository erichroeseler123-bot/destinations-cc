# DCC Visual Doctrine

## Design Gravity

DCC is the command surface for the network. Satellite/customer nodes are not DCC clones, but they must clearly belong to the same governed system.

The governing rule is:

- DCC core pages use exact DCC chrome.
- Satellite nodes use the governed BrandShell with their own local hue, voice, and utility.
- No public customer page should rely on accidental root layout inheritance.
- No page should invent a one-off visual system when a Theme Governor rule can define the behavior.

The Theme Governor controls typography, spacing, cards, buttons, headers, footers, trust strips, mobile behavior, disclosure styling, grid rules, and anti-orphan layout behavior.

Each node controls identity: display name, hue, domains, nav labels, CTA copy, footer trust line, commercial routes, and local tone.

## Mobile-First Execution Doctrine

The network is not desktop-first. DCC and all satellite nodes are used in real-world travel conditions: low battery, low signal, glare, crowds, parking lots, docks, hotels, venues, airports, and people trying to act quickly.

Mobile is the core engine. Desktop is the graceful extension.

### 1. One-Thumb Rule

- Primary CTAs must be reachable in the lower third of mobile screens.
- Critical booking, request, and compare actions should have sticky bottom behavior where appropriate.
- Minimum button height: 48px.
- CTAs must be full-width or easily thumb-reachable on mobile.

### 2. Utility Header Rule

- Mobile headers must be compact utility bars.
- Header should communicate:
  - brand/node
  - active location/context
  - status, availability, or route confidence if relevant
- No oversized logos that waste vertical space.

### 3. Absolute Zero Overflow

- No accidental horizontal scroll.
- All node layouts must pass iPhone SE and 390px viewport checks.
- Cards, grids, media, buttons, and nav pills must stay inside the viewport.
- Horizontal scroll is only allowed for intentional carousels.

### 4. Street-Level Readability

- Use high contrast.
- No tiny gray text on dark backgrounds.
- Use governed typography:
  - Plus Jakarta-style readable sans
  - JetBrains Mono-style labels and status chips
- Text must remain readable in sun, dark venues, neon street light, airport glare, or outdoor event conditions.

### 5. Mobile Grid Rule

- Mobile: single-column or intentional swipeable cards.
- Tablet: clean 2-column.
- Desktop: clean 3+2, 4-column, or balanced grid.
- No orphan cards.
- No stranded final card.
- No broken masonry.

### 6. Location Utility Rule

- Location-aware pages should prioritize:
  - venue, dock, or pickup location
  - distance
  - timing
  - map-ready coordinates when available
  - pickup and exit logistics
- Mobile layout should make location decisions obvious fast.

### 7. Conversion Rule

- If the user cannot understand the next action in two seconds, the layout failed.
- If the CTA requires hunting, stretching, zooming, or horizontal scrolling, the layout failed.

## Connection to the Theme Governor

The Theme Governor must treat mobile behavior as a first-class system rule, not a responsive afterthought.

Every governed node should inherit:

- compact mobile header grammar
- 48px minimum action targets
- sticky CTA eligibility rules
- zero-overflow layout constraints
- single-column mobile card behavior
- balanced tablet/desktop grid rules
- high-contrast type and label tokens
- route/location utility display patterns
- anti-orphan grid behavior

Node hue changes the local identity. It does not weaken the mobile rules.

## WTS /plan Phase 1 Mobile Enforcement Plan

This phase is planning only. It must not change booking logic, routing, query params, provider handoff behavior, or visual rendering until explicitly approved.

### Files Involved

Likely WTS app files:

- `apps/welcometotheswamp/app/plan/page.tsx`
- `apps/welcometotheswamp/app/layout.tsx`
- `apps/welcometotheswamp/app/globals.css`
- `apps/welcometotheswamp/app/components/SiteHeader.tsx`
- `apps/welcometotheswamp/app/components/*`

Shared/network files to inspect only if WTS imports them:

- `lib/network/nodes/*`
- any BrandShell or Theme Governor files introduced later

### Current Risks

- `/plan` may visually diverge from other WTS public pages.
- Header density may not follow the compact utility-header rule.
- CTA placement may require hunting on mobile.
- Cards or comparison sections may overflow at narrow widths.
- Decision sections may stack correctly but bury the next action too far down-page.
- Query-param and handoff tracking must remain untouched while layout is enforced.

### Mobile Viewport Checks

Required viewports:

- 320px wide, iPhone SE class
- 390px wide, common iPhone class
- 430px wide, large phone class
- 768px wide, tablet transition

Checks:

- no accidental horizontal scroll
- header remains compact
- primary CTA remains thumb-reachable
- cards fit inside viewport
- nav pills do not force page overflow
- decision panels stack cleanly
- no text clipping inside buttons or cards

### CTA / Sticky Action Behavior

Evaluate whether `/plan` needs a sticky bottom action bar for:

- `Plan Your Tour`
- `Compare Options`
- `Check Availability`
- pickup/no-car handoff flows

Rules:

- Sticky behavior should be used only for critical mobile decisions.
- Sticky CTA must not obscure form fields, cards, or provider handoff controls.
- CTA labels and href/query params must remain unchanged unless separately approved.

### Zero-Overflow Checks

Validation should include:

- `document.documentElement.scrollWidth <= window.innerWidth`
- repeated check after scrolling to major sections
- screenshot review at 320px and 390px
- no hidden clipped CTA text
- no unintentional horizontal carousels

### Screenshot Validation Plan

Capture:

- `/plan` desktop
- `/plan` tablet
- `/plan` mobile at 390px
- `/plan` mobile at 320px
- `/plan` with the current DCC handoff query string:
  - `intent=compare`
  - `topic=swamp-tours`
  - `source=dcc`
  - `subtype=pickup`
  - `context=no-car`
  - `sourcePage=%2Fnew-orleans%2Ftours`

Verify:

- WTS header present
- DCC header absent
- WTONOT header absent
- query params preserved
- no booking/routing changes
- no horizontal overflow
- primary CTA visible and reachable
- decision sections remain readable under real mobile constraints

### Explicit Non-Goals

- No booking logic changes.
- No provider handoff changes.
- No query-param changes.
- No route changes.
- No page publishing.
- No deploy.
- No visual refactor until Phase 1 enforcement is approved.
