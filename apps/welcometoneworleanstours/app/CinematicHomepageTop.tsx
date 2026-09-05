import Link from "next/link";
import styles from "./cinematic-home-gold.module.css";

const categories = [
  { href: "/city-tours", title: "City Tours", copy: "Explore the Big Easy", image: "/images/travel-markets/new-orleans/french-quarter-street.jpg", icon: "⚜" },
  { href: "/swamp-tours", title: "Swamps & Airboats", copy: "Wild. Mysterious. Unforgettable.", image: "/images/travel-markets/new-orleans/airboat-swamp.png", icon: "⌁" },
  { href: "/riverboat-cruises", title: "River Cruises", copy: "See the city from the water", image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg", icon: "◉" },
  { href: "/plantation-tours", title: "Plantations", copy: "History beneath the oaks", image: "/images/wikimedia/originals/oak-alley-front.jpg", icon: "▥" },
  { href: "/food-tours", title: "Food & Cocktails", copy: "Savor the flavors of New Orleans", image: "/images/wikimedia/originals/gumbo-dish.jpg", icon: "✣" },
  { href: "/ghost-tours", title: "Ghosts & Cemetery", copy: "Haunted history. True stories.", image: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg", icon: "✦" },
  { href: "/garden-district-tours", title: "Garden District", copy: "Gorgeous homes. Timeless charm.", image: "/images/new-orleans/hero-french-quarter-balcony.jpg", icon: "❧" },
  { href: "/jazz-music-tours", title: "Jazz / Music", copy: "The soul of New Orleans", image: "/images/wikimedia/originals/french-quarter-night.jpg", icon: "♪" },
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
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.copyBlock}>
            <p className={styles.eyebrow}>Find the right</p>
            <h1 className={styles.headline}>
              New Orleans
              <span className={styles.script}>experience</span>
              for your group
            </h1>
            <div className={styles.divider}><span /><b>⚜</b><span /></div>
            <p className={styles.lede}>New Orleans is better when you choose the right experience. Tell us who you’re traveling with and what kind of day you want. We’ll narrow the city down to the experiences that actually fit.</p>
          </div>
        </div>
        <div className={styles.actions}>
          <Link href="/guides/things-to-do-in-new-orleans-today" className={`${styles.action} ${styles.goldAction}`}><span className={styles.actionIcon}>⚜</span><span><strong>Find Something Today</strong><small>See what fits right now</small></span><b>›</b></Link>
          <Link href="/help-me-choose" className={styles.action}><span className={styles.actionIcon}>✥</span><span><strong>Help Me Choose</strong><small>Answer a few questions</small></span><b>›</b></Link>
          <a href="tel:+15044849687" className={styles.action}><span className={styles.actionIcon}>☎</span><span><strong>Call or Text</strong><small>504-484-9687</small></span><b>›</b></a>
        </div>
      </section>

      <section className="border-y border-[#342b1d] bg-[#0b0a09] px-6 py-12 text-[#f8f1e5]">
        <div className="mx-auto max-w-6xl">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-[#c9a86a]">Most visitors start here</p>
          <h2 className="mt-3 font-serif text-3xl text-[#fff4dd] md:text-4xl">Make the big tour decisions first</h2>
          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {popularDecisions.map((decision) => (
              <Link key={decision.href} href={decision.href} className="group border border-[#342b1d] bg-[#12110e] p-5 transition hover:border-[#c9a86a]">
                <h3 className="font-serif text-xl text-[#f3dfb3]">{decision.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#b7ad9e]">{decision.copy}</p>
                <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.12em] text-[#c9a86a] group-hover:text-[#fff4dd]">Compare options →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.discovery}>
        <div className={styles.discoveryTitle}><span /> <div><h2>Explore New Orleans Your Way</h2><p>Handpicked experiences. Local help. Better decisions.</p></div> <span /></div>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <Link href={category.href} className={styles.categoryCard} key={category.title}>
              <div className={styles.categoryImage}><img src={category.image} alt="" loading="lazy" /></div>
              <span className={styles.categoryIcon}>{category.icon}</span>
              <div className={styles.categoryText}><h3>{category.title}</h3><p>{category.copy}</p></div>
            </Link>
          ))}
        </div>
        <div className={styles.trustStrip}>
          <div><span>◇</span><strong>Trusted Local Partners</strong></div>
          <div><span>☆</span><strong>Curated Experiences</strong></div>
          <div><span>◌</span><strong>Local Concierge Support</strong></div>
        </div>
      </section>
    </div>
  );
}
