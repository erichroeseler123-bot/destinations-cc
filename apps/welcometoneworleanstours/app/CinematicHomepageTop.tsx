import Link from "next/link";
import styles from "./cinematic-home-gold.module.css";

const categories = [
  { href: "/city-tours", title: "City Tours", tag: "French Quarter", copy: "Explore the Big Easy", image: "/images/travel-markets/new-orleans/french-quarter-street.jpg", icon: "⚜", ribbon: "purple" },
  { href: "/swamp-tours", title: "Swamps & Airboats", tag: "Bayou & Wilds", copy: "Wild. Mysterious. Unforgettable.", image: "/images/travel-markets/new-orleans/airboat-swamp.png", icon: "⌁", ribbon: "gold" },
  { href: "/riverboat-cruises", title: "River Cruises", tag: "Mississippi", copy: "See the city from the water", image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg", icon: "◉", ribbon: "green" },
  { href: "/plantation-tours", title: "Plantations", tag: "Historic River Road", copy: "History beneath the oaks", image: "/images/wikimedia/originals/oak-alley-front.jpg", icon: "▥", ribbon: "purple" },
  { href: "/food-tours", title: "Food & Cocktails", tag: "Creole Flavors", copy: "Savor the flavors of New Orleans", image: "/images/wikimedia/originals/gumbo-dish.jpg", icon: "✣", ribbon: "gold" },
  { href: "/ghost-tours", title: "Ghosts & Cemetery", tag: "Haunted History", copy: "Haunted history. True stories.", image: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg", icon: "✦", ribbon: "green" },
  { href: "/garden-district-tours", title: "Garden District", tag: "Mansions & Oaks", copy: "Gorgeous homes. Timeless charm.", image: "/images/new-orleans/hero-french-quarter-balcony.jpg", icon: "❧", ribbon: "purple" },
  { href: "/jazz-music-tours", title: "Jazz / Music", tag: "Live Sound", copy: "The soul of New Orleans", image: "/images/wikimedia/originals/french-quarter-night.jpg", icon: "♪", ribbon: "gold" },
];

const popularDecisions = [
  { href: "/guides/best-new-orleans-swamp-tour", title: "Which swamp tour is best?", copy: "Compare covered boats, airboats, transportation and group fit." },
  { href: "/garden-district-tours", title: "Garden District & City Tours", copy: "Explore the Garden District via air-conditioned city tour with cemetery stops." },
  { href: "/guides/best-swamp-tour-with-transportation", title: "Swamp tours with transportation", copy: "Compare pickup, travel time and boat format before booking." },
  { href: "/compare/whitney-vs-oak-alley", title: "Whitney vs Oak Alley", copy: "Compare historical focus, setting and practical trip fit." },
];

const bookTodayChoices = [
  {
    href: "/tours/covered-tour-boat?src=wtonot-home",
    slug: "covered-tour-boat",
    badge: "Swamp & Bayou",
    title: "Best fit for wildlife & bayou scenery (with shuttle option)",
    operator: "Ragin Cajun Tours",
    priceContext: "From $35 self-drive / $60 with shuttle (live dates & rates confirmed at checkout)",
    duration: "Approx. 3.5–4 hrs with shuttle / 1.5–2 hrs on water",
    transportation: "Hotel pickup & return shuttle options available; pickup point confirmed at checkout",
    groupFit: "Best fit for families, mixed ages, and shaded comfort on the bayou",
  },
  {
    href: "/tours/city-tour-of-new-orleans?src=wtonot-home",
    slug: "city-tour-of-new-orleans",
    badge: "City & Garden District",
    title: "Best fit for first-time orientation (French Quarter & Garden District)",
    operator: "Southern Style Tours",
    priceContext: "Minibus overview · Live rates & dates confirmed at checkout",
    duration: "Approx. 2.5–3 hours",
    transportation: "Minibus with AC; pickup zone confirmed at checkout",
    groupFit: "Best fit for first-time visitors seeking comprehensive neighborhood context",
  },
  {
    href: "/tours/all-day-city-plantation-combo?src=wtonot-home",
    slug: "all-day-city-plantation-combo",
    badge: "Full-Day Combo",
    title: "Best fit for a full-day history itinerary (City + Plantation Combo)",
    operator: "Southern Style Tours",
    priceContext: "Full-day combination · Live rates & dates confirmed at checkout",
    duration: "8 hours total door-to-door commitment",
    transportation: "Morning pickup window (8:00–8:30 a.m.) included; confirmed at checkout",
    groupFit: "Best fit for travelers wanting city highlights and historic River Road in one planned day",
  },
  {
    href: "/tours/evening-jazz-cruise?src=wtonot-home",
    slug: "evening-jazz-cruise",
    badge: "Evening River Cruise",
    title: "Best fit for an evening on the water (Live Jazz River Cruise)",
    operator: "New Orleans Steamboat Company",
    priceContext: "Sightseeing from $58; optional dinner seating up to $95–$105 confirmed at checkout",
    duration: "Boards 6:00 PM, sails 7:00–9:00 PM (2 hrs on water)",
    transportation: "Departs Toulouse St Wharf (Riverfront); central French Quarter boarding",
    groupFit: "Best fit for evening river atmosphere, live Dukes of Dixieland jazz, and skyline views",
  },
];

export default function CinematicHomepageTop() {
  return (
    <div className={styles.wrap} data-wno-home-theme="black-gold-v2">
      {/* Top decorative Mardi Gras bead stripe */}
      <div className={styles.mardiGrasStripe} aria-hidden="true">
        <span className={styles.stripePurple} />
        <span className={styles.stripeGold} />
        <span className={styles.stripeGreen} />
      </div>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.copyBlock}>
            <p className={styles.eyebrow}>Find the right</p>
            <h1 className={styles.headline}>
              New Orleans
              <span className={styles.script}>experience</span>
              for your group
            </h1>
            <div className={styles.divider}>
              <span />
              <b>⚜</b>
              <span />
            </div>
            <p className={styles.lede}>
              New Orleans is better when you choose the right experience. Tell us who you’re traveling with and what kind of day you want. We’ll narrow the city down to the experiences that actually fit.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/help-me-choose" className={styles.heroPrimaryBtn}>
                <span className={styles.btnFleur}>⚜</span>
                <span>Help Me Choose</span>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/help-me-choose" className={`${styles.action} ${styles.purpleAction}`}>
            <span className={styles.actionIcon}>⚜</span>
            <span>
              <strong>Help Me Choose</strong>
              <small>Answer a few questions</small>
            </span>
            <b>›</b>
          </Link>
          <Link href="/guides/things-to-do-in-new-orleans-today" className={`${styles.action} ${styles.goldAction}`}>
            <span className={styles.actionIcon}>⚜</span>
            <span>
              <strong>Find Something Today</strong>
              <small>See what fits right now</small>
            </span>
            <b>›</b>
          </Link>
          <a
            href="tel:+15044849687"
            className={`${styles.action} ${styles.greenAction}`}
            data-wno-event="contact_phone_clicked"
            data-wno-label="504-484-9687"
          >
            <span className={styles.actionIcon}>☎</span>
            <span>
              <strong>Call or Text</strong>
              <small>504-484-9687</small>
            </span>
            <b>›</b>
          </a>
        </div>
      </section>

      <section className={styles.bookTodaySection} aria-labelledby="book-today-heading">
        <div className={styles.bookTodayInner}>
          <div className={styles.bookTodayHeader}>
            <p className={styles.bookTodayEyebrow}>Book today · Verified live experiences</p>
            <h2 id="book-today-heading" className={styles.bookTodayTitle}>Choose the experience that fits your group</h2>
            <p className={styles.bookTodayIntro}>Direct operator booking with confirmed schedules, transparent logistics, and honest pricing.</p>
          </div>
          <div className={styles.bookTodayGrid}>
            {bookTodayChoices.map((choice) => (
              <article key={choice.slug} className={styles.bookCard}>
                <div className={styles.bookCardBadgeWrap}>
                  <span className={styles.bookCardBadge}>{choice.badge}</span>
                  <span className={styles.bookCardOperator}>{choice.operator}</span>
                </div>
                <h3 className={styles.bookCardTitle}>{choice.title}</h3>
                <div className={styles.bookCardMeta}>
                  <p className={styles.bookCardMetaRow}><strong>Duration:</strong> {choice.duration}</p>
                  <p className={styles.bookCardMetaRow}><strong>Transportation:</strong> {choice.transportation}</p>
                  <p className={styles.bookCardMetaRow}><strong>Group fit:</strong> {choice.groupFit}</p>
                  <div className={styles.bookCardPriceRow}>
                    <span>{choice.priceContext}</span>
                  </div>
                </div>
                <Link
                  href={choice.href}
                  className={styles.bookCardCta}
                  data-wno-event="booking_button_clicked"
                  data-wno-label={`Check Live Dates - ${choice.title}`}
                  data-wno-product={choice.slug}
                >
                  Check live dates →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Decorative old-world section divider */}
      <div className={styles.ornateDivider} aria-hidden="true">
        <span />
        <b className={styles.fleurCenter}>⚜</b>
        <span />
      </div>

      <section className={styles.popularSection}>
        <div className={styles.popularInner}>
          <p className={styles.popularEyebrow}>Most visitors start here</p>
          <h2 className={styles.popularTitle}>Make the big tour decisions first</h2>
          <div className={styles.popularGrid}>
            {popularDecisions.map((decision) => (
              <Link key={decision.href} href={decision.href} className={styles.decisionCard}>
                <h3>{decision.title}</h3>
                <p>{decision.copy}</p>
                <span className={styles.decisionLink}>Compare options →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.discovery}>
        <div className={styles.discoveryTitle}>
          <span />
          <div>
            <h2>Explore New Orleans Your Way</h2>
            <p>Handpicked experiences. Local help. Better decisions.</p>
          </div>
          <span />
        </div>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <Link
              href={category.href}
              className={`${styles.categoryCard} ${styles[`ribbon_${category.ribbon}`]}`}
              key={category.title}
            >
              <div className={styles.cardRibbon}>{category.tag}</div>
              <div className={styles.categoryImageWrap}>
                <img src={category.image} alt={category.title} loading="lazy" />
              </div>
              <div className={styles.categoryText}>
                <h3>{category.title}</h3>
                <p>{category.copy}</p>
                <span className={styles.exploreLink}>Explore →</span>
              </div>
            </Link>
          ))}
        </div>
        <div className={styles.trustStrip}>
          <div><span>⚜</span><strong>Trusted Local Partners</strong></div>
          <div><span>⚜</span><strong>Curated Experiences</strong></div>
          <div><span>⚜</span><strong>Local Tour Support</strong></div>
        </div>
      </section>
    </div>
  );
}
