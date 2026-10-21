import { FAMILY_TOURS } from "../../lib/familyTours";
import { buildFamilySnapshot, FAMILY_SNAPSHOT_DATE } from "../../lib/familySnapshot";
import { FactEvidence, readableDate } from "./FamilyTourFacts";
import styles from "./FamilyDecision.module.css";

export default function PublishedTourData({asOf}:{asOf:string}) {
  const snapshot=buildFamilySnapshot(FAMILY_TOURS),c=snapshot.counts;
  return <section className={styles.panel} id="published-rules" aria-labelledby="rules-title">
    <p className={styles.eyebrow}>Published rules · reusable source data</p><h2 id="rules-title">What do six swamp-tour products actually publish about children and pickup?</h2>
    <p>Our {readableDate(FAMILY_SNAPSHOT_DATE)} compilation covers {c.products} products from {c.operatorBrands} operator brands. It records {c.allAges} all-ages rule, {c.minimumAge} positive minimum-age rules and {c.minimumHeight} minimum-height rules. For {c.noVerifiedAgeOrHeight} product, a complete age or height rule was not verified. Hotel transport is offered on {c.hotelTransportOptions} products; {c.centralTransport} uses a central departure.</p>
    <p>These counts describe this selected sample—not every New Orleans tour. A missing rule in our records is not evidence that an operator has no restriction. Transport options do not establish eligibility for a particular hotel.</p>
    <div className={styles.dataTableWrap}><table className={styles.dataTable}><caption>Product-level restrictions and transportation captured in the snapshot</caption><thead><tr><th scope="col">Product</th><th scope="col">Published age rule</th><th scope="col">Published height rule</th><th scope="col">Transportation</th></tr></thead><tbody>{FAMILY_TOURS.map(t=><tr key={t.id}><th scope="row"><a href={`#compare-${t.id}`}>{t.operator} — {t.name}</a></th>{["minAge","minHeight","pickup"].map(key=><td key={key} data-label={key==="minAge"?"Age rule":key==="minHeight"?"Height rule":"Transportation"}><FactEvidence fact={t.facts[key]} asOf={asOf}/></td>)}</tr>)}</tbody></table></div>
    <p><a className={styles.button} href="/data/swamp-tour-published-rules.json" download>Download the sourced snapshot (JSON)</a> · <a href="#family-sources">Fact-level sources and review dates</a></p>
    <h3>How was this compiled?</h3><p>Compiled by <a href="/about">Welcome to the Swamp</a> from official product pages and their booking instructions. We separated public/private products, age/height eligibility and ticket pricing bands. This is original curation of published information; we did not conduct tours, survey travelers, measure accessibility or test wildlife sightings.</p>
    <p>The download preserves each fact’s value, unknown status, source URL, product scope and original check date. The compilation date is not a fresh verification of every fact. <a href="#family-sources">Read the fact-review method</a>.</p>
    <h3>How can I cite or correct it?</h3><p>Cite “Welcome to the Swamp, New Orleans swamp tour published rules snapshot, {readableDate(FAMILY_SNAPSHOT_DATE)},” and link to <a href="/with-kids#published-rules">this snapshot section</a>. Check the underlying operator source before relying on a rule. To flag a correction, <a href="mailto:hello@welcometotheswamp.com">send the product, source URL and disputed fact</a>; no review date changes until that fact is rechecked.</p>
  </section>;
}
