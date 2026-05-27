# EarthOS Property Intake Plan

## Purpose

This plan defines the first compliant step for Property Missions in EarthOS: private owner-submitted property review.

It is not a public real estate search engine, public listing product, MLS display, brokerage workflow, offer workflow, or home-sale marketplace. The intake exists only to help EarthOS evaluate whether an owner-approved property could become a future mission node connected to nearby destination corridors, attractions, shuttle routes, food/drink proximity, event demand, and social broadcast assets.

## Current Boundary

Phase 0 is private intake only.

Hard boundaries:

- No public property pages.
- No MLS scraping.
- No IDX, VOW, RESO, broker, or MLS data use unless authorized in a later phase.
- No brokerage claims.
- No agency representation claims.
- No commission claims.
- No valuation or appraisal claims.
- No offer, bid, negotiation, escrow, closing, or purchase workflow.
- No public listing until the owner approves publication and the applicable legal/compliance path is clear.

## Intake Model

Property Mission intake is owner-submitted and manually reviewed.

The owner, or an authorized representative, provides property facts, media permissions, desired visibility, and consent for EarthOS to evaluate the property as a private mission node. EarthOS may use the submitted information to assess corridor fit, social-share potential, destination proximity, and operational relevance.

The intake is not a promise that the property will be published, promoted, sold, represented, valued, or matched with a buyer.

## Required Owner Consent Fields

Minimum consent fields:

- owner_full_name
- owner_email
- owner_phone
- owner_relationship_to_property
- confirmation_owner_or_authorized_representative
- consent_to_private_review
- consent_to_store_submitted_information
- consent_to_contact_about_property_mission
- consent_to_manual_destination_fit_review
- consent_to_use_submitted_photos_for_private_review
- publication_permission_status
- address_visibility_preference
- photo_permission_scope
- submitted_at
- consent_version

Required attestations:

- The submitter has the right to submit the property information.
- The submitted facts are accurate to the best of the submitter's knowledge.
- Any submitted photos are owned by the submitter or submitted with permission.
- EarthOS is not being asked to scrape MLS data.
- EarthOS is not being asked to act as a broker, agent, appraiser, lender, escrow provider, or legal advisor.

## Address Visibility Options

Address handling must be explicit.

Supported visibility preferences:

- private_exact_address: exact address is visible only to internal reviewers.
- neighborhood_only: public or social preview may use neighborhood/city but not exact address.
- approximate_map_area: public or social preview may use an approximate map area without exact pin placement.
- exact_public_address_allowed: exact address may be displayed only after explicit owner approval and compliance review.

Default: private_exact_address.

No exact public address exposure is allowed without owner approval.

## Photo Permission

Photo permission must be separate from general intake consent.

Supported photo permission scopes:

- private_review_only: photos may be used only for internal EarthOS review.
- owner_preview_assets: photos may be used to generate private preview cards for owner review.
- approved_social_assets: photos may be used in approved social/broadcast assets after owner approval.
- approved_public_property_surface: photos may be used on a public property surface after owner approval and compliance review.

Default: private_review_only.

Submitted photos must include one of:

- owner_created
- photographer_permission_obtained
- licensed_media
- other_permission_documented

EarthOS should not use scraped listing photos, MLS photos, portal photos, or third-party listing images unless use is clearly authorized.

## Property Facts

Private intake may collect owner-submitted facts such as:

- property_type
- beds
- baths
- approximate_square_feet
- lot_size
- year_built
- parking
- outdoor_space
- short_term_rental_status_if_known
- notable_rooms
- recent_updates
- accessibility_notes
- pet_friendly_notes
- utility_or_hoa_notes
- owner_summary

Property facts are owner-submitted. They are not MLS-verified unless a future authorized data source is added.

## Destination Corridor Fit

EarthOS reviews whether the property fits one or more governed destination corridors.

Example fit signals:

- proximity_to_destination_nodes
- proximity_to_event_venues
- proximity_to_shuttle_or_transport_corridors
- trail_access
- food_and_drink_proximity
- lake_or_water_access
- ski_or_mountain_access
- concert_or_festival_relevance
- large_group_stay_potential
- walkability_or_transit_context
- quiet_retreat_context
- high_energy_social_context

The corridor fit review is an editorial and operational assessment. It is not a valuation, appraisal, investment recommendation, or representation that a property will sell.

