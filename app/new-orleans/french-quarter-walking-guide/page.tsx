import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Walking and Biking Between the French Quarter, CBD, and Lower Garden District | Local Mobility Guide",
  description:
    "Fact-checked pedestrian and cycling mobility guide between the Lower Garden District, CBD, and French Quarter. Riverfront barriers, cruise terminal interruptions, Convention Center Blvd, Magazine vs Camp alternatives, and highway underpass crossings.",
  alternates: {
    canonical: "https://www.welcometoneworleanstours.com/french-quarter-walking-guide",
  },
  openGraph: {
    title: "Walking and Biking Between the French Quarter, CBD, and Lower Garden District",
    description:
      "Fact-checked local mobility guide: safest walking and biking routes, riverfront barriers, cruise terminal closures, and street-by-street alternatives in New Orleans.",
    url: "https://www.welcometoneworleanstours.com/french-quarter-walking-guide",
    type: "article",
  },
};

const FAQS = [
  {
    question: "Is there a continuous riverfront path from the Lower Garden District to the French Quarter?",
    answer:
      "No. While Woldenberg Riverfront Park provides continuous walking along the French Quarter down to Canal Street and the Riverwalk, active Port of New Orleans cruise ship facilities (Julia Street and Erato Street Cruise Terminals) and industrial floodwalls physically block riverfront through-travel between Henderson Street and Poydras Street. Pedestrians and cyclists must route inland via city streets.",
  },
  {
    question: "Can you bike comfortably along Convention Center Boulevard?",
    answer:
      "Convention Center Boulevard features a wide, landscaped pedestrian linear park along the convention hall side, but it is not an uninterrupted bike expressway. Cyclists encounter heavy pedestrian foot traffic, hotel shuttle staging, taxi/rideshare turnouts, and cross-driveway conflicts. Additionally, the park terminates at Henderson Street, requiring cyclists to cross multi-lane surface streets under the Pontchartrain Expressway to connect into the Lower Garden District.",
  },
  {
    question: "What is the safest walking route between the Lower Garden District and French Quarter?",
    answer:
      "Magazine Street through the Warehouse/Arts District is the most practical walking corridor. It offers continuous sidewalks, active storefronts, cafes, and reliable pedestrian lighting. Cross the elevated Pontchartrain Expressway (Calliope/Howard corridor) at the signalized Magazine Street crosswalk, continue through the CBD to Poydras Street, and cross Canal Street at Magazine/Decatur directly into the French Quarter.",
  },
  {
    question: "Why should cyclists avoid Magazine Street, and what is the better alternative?",
    answer:
      "Magazine Street is narrow, carries steady vehicular traffic, and features dense curbside parallel parking with constant 'door-zone' danger and double-parked delivery vans. For bicycling Uptown toward the Lower Garden District, Baronne Street provides a designated bike lane through the CBD, connecting across to quieter Lower Garden District residential streets like Constance Street.",
  },
  {
    question: "How should visitors cross beneath the Pontchartrain Expressway / Crescent City Connection?",
    answer:
      "The expressway underpass (Calliope and Howard streets) features high-speed highway on-ramps and off-ramps with blind turning angles. Never cross mid-block. Only cross at signalized intersections with pedestrian countdown heads (such as Magazine Street, Camp Street, or St. Charles Avenue), wait for the walk signal, and verify that turning vehicles have come to a complete stop.",
  },
];

