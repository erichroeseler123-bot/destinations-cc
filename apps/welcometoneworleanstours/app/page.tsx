import WnoHome from "../../../app/new-orleans/page";
import CinematicHomepageTop from "./CinematicHomepageTop";
import styles from "./cinematic-home.module.css";

export default function HomePage() {
  return (
    <>
      <CinematicHomepageTop />
      <div className={`${styles.legacyTopHidden} wno-legacy-home-below`}>
        <WnoHome />
      </div>
      <style>{`.wno-legacy-home-below [class*="homeHero"] + section{display:none!important}`}</style>
    </>
  );
}
