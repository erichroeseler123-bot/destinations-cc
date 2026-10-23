import Image from "next/image";
import styles from "./HomeHero.module.css";

export default function HomeHero() {
  return (
    <section className={styles.shell} aria-labelledby="home-hero-title">
      <Image
        className={styles.image}
        src="/images/tours/temsco-mendenhall-glacier-walk.jpg"
        alt="Helicopter landed on glacier ice beneath the mountains near Juneau, Alaska"
        fill
        priority
        sizes="(max-width: 1180px) 100vw, 1120px"
      />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Every major Juneau helicopter operator, one place</p>
        <h1 id="home-hero-title">The Juneau helicopter tour your ship says is sold out may still have seats.</h1>
        <p className={styles.lede}>
          Compare TEMSCO, Coastal, and NorthStar for your exact port day. Book independently,
          protect your return window, and keep a backup plan ready.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#viator-featured-tours">Compare tours &amp; prices</a>
          <a className={styles.secondary} href="/helicopter-waitlist">Join the sold-out waitlist</a>
        </div>
        <ul className={styles.proof} aria-label="Juneau Flight Deck benefits">
          <li>All three operators</li>
          <li>Ship-day timing tools</li>
          <li>Weather backup options</li>
        </ul>
      </div>
    </section>
  );
}