export default function FrenchQuarterWalkingGuide() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Walking and Biking Between the French Quarter, CBD, and Lower Garden District",
    description:
      "A realistic, fact-checked pedestrian and bicycle mobility guide connecting New Orleans' Lower Garden District, Warehouse/CBD, and French Quarter.",
    author: {
      "@type": "Organization",
      name: "Welcome to New Orleans Tours",
      url: "https://www.welcometoneworleanstours.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Welcome to New Orleans Tours",
      url: "https://www.welcometoneworleanstours.com",
    },
    datePublished: "2026-03-19T08:00:00.000Z",
    dateModified: "2026-03-19T08:00:00.000Z",
    mainEntityOfPage: "https://www.welcometoneworleanstours.com/french-quarter-walking-guide",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <article className="min-h-screen bg-[#FAF7F2] text-[#2C1810] w-full max-w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <header className="border-b border-[#E6DEC8] bg-[#F4EFE6] px-4 py-8 sm:px-6 sm:py-12 md:py-16 w-full max-w-full">
        <div className="mx-auto max-w-5xl min-w-0">
          <div className="inline-flex items-center gap-2 rounded border border-[#C8831A]/30 bg-[#FAF7F2] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#A6610E]">
            <span>Local Mobility & Transit Guide</span>
          </div>
          <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-2xl font-bold leading-tight sm:text-3xl md:text-5xl text-[#2C1810] break-words">
            Walking and Biking Between the French Quarter, CBD, and Lower Garden District
          </h1>
          <p className="mt-5 max-w-3xl text-base sm:text-lg leading-relaxed text-[#5A4535]">
            Navigating between the Lower Garden District (LGD), Warehouse/Arts District, Central Business District (CBD), and French Quarter involves real urban obstacles: working maritime port boundaries, an elevated interstate barrier, streetcar track grooves, and narrow historic corridors. Here are the realistic, fact-checked routes that work on the ground.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs tracking-wider text-[#7A6555]">
            <span className="rounded bg-[#EFE7D8] px-2.5 py-1 text-[#A6610E] font-semibold">Last Updated: March 2026</span>
            <span>•</span>
            <span>Field verified across downtown New Orleans corridors</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl min-w-0 space-y-10 px-4 py-8 sm:px-6 sm:py-10 md:space-y-12 md:py-14 w-full">

        {/* Advisory Box */}
        <div className="border-l-4 border-[#C8831A] bg-[#F7F2E7] p-6 text-sm leading-relaxed text-[#5A4535] rounded-r shadow-sm">
          <p className="font-bold uppercase tracking-wider text-[#A6610E]">Condition Notice</p>
          <p className="mt-2 text-[#4A3525]">
            Urban infrastructure in New Orleans changes frequently due to municipal drainage and road repairs, festival street closures, and active cruise ship berthing schedules. Never rely on automated navigation apps that treat industrial port access roads as public bike trails. Always yield to pedestrian signals and look both ways before crossing active streetcar tracks.
          </p>
        </div>

        {/* Section 1: Riverfront Reality */}
        <section className="space-y-5">
          <div className="border-b border-[#E2D7C3] pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A6610E]">Question 1</p>
            <h2 className="mt-1 font-[var(--font-accent)] text-2xl font-bold md:text-3xl text-[#2C1810]">
              Is the Riverfront Path Continuous? (No — Why It Stops)
            </h2>
          </div>
          <p className="leading-relaxed text-[#5A4535]">
            A frequent assumption by visitors looking at a map of New Orleans is that they can casually walk or bike along the Mississippi River from the Lower Garden District all the way into the French Quarter. <strong className="text-[#2C1810]">This path is not continuous.</strong>
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-[#DCD0BA] bg-white p-6 rounded shadow-sm">
              <h3 className="text-lg font-bold text-[#A6610E]">What Exists: French Quarter Riverfront</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5A4535]">
                Starting from the French Market and Gov. Nicholls Street, <strong className="text-[#2C1810]">Woldenberg Riverfront Park</strong> provides a continuous brick-and-concrete pedestrian promenade past Jackson Square down to the Canal Street Ferry Terminal and the Riverwalk Marketplace. This is scenic, safe, and pleasant for walking.
              </p>
            </div>
            <div className="border border-[#E5B5B5] bg-[#FDF2F2] p-6 rounded shadow-sm">
              <h3 className="text-lg font-bold text-[#A82828]">The Barrier: Port Cruise Terminals</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#6E2A2A]">
                Moving upriver past Poydras Street and Julia Street, public access ends abruptly. The <strong className="text-[#2C1810]">Julia Street Cruise Terminal</strong> and <strong className="text-[#2C1810]">Erato Street Cruise Terminal</strong> are active, federally secured commercial maritime facilities under Coast Guard and Port of New Orleans jurisdiction.
              </p>
            </div>
          </div>
          <p className="leading-relaxed text-[#5A4535]">
            Perimeter chain-link security fences, motorized luggage staging ramps, restricted wharf gates, active rail switching spurs, and permanent concrete floodwalls prevent any water-edge through-passage. Anyone attempting to hug the river between Henderson Street (Lower Garden District) and Poydras Street will run directly into dead ends and security checkpoints. <strong className="text-[#2C1810]">You must move inland to city streets.</strong>
          </p>
        </section>

        {/* Section 2: Convention Center Boulevard */}
        <section className="space-y-5">
          <div className="border-b border-[#E2D7C3] pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A6610E]">Question 2</p>
            <h2 className="mt-1 font-[var(--font-accent)] text-2xl font-bold md:text-3xl text-[#2C1810]">
              Convention Center Boulevard: What It Does & Does Not Provide
            </h2>
          </div>
          <p className="leading-relaxed text-[#5A4535]">
            The Ernest N. Morial Convention Center completed a major multi-million-dollar transformation of Convention Center Boulevard into a 7.5-block landscaped pedestrian corridor between Poydras Street and Henderson Street.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded border border-[#DCD0BA] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#2C1810] flex items-center gap-2">
                <span className="text-[#258544]">✔</span> What It Does Provide
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-[#5A4535]">
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">•</span>
                  <span>A broad, beautifully landscaped <strong className="text-[#2C1810]">pedestrian linear park</strong> on the building side with shade trees, benches, water features, and decorative lighting.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">•</span>
                  <span>Smooth, level concrete walking surfaces far superior to historic broken flagstone banquettes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">•</span>
                  <span>A safe walking corridor between the Warehouse District hotels, the Outlet Collection at Riverwalk, and Poydras Street.</span>
                </li>
              </ul>
            </div>
            <div className="rounded border border-[#DCD0BA] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#2C1810] flex items-center gap-2">
                <span className="text-[#B91C1C]">✖</span> What It Does Not Provide
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-[#5A4535]">
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">•</span>
                  <span><strong className="text-[#2C1810]">Not a dedicated bike highway:</strong> It is designed for strolling pedestrians and convention attendees. Cyclists face high foot traffic and low pedestrian awareness.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">•</span>
                  <span><strong className="text-[#2C1810]">Driveway and bus conflicts:</strong> Frequent hotel shuttle staging bays, taxi stands, and loading bays cross the corridor.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">•</span>
                  <span><strong className="text-[#2C1810]">The Southern Dead-End:</strong> At Henderson Street, the linear park terminates. You are deposited at industrial Tchoupitoulas / Calliope Street beneath expressway ramps without a continuing off-street bike path.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Safest Street-by-Street Corridors */}
        <section className="space-y-5">
          <div className="border-b border-[#E2D7C3] pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A6610E]">Question 3</p>
            <h2 className="mt-1 font-[var(--font-accent)] text-2xl font-bold md:text-3xl text-[#2C1810]">
              Walking vs. Biking: The Best Street-by-Street Options
            </h2>
          </div>
          <p className="leading-relaxed text-[#5A4535]">
            Because riverfront passage is blocked and Convention Center Boulevard stops at Henderson Street, you need specific inland streets to travel between the Lower Garden District and the French Quarter.
          </p>

          <div className="space-y-5">
            {/* Corridor A: Magazine Street */}
            <div className="border border-[#DCD0BA] bg-white p-6 rounded shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE7D8] pb-3">
                <h3 className="text-xl font-bold text-[#2C1810]">Magazine Street Corridor</h3>
                <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                  <span className="rounded bg-[#EAF5EC] px-2.5 py-1 text-[#1E7A38]">Best for Walking</span>
                  <span className="rounded bg-[#FDF2F2] px-2.5 py-1 text-[#B91C1C]">High Caution for Bikes</span>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[#5A4535] leading-relaxed">
                <p>
                  <strong className="text-[#2C1810]">Why it works for walking:</strong> Magazine Street is the cultural backbone of the Warehouse District and Lower Garden District. It features unbroken retail, coffee shops, galleries, restaurants, active foot traffic, and reliable street lighting.
                </p>
                <p>
                  <strong className="text-[#2C1810]">Why cyclists should be careful:</strong> Magazine Street is narrow with dense curbside parallel parking on both sides. Cyclists ride directly in the hazardous <em className="text-[#B91C1C] font-semibold">“door zone”</em> where parked car doors swing open without warning. In addition, delivery vans, food trucks, and rideshares routinely block lanes, forcing bikes into oncoming traffic.
                </p>
                <p>
                  <strong className="text-[#2C1810]">The walking route:</strong> Walk Magazine Street heading downtown from Coliseum Square / LGD. Cross under the Pontchartrain Expressway at the signalized Magazine/Calliope intersection, continue through the Warehouse/Arts District to Poydras Street, cross Canal Street at Magazine/Decatur, and you step directly onto Decatur Street in the French Quarter.
                </p>
              </div>
            </div>

            {/* Corridor B: Camp Street & Baronne Street */}
            <div className="border border-[#DCD0BA] bg-white p-6 rounded shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE7D8] pb-3">
                <h3 className="text-xl font-bold text-[#2C1810]">Camp Street & Baronne Street Corridors</h3>
                <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                  <span className="rounded bg-[#EFF6FF] px-2.5 py-1 text-[#1D4ED8]">Baronne: Striped Bike Lane</span>
                  <span className="rounded bg-[#F4EFE6] px-2.5 py-1 text-[#5A4535]">Camp: One-Way Uptown</span>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[#5A4535] leading-relaxed">
                <p>
                  <strong className="text-[#2C1810]">Baronne Street Bike Lane:</strong> For cyclists heading Uptown from the CBD into the Lower Garden District, Baronne Street offers a designated striped bike lane through the Central Business District. Once you reach the Howard / Calliope underpass area, use signalized crossings to transition toward Coliseum Square or Constance Street.
                </p>
                <p>
                  <strong className="text-[#2C1810]">Camp Street Alternative:</strong> Camp Street runs one-way Uptown from Canal Street past Lafayette Square, Gallier Hall, and the Contemporary Arts Center (CAC), terminating directly at Coliseum Square Park in the Lower Garden District. Sidewalks are quieter for walking than Magazine, though cycling on Camp requires sharing a steady one-way vehicle lane without a dedicated bike lane.
                </p>
              </div>
            </div>

            {/* Corridor C: Constance & Annunciation */}
            <div className="border border-[#DCD0BA] bg-white p-6 rounded shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE7D8] pb-3">
                <h3 className="text-xl font-bold text-[#2C1810]">Constance Street & Annunciation Street (LGD Byways)</h3>
                <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                  <span className="rounded bg-[#EAF5EC] px-2.5 py-1 text-[#1E7A38]">Recommended for Neighborhood Biking</span>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[#5A4535] leading-relaxed">
                <p>
                  Within the Lower Garden District itself, <strong className="text-[#2C1810]">Constance Street</strong> and <strong className="text-[#2C1810]">Annunciation Street</strong> offer much lower vehicular speed and volume than Magazine or Tchoupitoulas.
                </p>
                <p>
                  Neighborhood riders frequently use Constance to bypass Magazine Street congestion when moving between Jackson Avenue, Felicity Street, and the expressway underpass. Note: pavement quality varies with occasional deep asphalt patches and tree root heaves, so high-intensity bike headlights are mandatory after dusk.
                </p>
              </div>
            </div>

            {/* Corridor D: St. Charles Avenue */}
            <div className="border border-[#DCD0BA] bg-white p-6 rounded shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE7D8] pb-3">
                <h3 className="text-xl font-bold text-[#2C1810]">St. Charles Avenue Corridor</h3>
                <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                  <span className="rounded bg-[#EAF5EC] px-2.5 py-1 text-[#1E7A38]">Classic Walk</span>
                  <span className="rounded bg-[#EFF6FF] px-2.5 py-1 text-[#1D4ED8]">$1.25 Streetcar Transit</span>
                  <span className="rounded bg-[#FDF2F2] px-2.5 py-1 text-[#B91C1C]">Extreme Caution: Rail Traps</span>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[#5A4535] leading-relaxed">
                <p>
                  <strong className="text-[#2C1810]">Walking St. Charles Avenue:</strong> Broad sidewalks, continuous live oak canopies, historic architecture, and consistent pedestrian presence make St. Charles a magnificent daytime walk between the CBD and Garden District.
                </p>
                <p>
                  <strong className="text-[#2C1810]">Transit Alternative:</strong> If you want to bypass walking under the elevated highway altogether, the historic St. Charles Streetcar (RTA Route 12) runs 24 hours a day. The fare is just $1.25 (exact change or Le Pass app), picking up along Carondelet/St. Charles in the CBD and dropping off throughout the Lower Garden District.
                </p>
                <p>
                  <strong className="text-[#B91C1C] font-bold">Severe Cycling Danger:</strong> Never ride a bicycle along or inside the St. Charles Avenue neutral ground streetcar tracks. The steel rails are set into historic cobbles and asphalt with flangeway gaps that match bicycle tire widths. Getting a front tire trapped in a rail will throw a rider over the handlebars in a fraction of a second.
                </p>
              </div>
            </div>

            {/* Corridor E: Streets to Avoid */}
            <div className="border border-[#E5B5B5] bg-[#FDF5F5] p-6 rounded shadow-sm">
              <h3 className="text-xl font-bold text-[#A82828]">Streets to Strictly Avoid for Casual Biking</h3>
              <ul className="mt-4 space-y-3 text-sm text-[#6E2A2A] leading-relaxed">
                <li>
                  <strong className="text-[#2C1810]">Tchoupitoulas Street:</strong> While it runs directly between the LGD and CBD, Tchoupitoulas is an active heavy industrial trucking artery serving the Port of New Orleans wharves, river warehouses, and grocery logistics. 18-wheelers, blind driveway exits, railroad tracks, and broken road shoulders make this extremely hazardous for casual cyclists.
                </li>
                <li>
                  <strong className="text-[#2C1810]">Poydras Street:</strong> A 6-to-8-lane high-speed business thoroughfare. Cross it perpendicularly at signalized crosswalks, but avoid riding along it.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Route Comparison Table */}
        <section className="space-y-5">
          <div className="border-b border-[#E2D7C3] pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A6610E]">At A Glance</p>
            <h2 className="mt-1 font-[var(--font-accent)] text-2xl font-bold md:text-3xl text-[#2C1810]">
              Corridor Comparison Matrix
            </h2>
          </div>
          <div className="w-full max-w-full min-w-0 overflow-x-auto rounded border border-[#DCD0BA] bg-white shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2D7C3] bg-[#F4EFE6] text-[#2C1810]">
                  <th className="p-3.5 font-bold">Corridor</th>
                  <th className="p-3.5 font-bold">Walking Comfort</th>
                  <th className="p-3.5 font-bold">Biking Comfort</th>
                  <th className="p-3.5 font-bold">Primary Consideration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7D8] text-[#5A4535]">
                <tr>
                  <td className="p-3.5 font-bold text-[#2C1810]">Magazine Street</td>
                  <td className="p-3.5 font-semibold text-[#1E7A38]">High (Recommended)</td>
                  <td className="p-3.5 font-semibold text-[#B91C1C]">Low (Door-zone hazard)</td>
                  <td className="p-3.5">Active commercial corridor; shops, cafes, lighting.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#2C1810]">Baronne / Carondelet</td>
                  <td className="p-3.5">Moderate</td>
                  <td className="p-3.5 font-semibold text-[#1E7A38]">High (Designated bike lane)</td>
                  <td className="p-3.5">Striped bike lane Uptown; best cycling link from CBD.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#2C1810]">Camp Street</td>
                  <td className="p-3.5 font-semibold text-[#1E7A38]">Good</td>
                  <td className="p-3.5">Moderate (Shared lane)</td>
                  <td className="p-3.5">One-way Uptown; leads directly into Coliseum Square.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#2C1810]">Convention Center Blvd</td>
                  <td className="p-3.5 font-semibold text-[#1E7A38]">High (Linear Park)</td>
                  <td className="p-3.5">Low-Moderate</td>
                  <td className="p-3.5">Pedestrian park; ends abruptly at Henderson Street.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#2C1810]">St. Charles Avenue</td>
                  <td className="p-3.5 font-semibold text-[#1E7A38]">High (Scenic)</td>
                  <td className="p-3.5 font-semibold text-[#B91C1C]">High Risk (Rail traps)</td>
                  <td className="p-3.5">Use sidewalks to walk or take $1.25 streetcar. Avoid biking.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#2C1810]">Tchoupitoulas Street</td>
                  <td className="p-3.5 font-semibold text-[#B91C1C]">Low</td>
                  <td className="p-3.5 font-semibold text-[#B91C1C]">Severe Risk</td>
                  <td className="p-3.5">Industrial container trucks, port traffic. Do not bike.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#2C1810]">Riverfront Promenade</td>
                  <td className="p-3.5">FQ only (Partial)</td>
                  <td className="p-3.5 font-semibold text-[#B91C1C]">Blocked Upriver</td>
                  <td className="p-3.5">Closed at cruise terminals; no through-path past Poydras.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Highway Barrier & Night Safety */}
        <section className="space-y-5">
          <div className="border-b border-[#E2D7C3] pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A6610E]">Critical Hazards</p>
            <h2 className="mt-1 font-[var(--font-accent)] text-2xl font-bold md:text-3xl text-[#2C1810]">
              The Expressway Underpass & Nighttime Safety
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-[#DCD0BA] bg-white p-6 rounded shadow-sm">
              <h3 className="text-lg font-bold text-[#2C1810]">The Pontchartrain Expressway Barrier</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5A4535]">
                The geographic boundary separating the Warehouse/CBD from the Lower Garden District is the elevated <strong className="text-[#2C1810]">Crescent City Connection (CCC / US-90B)</strong> bridge structure along Calliope and Howard streets.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#5A4535]">
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">1.</span>
                  <span><strong className="text-[#2C1810]">Vehicles move fast:</strong> Vehicles exiting the bridge ramp onto Calliope Street are decelerating from 55+ mph highway speeds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">2.</span>
                  <span><strong className="text-[#2C1810]">Blind concrete pillars:</strong> Bridge support pillars create visual blind spots where turning vehicles cannot easily see cyclists or pedestrians.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">3.</span>
                  <span><strong className="text-[#2C1810]">The Rule:</strong> Only cross Calliope and Howard at signalized intersections with painted crosswalks—specifically at <strong className="text-[#2C1810]">Magazine Street</strong>, <strong className="text-[#2C1810]">Camp Street</strong>, or <strong className="text-[#2C1810]">St. Charles Avenue</strong>. Wait for the green walk icon and confirm all turning cars have stopped.</span>
                </li>
              </ul>
            </div>

            <div className="border border-[#DCD0BA] bg-white p-6 rounded shadow-sm">
              <h3 className="text-lg font-bold text-[#2C1810]">Nighttime Visibility & Route Selection</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5A4535]">
                New Orleans block-to-block lighting varies dramatically. When traveling after dark between the Lower Garden District and French Quarter:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#5A4535]">
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">1.</span>
                  <span><strong className="text-[#2C1810]">Stick to active corridors:</strong> Walk Magazine Street or St. Charles Avenue where restaurant patrons, open bars, and streetcar stops maintain active street presence.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">2.</span>
                  <span><strong className="text-[#2C1810]">Avoid isolated underpasses:</strong> Do not walk through unlit warehouse blocks near the port wharves, industrial rail sidings, or desolate underpasses late at night.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8831A] font-bold">3.</span>
                  <span><strong className="text-[#2C1810]">Bike lighting is legally required:</strong> Louisiana law requires a white front light visible from 500 feet and a red rear reflector or light. Pavement hazards like unpainted potholes demand active forward illumination.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 6: Authoritative Transportation Sources */}
        <section className="border-t border-[#E2D7C3] pt-8 space-y-4">
          <h2 className="text-lg font-bold text-[#2C1810]">Authoritative Maps & Official Transportation Sources</h2>
          <p className="text-sm text-[#5A4535]">
            Verify real-time conditions, transit schedules, and municipal bike networks with official regional authorities:
          </p>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 pt-2">
            <a
              href="https://www.norta.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#DCD0BA] bg-white p-4 rounded hover:border-[#C8831A] transition-colors shadow-sm"
            >
              <p className="font-bold text-sm text-[#A6610E]">New Orleans RTA</p>
              <p className="mt-1 text-xs text-[#5A4535]">Real-time streetcar and bus trackers; Le Pass mobile fare app.</p>
            </a>
            <a
              href="https://nola.gov/moving-new-orleans-bikes/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#DCD0BA] bg-white p-4 rounded hover:border-[#C8831A] transition-colors shadow-sm"
            >
              <p className="font-bold text-sm text-[#A6610E]">City of New Orleans MNOB</p>
              <p className="mt-1 text-xs text-[#5A4535]">Moving New Orleans Bikes network map & street construction notices.</p>
            </a>
            <a
              href="https://bikeeasy.net/resources/maps/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#DCD0BA] bg-white p-4 rounded hover:border-[#C8831A] transition-colors shadow-sm"
            >
              <p className="font-bold text-sm text-[#A6610E]">Bike Easy New Orleans</p>
              <p className="mt-1 text-xs text-[#5A4535]">Local non-profit bike maps, safe route guides & commuter resources.</p>
            </a>
            <a
              href="https://www.portnola.com/cruise"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#DCD0BA] bg-white p-4 rounded hover:border-[#C8831A] transition-colors shadow-sm"
            >
              <p className="font-bold text-sm text-[#A6610E]">Port of New Orleans</p>
              <p className="mt-1 text-xs text-[#5A4535]">Official cruise terminal access maps, berth schedules & port security.</p>
            </a>
          </div>
        </section>

        {/* Section 7: FAQs */}
        <section className="border-t border-[#E2D7C3] pt-8 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A6610E]">Frequently Asked Questions</p>
            <h2 className="mt-1 font-[var(--font-accent)] text-2xl font-bold md:text-3xl text-[#2C1810]">
              Practical Mobility Questions Answered
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {FAQS.map((faq) => (
              <div key={faq.question} className="border border-[#DCD0BA] bg-white p-6 rounded shadow-sm">
                <h3 className="text-base font-bold text-[#2C1810]">{faq.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5A4535]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subordinate Contextual Tour Assistance */}
        <section className="border border-[#DCD0BA] bg-[#F4EFE6] p-6 rounded shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A6610E]">Visiting New Orleans?</p>
          <h2 className="mt-2 text-xl font-bold text-[#2C1810]">Explore City Planning & Tours</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5A4535]">
            Welcome to New Orleans Tours provides practical, fact-checked information to help travelers choose appropriate experiences. If you are comparing walking tours, swamp trips, or limited-mobility logistics, consult our planning resources:
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
            <Link
              href="/french-quarter-welcome-stop"
              className="border border-[#C8831A] bg-[#C8831A] text-white px-4 py-2.5 hover:bg-[#A6610E] transition-colors rounded font-semibold"
            >
              Tour Concierge by Appointment
            </Link>
            <Link
              href="/guides/new-orleans-tours-limited-mobility"
              className="border border-[#C8831A] text-[#A6610E] bg-white px-4 py-2.5 hover:bg-[#F4EFE6] transition-colors rounded font-semibold"
            >
              Limited Mobility Guide
            </Link>
            <Link
              href="/guides/new-orleans-tours-near-french-quarter"
              className="border border-[#C8831A] text-[#A6610E] bg-white px-4 py-2.5 hover:bg-[#F4EFE6] transition-colors rounded font-semibold"
            >
              Tours Near French Quarter
            </Link>
            <Link
              href="/help-me-choose"
              className="border border-[#C8831A] text-[#A6610E] bg-white px-4 py-2.5 hover:bg-[#F4EFE6] transition-colors rounded font-semibold"
            >
              Help Me Choose
            </Link>
          </div>
        </section>

        {/* Internal Breadcrumb / Navigation */}
        <nav className="border-t border-[#E2D7C3] pt-6 flex flex-wrap gap-5 text-sm font-semibold">
          <Link className="text-[#A6610E] hover:underline" href="/">Home</Link>
          <Link className="text-[#A6610E] hover:underline" href="/guides">All Guides</Link>
          <Link className="text-[#A6610E] hover:underline" href="/areas/french-quarter">French Quarter</Link>
          <Link className="text-[#A6610E] hover:underline" href="/tours">All Tours</Link>
          <Link className="text-[#A6610E] hover:underline" href="/contact">Contact</Link>
        </nav>

      </div>
    </article>
  );
}
