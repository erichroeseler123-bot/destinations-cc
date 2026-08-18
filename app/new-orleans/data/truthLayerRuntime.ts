import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import {
  HELD_COMBO_BANNER,
  HELD_COMBO_SLUG,
  SOUTHERN_STYLE_COMBO_DURATION_COPY,
  SOUTHERN_STYLE_COMBO_SLUG,
} from "./truthPolicy";

/**
 * Final WNO truth-layer overrides.
 *
 * These mutate the shared storefront registry at module initialization so every
 * WNO surface consuming STOREFRONT_PRODUCTS receives the same conservative
 * copy while older catalog records are being retired. The overrides only
 * remove unsupported claims; they never invent replacement facts.
 */
export function applyWnoTruthLayerOverrides() {
  const southernCombo = STOREFRONT_PRODUCTS.find((product) => product.slug === SOUTHERN_STYLE_COMBO_SLUG);
  if (southernCombo) {
    Object.assign(southernCombo, {
      description:
        "A Southern Style combination booking whose current component tours and schedule are confirmed when you check availability.",
      metaDescription:
        "Review a Southern Style New Orleans combination booking. Current component tours, itinerary, pickup details and duration are confirmed when you check availability.",
      durationLabel: SOUTHERN_STYLE_COMBO_DURATION_COPY,
      transportationSummary: "Transportation details depend on the current itinerary.",
      pickupSummary: "Current pickup details are confirmed when you check availability.",
      highlights: [
        "Combination booking",
        "Current component tours confirmed when you check availability",
        "Current itinerary and schedule confirmed before booking",
      ],
      detailSummary:
        `A Southern Style combination booking. ${SOUTHERN_STYLE_COMBO_DURATION_COPY} Current component tours, pickup details and itinerary are confirmed when you check availability.`,
      bestFit: [
        "Visitors who want to combine two participating experiences",
        "Groups whose schedule can remain flexible until the current itinerary is confirmed",
      ],
      notIdealFor: [
        "Visitors who need a fixed-duration itinerary before checking current availability",
        "Travelers who need the exact component tours guaranteed before reviewing the current booking configuration",
      ],
      childrenConsiderations: [
        "Eligibility can vary with the current component tours. Confirm age requirements for the selected itinerary before booking.",
      ],
      confirmedInclusions: [],
      bookingConfirmations: [
        "Current component tours",
        "Current itinerary and duration",
        "Current pickup details",
        "Live departure availability",
        "Current pricing",
      ],
      logistics: {
        pickup: "Current pickup details are confirmed when you check availability.",
        transportation: "Transportation details depend on the current itinerary.",
      },
      bookingNote: SOUTHERN_STYLE_COMBO_DURATION_COPY,
    });
  }

  const heldCombo = STOREFRONT_PRODUCTS.find((product) => product.slug === HELD_COMBO_SLUG);
  if (heldCombo) {
    Object.assign(heldCombo, {
      description:
        "This covered-boat and plantation combination is being held for manual confirmation while current operator details are verified.",
      metaDescription:
        "Covered-boat and plantation combination details are pending current operator verification. Call 504-484-9687 to confirm before booking.",
      durationLabel: "Duration pending operator verification.",
      transportationSummary: "Transportation details pending operator verification.",
      pickupSummary: "Pickup details pending operator verification.",
      detailSummary: HELD_COMBO_BANNER,
      bestFit: [],
      notIdealFor: ["Self-service booking until the current operator configuration is verified"],
      childrenConsiderations: ["Age and participation requirements are pending operator verification."],
      confirmedInclusions: [],
      bookingConfirmations: ["Current operator configuration", "Current duration", "Current transportation and pickup details"],
      bookingNote: HELD_COMBO_BANNER,
      ctaLabel: "Confirm details",
    });
  }
}

applyWnoTruthLayerOverrides();
