import WnoHome from "../../../app/new-orleans/page";
import CinematicHomepageTop from "./CinematicHomepageTop";
import styles from "./cinematic-home.module.css";

export default function HomePage() {
  return (
    <>
      <CinematicHomepageTop />
      <div className={styles.legacyTopHidden}>
        <WnoHome />
      </div>
    </>
  );
}
