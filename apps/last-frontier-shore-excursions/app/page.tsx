import Link from "next/link";
import { PORTS } from "@/lib/ports";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="shell">
          <p className="eyebrow">Alaska cruise days, simplified</p>
          <h1>Your ship gives you hours. Alaska gives you too many choices.</h1>
          <p className="lead">Pick the Alaska experience that fits your port, your time ashore, your group, and the weather — without gambling the whole port day on the wrong excursion.</p>
          <div className="cta-row">
            <a className="button" href="#ports">Choose your port</a>
            <Link className="button secondary" href="/ports/juneau">Start with Juneau</Link>
          </div>
        </div>
      </section>

      <section className="section" id="ports">
        <div className="shell">
          <p className="eyebrow" style={{color:"#607078"}}>Choose your Alaska port</p>
          <h2>Start with where the ship stops.</h2>
          <p className="lead" style={{color:"#607078"}}>Each port page narrows the day by excursion style and keeps a backup in mind when Alaska weather changes the plan.</p>
          <div className="grid">
            {PORTS.map((port) => (
              <Link className="card" href={`/ports/${port.slug}`} key={port.slug}>
                <p className="eyebrow" style={{color:"#607078"}}>{port.region}</p>
                <h3>{port.name}</h3>
                <p>{port.hook}</p>
                <div className="chips">{port.bestFor.slice(0,3).map((item)=><span className="chip" key={item}>{item}</span>)}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="rule">
            <p className="eyebrow" style={{color:"#8b4c25"}}>The shore-excursion rule</p>
            <h2 style={{marginTop:8}}>Do one big Alaska thing. Leave margin around it.</h2>
            <p className="lead" style={{color:"#607078"}}>Cruise port days are different from normal sightseeing days. Meeting points, transportation, weather, and your ship's departure time matter. Build around one anchor experience instead of stacking the day until it breaks.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <p className="eyebrow" style={{color:"#607078"}}>What are you trying to see?</p>
          <h2>Use the experience first, then compare the tours.</h2>
          <div className="grid">
            {[
              ["Glaciers & ice", "Juneau is the strongest starting point for glacier access and flightseeing."],
              ["Whales & wildlife", "Juneau and Icy Strait Point are natural first comparisons for whale-focused days."],
              ["Scenic rail & mountains", "Skagway turns a cruise call into White Pass and Yukon scenery."],
              ["Rainforest & fjords", "Ketchikan mixes Misty Fjords, rainforest, wildlife, and cultural options."],
              ["History & culture", "Sitka and Skagway offer distinct Alaska history without requiring an all-day adventure."],
              ["Small-group feel", "Sitka and Hoonah can feel less like a giant attraction corridor than the busiest ports."],
            ].map(([title,copy]) => <article className="card" key={title}><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </div>
      </section>
    </main>
  );
}
