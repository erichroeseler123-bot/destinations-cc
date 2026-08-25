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
