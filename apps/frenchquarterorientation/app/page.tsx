const WNO = "https://welcometoneworleanstours.com";

const decisions = [
  ["01", "Know the shape of the Quarter", "The river, Rampart Street, Canal Street, and Esplanade Avenue give you the box. Once you know the edges, individual streets stop feeling random."],
  ["02", "Choose the right first street", "Bourbon is the spectacle. Royal is architecture, shops, galleries, and street life. Your first street should match what you actually came to see."],
  ["03", "Pick a regroup point", "Groups should choose one obvious landmark before splitting up. A clear meeting point prevents an hour of texting from opposite corners of the Quarter."],
  ["04", "Use one anchor, then wander", "Pick one must-do stop first. Build the next hour around it instead of crossing the Quarter repeatedly for disconnected recommendations."],
  ["05", "Keep the river in your mental map", "When you lose your bearings, re-orient toward the Mississippi, Jackson Square, Canal, or Rampart instead of trusting that every block feels different."],
  ["06", "Know when orientation ends", "Once you understand the layout, move on. Tours, food, music, river cruises, and transportation belong with the provider that actually operates them."]
] as const;

export default function Home() {
  return <>
    <main>
      <section className="hero"><div className="shell">
        <div className="eyebrow">French Quarter Orientation · New Orleans</div>
        <h1>Understand the Quarter before you start wandering it.</h1>
        <p>The French Quarter is compact, but first-time visitors can burn a surprising amount of time walking the wrong direction, choosing the wrong first street, or trying to regroup after everyone splits up. This site is the practical orientation layer: where you are, what connects to what, and what your smartest next move is.</p>
        <div className="actions"><a className="btn primary" href="#first-hour">Plan your first hour</a><a className="btn secondary" href={`${WNO}/things-to-do-in-new-orleans-today?src=fqo`}>Explore New Orleans tours ↗</a></div>
      </div></section>

      <section className="section" id="first-hour"><div className="shell">
        <div className="eyebrow" style={{color:"#8c352f"}}>The first-hour playbook</div>
        <h2>Six decisions that make the Quarter easier.</h2>
        <p className="lede">No fake countdowns, no invented departure board, and no promise that a particular tour or attraction is available right now. Use this to get oriented; use actual providers for live schedules, prices, tickets, and terms.</p>
        <div className="grid">{decisions.map(([n,t,d])=><article className="card" key={n}><div className="num">STEP {n}</div><h3>{t}</h3><p>{d}</p></article>)}</div>
      </div></section>

      <section className="section band"><div className="shell split">
        <div><div className="eyebrow" style={{color:"#8c352f"}}>Fast mental map</div><h2>Four edges. A few landmarks. Much less confusion.</h2><ul className="list"><li><strong>Mississippi River:</strong> the downriver-side anchor for Jackson Square and the Moonwalk area.</li><li><strong>Canal Street:</strong> the upriver edge and major transit seam.</li><li><strong>Rampart Street:</strong> the inland edge of the Quarter.</li><li><strong>Esplanade Avenue:</strong> the downriver edge toward Marigny.</li><li><strong>Jackson Square:</strong> the easiest central landmark for many first-time visitors.</li></ul></div>
        <aside className="note"><strong>What this site is for</strong><p className="lede">French Quarter Orientation helps answer “where am I, how does this neighborhood fit together, and what should I do first?” It is not the authority for live attraction availability, prices, pickup rules, or ticket terms.</p></aside>
      </div></section>

      <section className="section"><div className="shell">
        <div className="eyebrow" style={{color:"#8c352f"}}>After you are oriented</div><h2>Turn “where am I?” into “what should we do?”</h2>
        <p className="lede">Once the Quarter makes sense, use Welcome to New Orleans Tours for broader tour comparison and trip choices. The provider handling the booking remains the authority for current availability, price, meeting details, restrictions, and cancellation terms.</p>
        <div className="actions"><a className="btn primary" href={`${WNO}/things-to-do-in-new-orleans-today?src=fqo`}>Things to do today ↗</a><a className="btn" style={{border:"1px solid #8c352f",color:"#8c352f"}} href={`${WNO}/guides/4-hours-in-new-orleans?src=fqo`}>Only have four hours? ↗</a><a className="btn" style={{border:"1px solid #8c352f",color:"#8c352f"}} href="https://www.destinationcommandcenter.com/new-orleans?utm_source=frenchquarterorientation&utm_medium=satellite">Open deeper New Orleans context ↗</a></div>
      </div></section>
    </main>
    <footer><div className="shell">French Quarter Orientation · Independent New Orleans orientation resource. Live prices, availability, and final terms come from the relevant provider.</div></footer>
  </>;
}
