import React from "react";
import Link from "next/link";
import styles from "./newOrleansVisual.module.css";

export function NewOrleansHeroFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className={styles.heroContainer}>
      <div className={styles.heroBackground}></div>
      <div className={styles.heroOverlay}></div>
      <div className={styles.heroContent}>
        {children}
      </div>
    </section>
  );
}

export function DecorativeDivider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <div className={styles.dividerLine}></div>
      <svg className={styles.fleurDeLis} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3c-1.5 3-4 5-4 8 0 2 1.5 3 4 3s4-1 4-3c0-3-2.5-5-4-8z" />
        <path d="M12 14c-3 0-6 1.5-6 4s1.5 3 3 3h6c1.5 0 3-1.5 3-3s-3-4-6-4z" />
        <path d="M7 11c-2-1-4 0-4 2 0 1.5 1.5 3 3 3h2" />
        <path d="M17 11c2-1 4 0 4 2 0 1.5-1.5 3-3 3h-2" />
      </svg>
      <div className={styles.dividerLine}></div>
    </div>
  );
}

export function ConnectedBoard({
  children,
  promptBanner
}: {
  children: React.ReactNode;
  promptBanner?: string;
}) {
  return (
    <div className={styles.boardContainer}>
      {promptBanner && (
        <div className={`${styles.promptBanner} ${styles.accentFont}`}>
          {promptBanner}
        </div>
      )}
      <div className={styles.boardGrid}>
        {children}
      </div>
    </div>
  );
}

type ChoiceCardProps =
  | {
      mode: "link";
      href: string;
      onClick?: never;
      title: string;
      desc: string;
      cta: string;
      iconType: "city" | "swamp" | "plantation" | "notsure";
      illustration: React.ReactNode;
      isActive?: boolean;
      showOrMarker?: boolean;
    }
  | {
      mode: "action";
      onClick: () => void;
      href?: never;
      title: string;
      desc: string;
      cta: string;
      iconType: "city" | "swamp" | "plantation" | "notsure";
      illustration: React.ReactNode;
      isActive?: boolean;
      showOrMarker?: boolean;
    };

export function NewOrleansChoiceCard(props: ChoiceCardProps) {
  const cardClass = `${styles.choiceCard} ${
    props.iconType === "city"
      ? styles.cardCity
      : props.iconType === "swamp"
      ? styles.cardSwamp
      : props.iconType === "plantation"
      ? styles.cardPlantation
      : styles.cardNotSure
  }`;

  const innerContent = (
    <>
      <div className={styles.illustration}>{props.illustration}</div>
      <h2 className={`${styles.cardTitle} ${styles.displayFont}`}>{props.title}</h2>
      <p className={`${styles.cardCopy} ${styles.sansFont}`}>{props.desc}</p>
      <span className={`${styles.buttonPrimary} ${styles.sansFont}`}>{props.cta}</span>
    </>
  );

  return (
    <div className={styles.choiceCardWrapper}>
      {props.mode === "link" ? (
        <Link href={props.href} className={cardClass} aria-label={`${props.title} - ${props.desc}`}>
          {innerContent}
        </Link>
      ) : (
        <button
          onClick={props.onClick}
          className={cardClass}
          aria-pressed={props.isActive}
        >
          {innerContent}
        </button>
      )}
      {props.showOrMarker && (
        <div className={styles.orMarker}>OR</div>
      )}
    </div>
  );
}
