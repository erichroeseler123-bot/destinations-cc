/**
 * Southeast Alaska Directory Contract Facade (`lib/dcc/shared/southeastAlaskaDirectoryContract.ts`).
 *
 * Composes:
 *   1. `regionalDirectoryCoreContract.ts` — Region-neutral core entities (operator, product,
 *      departure, location, meeting point, booking provider, review, provenance, and gates)
 *   2. `alaskaDirectoryExtensionContract.ts` — Alaska-specific berths, tender landings,
 *      scenic non-disembarkation waterways, wildlife/aviation context, and 2-hour cruise
 *      all-aboard return-buffer calculations.
 *
 * Preserves 100% backward-compatible exports for all Southeast Alaska callers.
 */

export {
  DIRECTORY_CORE_CONTRACT_VERSION,
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  CORE_LOCATION_TYPES,
  CORE_OPERATOR_FIELD_AUTHORITY_MATRIX,
  isOperatorLiveAvailabilityConnected,
  isOperatorDirectCheckoutConnected,
  buildAuthorizedSupplierDirectWrapperHref,
  assessOperatorClaimAndIntegrationSubmission,
  normalizeProductDepartureSlots,
  evaluateCoreLocationPublicationGate,
  evaluateCoreOperatorPublicationGate,
  evaluateCorePlaceCategoryPublicationGate,
  type AuthorizedSupplierProductBinding,
  type CoreSourceKind,
  type RecordProvenanceFields,
  type CoreLocationType,
  type CoreLocationPrecisionTier,
  type LocationRelationshipLink,
  type DirectoryLocationCoreRecord,
  type CoreMeetingPointKind,
  type DirectoryMeetingPointRecord,
  type OperatorMeetingRuleRecord,
  type BookingProviderPlatform,
  type ProductBookingChannel,
  type BookingProviderDescriptor,
  type OperatorIntegrationApprovalState,
  type DirectoryOperatorReviewRecord,
  type DirectoryProductReviewRecord,
  type CoreOwnershipTag,
  type DirectoryOperatorCoreRecord,
  type OperatorClaimVerificationMethod,
  type OperatorClaimControlAssessment,
  type DirectoryDepartureSlot,
  type DirectoryProductCoreRecord,
  type DirectoryCategoryDefinition,
  type PlaceCategoryComparisonCore,
  type CorePublicationGateHoldReasonCode,
} from "./regionalDirectoryCoreContract";

export {
  ALASKA_DIRECTORY_EXTENSION_VERSION,
  SOUTHEAST_ALASKA_PLACE_TYPES,
  OPERATOR_FIELD_AUTHORITY_MATRIX,
  evaluatePlacePublicationGate,
  evaluateOperatorPublicationGate,
  evaluatePortCategoryPublicationGate,
  evaluateCruiseSailingPortFit,
  type SoutheastAlaskaPlaceType,
  type PlaceRelationshipKind,
  type PlaceRelationshipLink,
  type AlaskaSourceKind,
  type AlaskaPrimarySourceCitation as PrimarySourceCitation,
  type SoutheastAlaskaDockOrAccessPoint,
  type VisitingCruiseShipSummary,
  type SoutheastAlaskaPlaceRecord,
  type VerifiedOwnershipTag,
  type AlaskaVerifiedOwnershipBadge as VerifiedOwnershipBadge,
  type BookingPlatformType,
  type OperatorDockPickupRule,
  type OperatorEntityReviewRecord,
  type TourEntityReviewRecord,
  type SoutheastAlaskaOperatorRecord,
  type SoutheastAlaskaTourProductRecord,
  type SoutheastAlaskaCategoryDefinition,
  type PortCategoryComparisonContent,
  type PublicationGateHoldReasonCode,
  type AlaskaEntityPublicationGateEvaluation as EntityPublicationGateEvaluation,
} from "./alaskaDirectoryExtensionContract";