## Vibe Review

Vibe review is used only to describe the property's possible destination story.

Example vibe tags:

- cozy
- high_energy
- trail_access
- foodie_proximity
- lake_weekend
- concert_basecamp
- group_house
- quiet_retreat
- walkable
- mountain_gateway
- family_friendly
- nightlife_access

Vibe tags must not replace property facts. They are presentation metadata for future owner-approved broadcast assets.

## Manual EarthOS Review

Every submitted property remains private until manually reviewed.

Review checklist:

- Confirm submitter relationship and consent.
- Confirm address visibility preference.
- Confirm photo permission scope.
- Check for MLS/portal/scraped content risk.
- Check for prohibited brokerage, valuation, or offer language.
- Assign provisional EarthOS node status.
- Identify destination corridor fit.
- Identify missing facts or permissions.
- Decide whether the property remains parked, needs owner follow-up, or can advance to private preview.

Possible internal statuses:

- intake_received
- needs_owner_confirmation
- needs_photo_permission
- needs_fact_clarification
- private_review
- private_preview_allowed
- publication_blocked
- parked
- future_broker_mls_required

## No MLS Scraping

EarthOS must not scrape MLS systems, brokerage sites, listing portals, photos, agent remarks, sold data, price histories, or listing descriptions.

MLS-derived display requires proper authorization through an approved broker, MLS, IDX, VOW, RESO, or other compliant data agreement. Until that exists, Property Missions rely only on owner-submitted information and internally governed destination context.

## No Brokerage Claims

EarthOS Property Mission intake does not provide:

- real estate brokerage services
- agency representation
- listing agreements
- buyer representation
- seller representation
- transaction negotiation
- commission collection
- legal advice
- financing advice
- appraisal or valuation services

If a future workflow requires regulated real estate activity, that workflow must be handled through authorized broker/MLS/legal/compliance structures before public release.

## Publication Rule

No property becomes public by default.

Public display requires:

- owner approval
- address visibility approval
- photo/media approval
- compliance review
- clear publication status
- removal path
- no MLS-derived content unless authorized

Any public surface must clearly separate destination/vibe storytelling from factual property claims.

## No Selling Or Offer Workflow Yet

Current intake does not support:

- offers
- bidding
- lead sale
- buyer matching
- showing scheduling
- purchase contracts
- deposits
- escrow
- mortgage qualification
- commission routing
- closing workflows

Initial success means safe intake and review, not transaction execution.

## Future Phases

Phase 0: Private owner-submitted intake plan.

Phase 1: Private intake form and internal review queue.

Phase 2: Owner preview cards generated from submitted data and EarthOS corridor context.

Phase 3: Owner-approved social broadcast assets with no public listing page by default.

Phase 4: Private property mission nodes in EarthOS map/config.

Phase 5: Public property surfaces only after owner approval and compliance review.

Phase 6: Broker/MLS/IDX/VOW/RESO integration only after authorization.

Phase 7: Regulated transaction workflows only through proper broker/legal/compliance structures.

## Relationship To EarthOS

Property Missions are nodes in the EarthOS governance model. They may connect to:

- destination_node
- satellite_surface
- operator_surface
- field_test
- governance_asset
- marketplace_fallback

The property node is not the source of truth for MLS inventory. It is an owner-submitted mission surface governed by consent, visibility, media permission, and compliance state.

## Minimum Example Intake Record

```json
{
  "node_type": "property_listing",
  "status": "private_review",
  "owner_consent": {
    "confirmation_owner_or_authorized_representative": true,
    "consent_to_private_review": true,
    "consent_to_store_submitted_information": true,
    "publication_permission_status": "not_approved"
  },
  "address_visibility_preference": "private_exact_address",
  "photo_permission_scope": "private_review_only",
  "property_facts_source": "owner_submitted",
  "destination_corridor_fit": ["concert_basecamp", "foodie_proximity"],
  "blocked_actions": [
    "public_listing",
    "mls_display",
    "brokerage_claim",
    "offer_workflow"
  ],
  "next_action": "manual_earthos_review"
}
```

## Current Parking Rule

Owner-submitted property intake may be documented and reviewed privately.

No public property listing, MLS display, brokerage workflow, offer workflow, or sales workflow should be built until owner consent, compliance requirements, and broker/MLS authorization paths are resolved.
