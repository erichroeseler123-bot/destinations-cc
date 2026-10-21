import type { FamilyTour } from "./familyTours";

// Compilation date, not a new verification date for individual operator facts.
export const FAMILY_SNAPSHOT_DATE = "2026-10-21";
export function buildFamilySnapshot(tours: FamilyTour[]) {
  const value=(t:FamilyTour,key:string)=>t.facts[key]?.status==="verified"?t.facts[key].value:null;
  return {
    title:"New Orleans swamp tour published rules: six-product snapshot",
    compilationSnapshotDate:FAMILY_SNAPSHOT_DATE,
    compiledBy:"Welcome to the Swamp",
    citationUrl:"https://welcometotheswamp.com/with-kids#published-rules",
    methodology:"Original compilation of operator-published product information. Six selected products from five operator brands; not a market census, firsthand tour research, an accessibility assessment or a live inventory check. Each fact retains its own source, product scope, verification status and checkedOn date. Missing information means not verified in this compilation, not that the operator has no rule.",
    limitations:["Published rates are reference amounts, not final quotes.","Transport coverage, participation requirements, seats, vessel assignment and return timing need operator confirmation.","Counts describe the captured snapshot, not future policies or the whole market.","Updating this compilation date must not refresh individual fact review dates."],
    counts:{products:tours.length,operatorBrands:new Set(tours.map(t=>t.operator)).size,allAges:tours.filter(t=>value(t,"minAge")===0).length,minimumAge:tours.filter(t=>typeof value(t,"minAge")==="number"&&Number(value(t,"minAge"))>0).length,minimumHeight:tours.filter(t=>typeof value(t,"minHeight")==="number").length,noVerifiedAgeOrHeight:tours.filter(t=>value(t,"minAge")===null&&value(t,"minHeight")===null).length,hotelTransportOptions:tours.filter(t=>["hotel_addon","hotel_included"].includes(String(value(t,"pickup")))).length,centralTransport:tours.filter(t=>value(t,"pickup")==="central_included").length},
    products:tours,
  };
}
