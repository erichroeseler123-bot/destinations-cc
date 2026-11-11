"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import PortableTripNetworkBar from "@/app/components/dcc/PortableTripNetworkBar";
import ColoradoSeasonalSpotlightCard from "@/app/components/dcc/ColoradoSeasonalSpotlightCard";
import SharedTripRecheckCard from "@/app/components/dcc/SharedTripRecheckCard";
import PartnerSharePlanningBar from "@/app/components/dcc/PartnerSharePlanningBar";
import { evaluateDenArrivalTripRecheck } from "@/lib/dcc/sharedTripRecheck";

const SENSITIVE_QUERY_KEYS = new Set([
  "ctx",
  "dcc_ctx",
  "name",
  "fullName",
  "firstName",
  "lastName",
  "email",
  "phone",
  "weight",
  "passengerWeight",
  "weights",
  "accessibility",
  "medicalNotes",
  "cabin",
  "cabinNumber",
  "stateroom",
  "stateroomNumber",
  "bookingRef",
  "reservationNumber",
  "pnr",
]);

function useSanitizedSearchParamsRecord(): Record<string, string> {
  const searchParams = useSearchParams();
  const out: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) {
    if (SENSITIVE_QUERY_KEYS.has(k)) continue;
    if (v.startsWith("dcc_ctx_")) continue;
    out[k] = v;
  }
  return out;
}

export function ColoradoQueryTopCardsClient() {
  const sp = useSanitizedSearchParamsRecord();
  const queryKey = JSON.stringify([
    sp.date || sp.month || "",
    sp.destination || sp.venue || "",
    sp.party_size || sp.passengers || "",
    sp.ski_bags || "",
    sp.intent || "",
  ]);

  const denRecheck = evaluateDenArrivalTripRecheck({
    date: sp.date || "2026-12-19",
    flightNumber: sp.flight || "UA 1482",
    scheduledEtaLocal: sp.scheduled_eta || "13:30",
    revisedEtaLocal: sp.revised_eta || "14:45",
    destination: sp.destination || "Vail",
    partySize: Number(sp.party_size || sp.passengers) || 4,
    skiBags: Number(sp.ski_bags) || 2,
  });

  return (
    <>
      <PortableTripNetworkBar
        marketId="gosno"
        searchParams={sp}
        defaultDate={sp.date || "2026-12-19"}
        defaultPartySize={Number(sp.party_size || sp.passengers) || 4}
        defaultPickupHub={sp.origin || "DEN (Denver International Airport)"}
        defaultDestination={sp.destination || "Vail / Breckenridge"}
      />

      <ColoradoSeasonalSpotlightCard
        key={queryKey}
        initialDateOrMonth={sp.date || sp.month || null}
        initialDestinationOrVenue={sp.destination || sp.venue || null}
        initialPartySize={Number(sp.party_size || sp.passengers) || 4}
        initialSkiBags={Number(sp.ski_bags) || 0}
        initialTripIntent={sp.intent || "unspecified"}
      />

      <SharedTripRecheckCard
        card={denRecheck.recheckCard}
        testId="dcc-den-arrival-recheck-card"
      />
    </>
  );
}

export function ColoradoPartnerShareBarClient() {
  const sp = useSanitizedSearchParamsRecord();
  return (
    <PartnerSharePlanningBar
      market="colorado-mountain"
      activePartnerParam={sp.partner}
      activePartnerRoleParam={sp.partner_role}
      activeCancelRefParam={sp.cancel_ref}
      activeTrafficSourceParam={sp.src}
    />
  );
}
