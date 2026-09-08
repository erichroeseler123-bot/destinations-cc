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
  { href: "/garden-district-tours", title: "Garden District walking tours", copy: "Choose a dedicated walk or a broader city tour that includes the neighborhood." },
  { href: "/guides/best-swamp-tour-with-transportation", title: "Swamp tours with transportation", copy: "Compare pickup, travel time and boat format before booking." },
  { href: "/compare/whitney-vs-oak-alley", title: "Whitney vs Oak Alley", copy: "Compare historical focus, setting and practical trip fit." },
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

          <div className={styles.heroFrameWrap}>
            <div className={styles.heroFrame}>
              <div className={styles.heroFrameInner}>
                <img
                  src="/images/new-orleans/hero-french-quarter-balcony.jpg"
                  alt="Historic French Quarter wrought iron balcony"
                  className={styles.heroFrameImage}
                />
              </div>
              <span className={`${styles.frameCorner} ${styles.cornerTl}`} aria-hidden="true">⚜</span>
              <span className={`${styles.frameCorner} ${styles.cornerTr}`} aria-hidden="true">⚜</span>
              <span className={`${styles.frameCorner} ${styles.cornerBl}`} aria-hidden="true">⚜</span>
              <span className={`${styles.frameCorner} ${styles.cornerBr}`} aria-hidden="true">⚜</span>
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
          <a href="tel:+15044849687" className={`${styles.action} ${styles.greenAction}`}>
            <span className={styles.actionIcon}>☎</span>
            <span>
              <strong>Call or Text</strong>
              <small>504-484-9687</small>
            </span>
            <b>›</b>
          </a>
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
          <div><span>⚜</span><strong>Local Concierge Support</strong></div>
        </div>
      </section>
    </div>
  );
}
