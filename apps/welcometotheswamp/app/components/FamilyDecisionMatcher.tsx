"use client";
import { useEffect, useRef, useState } from "react";
import { matchFamily, type FamilyAnswers } from "../../lib/familyMatching";
import { trustedValue } from "../../lib/familyTours";
import { getTodayNewOrleansDate } from "../../lib/timezone";
import styles from "./FamilyDecision.module.css";

export default function FamilyDecisionMatcher({initialAsOf}:{initialAsOf:string}) {
  const [today,setToday]=useState(initialAsOf);
  const [answers,setAnswers]=useState<FamilyAnswers>({adults:2,childAges:[],shortestHeight:null,pickup:"either",lodging:"undecided",ride:"either",mobility:false,travelDate:initialAsOf,earliest:"",returnBy:""});
  const [submitted,setSubmitted]=useState<FamilyAnswers|null>(null);
  const resultRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const now=getTodayNewOrleansDate();setToday(now);setAnswers(a=>({...a,travelDate:a.travelDate===initialAsOf?now:a.travelDate}));},[initialAsOf]);
  const result=submitted?matchFamily(submitted,today):null;
  function update<K extends keyof FamilyAnswers>(key:K,value:FamilyAnswers[K]) {setAnswers(a=>({...a,[key]:value}));setSubmitted(null);}
  function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setSubmitted({...answers,childAges:[...answers.childAges]});requestAnimationFrame(()=>resultRef.current?.focus());}
  const summary=`${answers.adults} traveler(s) aged 18+${answers.childAges.length?`; younger travelers aged ${answers.childAges.join(", ")}`:""}; ${answers.travelDate}; ${answers.pickup==="either"?"flexible city meeting point":answers.pickup==="hotel"?"hotel pickup needed":"central meeting point preferred"}${answers.earliest?`; available ${answers.earliest}–${answers.returnBy} local time`:""}.`;
  return <section className={styles.panel} id="family-matcher" aria-labelledby="matcher-title">
    <p className={styles.eyebrow}>Refine the comparison</p><h2 id="matcher-title">Find your strongest potential options</h2><p>Four questions narrow the six products below. No account, contact details, or live inventory check. Your answers are not saved or sent to an operator.</p>
    <form onSubmit={submit} aria-label="Family swamp tour matcher">
      <fieldset><legend>1. Who is going?</legend><div className={styles.fields}>
        <label>Travelers aged 18+<input required type="number" min={1} max={50} step={1} value={Number.isFinite(answers.adults)?answers.adults:""} onChange={e=>update("adults",e.target.value===""?NaN:Number(e.target.value))}/></label>
        <label>Travelers under 18<select aria-label="Travelers under 18" value={answers.childAges.length} onChange={e=>update("childAges",Array.from({length:Number(e.target.value)},(_,i)=>answers.childAges[i]??0))}>{Array.from({length:9},(_,n)=><option key={n} value={n}>{n}</option>)}</select></label>
        {answers.childAges.map((age,i)=><label key={i}>Younger traveler {i+1} age<input required type="number" min={0} max={17} step={1} value={Number.isFinite(age)?age:""} onChange={e=>update("childAges",answers.childAges.map((n,j)=>j===i?(e.target.value===""?NaN:Number(e.target.value)):n))}/></label>)}
      </div></fieldset>
      <fieldset><legend>2. How can you meet transportation?</legend><div className={styles.fields}>
        <label>Meeting preference<select aria-label="Meeting preference" value={answers.pickup} onChange={e=>update("pickup",e.target.value as FamilyAnswers["pickup"])}><option value="either">Hotel or central meeting point</option><option value="hotel">Hotel pickup required</option><option value="central">Central meeting point preferred</option></select></label>
        <label>Where are you staying?<select aria-label="Where are you staying?" value={answers.lodging} onChange={e=>update("lodging",e.target.value as FamilyAnswers["lodging"])}><option value="undecided">Undecided / other</option><option value="hotel">Hotel</option><option value="rental">Rental / residential address</option></select></label>
      </div><p>No exact address is needed. Pickup coverage and travel to a central meeting point must be confirmed separately.</p></fieldset>
      <fieldset><legend>3. What kind of ride fits your group?</legend><div className={styles.fields}>
        <label>Ride preference<select aria-label="Ride preference" value={answers.ride} onChange={e=>update("ride",e.target.value as FamilyAnswers["ride"])}><option value="either">Either / compare both</option><option value="calm">Calmer wildlife-focused boat</option><option value="thrill">Faster airboat experience</option></select></label>
        {answers.ride!=="calm" && <label>Shortest traveler’s height (inches, optional)<input type="number" min={12} max={96} step="any" value={answers.shortestHeight??""} onChange={e=>update("shortestHeight",e.target.value===""?null:Number(e.target.value))}/></label>}
      </div><p>Some airboats publish a 48-inch minimum. Leave height blank if unknown; those products will need more information.</p><label className={styles.checkbox}><input type="checkbox" checked={answers.mobility} onChange={e=>update("mobility",e.target.checked)}/>Someone needs help boarding or needs mobility arrangements confirmed.</label></fieldset>
      <fieldset><legend>4. When are you going, and how much time do you have?</legend><div className={styles.fields}>
        <label>Travel date<input required type="date" min={today} value={answers.travelDate} onChange={e=>update("travelDate",e.target.value)}/></label><label>Available from (optional)<input type="time" value={answers.earliest} onChange={e=>update("earliest",e.target.value)}/></label><label>Must return by (optional)<input type="time" value={answers.returnBy} onChange={e=>update("returnBy",e.target.value)}/></label>
      </div><p>Times are local to New Orleans. Enter both times or leave both blank. Estimates cannot establish a guaranteed return or a specific available departure.</p></fieldset>
      <button className={styles.button} type="submit">Show potential options</button>
    </form>
    <div ref={resultRef} tabIndex={-1} className={styles.results} aria-live="polite" aria-atomic="false">
      {!result?<p>Answer the questions to refine the public comparison. Changing an answer clears the previous shortlist.</p>:result.error?<p role="alert">{result.error}</p>:<>
        <h3>Your potential shortlist</h3><p>At most two options, selected by published rules, ride preference and available evidence. This is not a booking or participation clearance.</p>
        {!result.shortlist.length && <p className={styles.status}>No potential options can be shortlisted from these answers. Review the reasons below; missing information is not a rejection by the operator.</p>}
        <div className={styles.grid}>{result.shortlist.map(match=>{
          const soon=trustedValue(match.tour,"booking",today)==="phone_soon" && (Date.parse(answers.travelDate+"T12:00:00Z")-Date.parse(today+"T12:00:00Z"))/86400000<=1;
          return <article className={styles.card} key={match.tour.id} data-shortlist-card><p className={styles.status}>Potential fit — needs confirmation</p><p className={styles.eyebrow}>{match.tour.operator}</p><h4>{match.tour.name}</h4><h5>Why it is shortlisted</h5><ul>{match.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul><h5>Before booking</h5><ul>{match.confirm.map(reason=><li key={reason}>{reason}</li>)}</ul><p>{match.tour.bookingInstruction}</p><a className={styles.button} href={soon?"tel:+15046213858":match.tour.bookingUrl} target={soon?undefined:"_blank"} rel={soon?undefined:"noopener noreferrer"}>{soon?"Call for same/next-day reservations":"Review this product with the operator ↗"}</a><p><a href={`#compare-${match.tour.id}`}>Published facts, trade-offs and verification dates ↓</a></p></article>;
        })}</div>
        <details className={styles.otherResults} open={!result.shortlist.length}><summary>Why the other products were not shortlisted ({result.others.length})</summary>{result.others.map(match=><article key={match.tour.id}><h4>{match.tour.operator} — {match.tour.name}</h4><strong>{match.state==="excluded"?"Doesn’t fit these answers":match.state==="needs_information"?"Needs more information":"Potential fit — not in the first two"}</strong><ul>{(match.state==="excluded"?match.reasons:match.confirm).map(reason=><li key={reason}>{reason}</li>)}</ul><a href={`#compare-${match.tour.id}`}>Review this product’s facts ↓</a></article>)}</details>
        <details><summary>What to tell the operator</summary><p>{summary}</p><p>Ask them to confirm eligibility for everyone, the pickup point and return timing, total cost, assigned vessel, and current cancellation terms.</p></details><p>If nothing fits, confirm an alternative meeting point or ask about a different product or private arrangement. A longer combination tour is not automatically a solution to a short time window.</p>
      </>}
    </div>
  </section>;
}
