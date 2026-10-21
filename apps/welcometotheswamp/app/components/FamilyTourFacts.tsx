import { effectiveStatus, type Fact, type FamilyTour } from "../../lib/familyTours";
import styles from "./FamilyDecision.module.css";
export const FACT_LABELS: Record<string,string> = { minAge:"Age rule", minHeight:"Height rule", boarding:"Boarding and participation", weight:"Weight rules and charges", pickup:"Transportation", pickupWindow:"Meeting instructions", onWater:"On-water duration", totalMinutes:"Total outing", ride:"Ride style", shade:"Shade", capacity:"Boat capacity", bathroom:"Bathroom", price:"Published price basis", cancellation:"Cancellation and weather", booking:"Booking method" };
export function readableDate(s:string) {return new Intl.DateTimeFormat("en-US",{timeZone:"UTC",month:"short",day:"numeric",year:"numeric"}).format(new Date(s+"T12:00:00Z"));}
export function FactEvidence({fact,asOf}:{fact:Fact;asOf:string}) {
  const status=effectiveStatus(fact,asOf);
  return <div className={styles.fact}><p>{fact.text}</p>
    {status!=="verified" && <strong className={styles.unknown}>{status==="stale"?"Review overdue — needs confirmation":status==="conflicting"?"Conflicting information — needs confirmation":status==="unclear"?"Unclear — needs confirmation":"Not verified — needs confirmation"}</strong>}
    {fact.sourceUrl && fact.checkedOn ? <details className={styles.evidence}><summary>Source · checked <time dateTime={fact.checkedOn}>{readableDate(fact.checkedOn)}</time></summary><p><a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">Operator source ↗</a> · Applies to: {fact.appliesTo}</p>{fact.qualification && <p>{fact.qualification}</p>}</details>:<small>No verified source/date for this fact.</small>}
  </div>;
}
export function ProductFacts({tour,asOf}:{tour:FamilyTour;asOf:string}) {return <dl className={styles.facts}>{Object.entries(tour.facts).map(([key,fact])=><div key={key}><dt>{FACT_LABELS[key]||key}</dt><dd><FactEvidence fact={fact} asOf={asOf}/></dd></div>)}</dl>;}
