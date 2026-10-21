import { FAMILY_TOURS, trustedValue, type FamilyTour } from "./familyTours";
export interface FamilyAnswers { adults: number; childAges: number[]; shortestHeight: number | null; pickup: "hotel" | "central" | "either"; lodging: "hotel" | "rental" | "undecided"; ride: "calm" | "thrill" | "either"; mobility: boolean; travelDate: string; earliest: string; returnBy: string }
export interface FamilyMatch { tour: FamilyTour; state: "potential" | "needs_information" | "excluded"; reasons: string[]; confirm: string[]; score: number }
function minutes(s: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(s) ? Number(s.slice(0,2))*60+Number(s.slice(3)) : null; }
function validDate(s: string) { const d = new Date(s+"T12:00:00Z"); return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === s; }
export function answersError(a: FamilyAnswers, today: string) {
  if (!Number.isInteger(a.adults) || a.adults<1 || a.adults>50 || a.childAges.length>8 || a.childAges.some(n=>!Number.isInteger(n)||n<0||n>17)) return "Enter 1–50 travelers aged 18+ and a valid age for each traveler under 18 (up to eight).";
  if (!validDate(a.travelDate) || a.travelDate<today) return "Choose today or a future travel date.";
  if (a.shortestHeight!==null && (!Number.isFinite(a.shortestHeight)||a.shortestHeight<12||a.shortestHeight>96)) return "Enter the shortest traveler’s height in inches (12–96), or leave it blank.";
  if (!["hotel","central","either"].includes(a.pickup) || !["hotel","rental","undecided"].includes(a.lodging) || !["calm","thrill","either"].includes(a.ride)) return "Choose valid ride and transportation preferences.";
  if (Boolean(a.earliest)!==Boolean(a.returnBy) || (a.earliest && (minutes(a.earliest)===null || minutes(a.returnBy)===null || minutes(a.returnBy)!<=minutes(a.earliest)!))) return "Enter both times with a return deadline later on the same day, or leave both blank.";
  return null;
}
export function matchFamily(a: FamilyAnswers, today: string, tours=FAMILY_TOURS) {
  const error=answersError(a,today); if(error) return { error, shortlist: [] as FamilyMatch[], others: [] as FamilyMatch[] };
  const results=tours.map(tour=>{
    const reasons:string[]=[], confirm:string[]=["Confirm seats, final price, exact meeting instructions, and all participation rules before booking."];
    let excluded=false, insufficient=false, score=0;
    const get=(k:string)=>trustedValue(tour,k,today);
    const age=get("minAge"),height=get("minHeight"),capacity=get("capacity"),ride=get("ride"),pickup=get("pickup"),total=get("totalMinutes");
    if(typeof age==="number") { if(a.childAges.some(n=>n<age)){excluded=true;reasons.push(`A traveler is below this public product’s published minimum age of ${age}.`);} else {reasons.push(age===0?"The published age rule welcomes all ages.":`Your entered ages meet the published ${age}+ minimum.`);score+=2;} }
    else if(a.childAges.length){confirm.push("Child age eligibility needs operator confirmation.");if(typeof height!=="number")insufficient=true;}
    if(typeof height==="number") {if(a.shortestHeight===null){insufficient=true;confirm.push(`Enter the shortest traveler’s height to assess the ${height}-inch minimum.`);}else if(a.shortestHeight<height){excluded=true;reasons.push(`The shortest traveler is below the published ${height}-inch minimum.`);}else{reasons.push(`Your entered height meets the published ${height}-inch minimum.`);score+=2;}}
    if(typeof capacity==="number" && a.adults+a.childAges.length>capacity){excluded=true;reasons.push(`Your party exceeds this record’s largest listed vessel (${capacity} guests). Ask about separate boats or a charter.`);}
    else confirm.push("Confirm the assigned vessel and whether your party can ride together.");
    if(a.ride!=="either" && ride!==a.ride){if(ride===null){insufficient=true;confirm.push("Ride style needs verification.");}else{excluded=true;reasons.push("This product is outside your selected ride preference.");}}
    else if(ride!==null){reasons.push(ride==="calm"?"The published format suits your calmer-ride preference or flexible choice.":"The published format suits your airboat preference or flexible choice.");score+=2;}
    if(pickup===null){insufficient=true;confirm.push("Transportation arrangements need verification.");}
    else if(a.pickup==="hotel" && pickup==="central_included"){excluded=true;reasons.push("Transportation starts at a central meeting point, not your hotel.");}
    else if(a.pickup==="central" && pickup!=="central_included"){insufficient=true;confirm.push("Ask whether a central meeting point is available for this hotel-transport product.");}
    else {reasons.push(pickup==="central_included"?"Round-trip transport is published from a central meeting point you must reach yourself.":"This product offers a hotel-transport option; your exact pickup remains unconfirmed.");score++;}
    if(a.lodging==="rental" && a.pickup==="hotel") {
      if(tour.id==="aa-pontoon"){excluded=true;reasons.push("This operator excludes residential/Airbnb pickup. Change your meeting preference if you can reach an eligible hotel.");}
      else{insufficient=true;confirm.push("Rental-address pickup is not established. Confirm an eligible meeting point.");}
    } else if(pickup!=="central_included")confirm.push("Confirm hotel or meeting-point eligibility and whether transport is included or an add-on.");
    if(a.mobility) {if(get("boarding")==="independent"){excluded=true;reasons.push("The operator requires boarding without staff assistance; this conflicts with your stated need for boarding help.");}else{insufficient=true;confirm.push("Boarding assistance, steps, mobility-device handling and bathroom access require direct confirmation.");}}
    if(a.earliest) {const window=minutes(a.returnBy)!-minutes(a.earliest)!;if(typeof total!=="number"){insufficient=true;confirm.push("A complete outing duration is missing, so your return deadline cannot be assessed.");}else if(total>window){excluded=true;reasons.push(`The published outing estimate allows up to ${total} minutes, longer than your ${window}-minute window.`);}else{reasons.push("The published outing estimate is within your window, before extra meeting-point travel and delays.");confirm.push("Confirm a specific departure, meeting-point travel and return buffer. This does not establish a guaranteed return.");}}
    return {tour,state:excluded?"excluded":insufficient?"needs_information":"potential",reasons,confirm,score} as FamilyMatch;
  });
  const ordered=results.filter(r=>r.state==="potential").sort((a,b)=>b.score-a.score);
  const shortlist=ordered.slice(0,2);const selected=new Set(shortlist.map(r=>r.tour.id));
  return {error:null,shortlist,others:results.filter(r=>!selected.has(r.tour.id))};
}
