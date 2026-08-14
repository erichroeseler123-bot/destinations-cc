import Link from "next/link";
import styles from "./cinematicPageHero.module.css";

type HeroAction = {
  href: string;
  label: string;
  detail?: string;
  primary?: boolean;
};

type Props = {
  eyebrow: string;
  title: string;
  script?: string;
  intro: string;
  image?: string;
  actions?: HeroAction[];
};

export default function CinematicPageHero({
  eyebrow,
  title,
  script,
  intro,
  image = "/images/new-orleans/hero-french-quarter-balcony.jpg",
  actions = [],
}: Props) {
  return (
    <section className={styles.hero} style={{ ['--wno-page-hero' as string]: `url('${image}')` }}>
      <div className={styles.image} aria-hidden="true" />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        {script ? <div className={styles.script}>{script}</div> : null}
        <div className={styles.rule}><span /><b>⚜</b><span /></div>
        <p className={styles.intro}>{intro}</p>
        {actions.length ? (
          <div className={styles.actions}>
            {actions.map((action) => {
              const className = `${styles.action} ${action.primary ? styles.primary : ""}`;
              if (action.href.startsWith("tel:") || action.href.startsWith("sms:") || action.href.startsWith("#")) {
                return <a key={action.href + action.label} href={action.href} className={className}><strong>{action.label}</strong>{action.detail ? <small>{action.detail}</small> : null}</a>;
              }
              return <Link key={action.href + action.label} href={action.href} className={className}><strong>{action.label}</strong>{action.detail ? <small>{action.detail}</small> : null}</Link>;
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
