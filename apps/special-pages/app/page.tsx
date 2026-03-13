import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="wrap">
        <p className="badge">DCC Microfrontend Target</p>
        <h1>DCC Special Pages</h1>
        <p>Use these routes as independently deployable authority pages.</p>
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <Link className="card" href="/mighty-argo-shuttle">/mighty-argo-shuttle</Link>
          <Link className="card" href="/vegas">/vegas</Link>
          <Link className="card" href="/alaska">/alaska</Link>
          <Link className="card" href="/cruises">/cruises</Link>
          <Link className="card" href="/national-parks">/national-parks</Link>
          <Link className="card" href="/new-orleans">/new-orleans</Link>
        </div>
      </div>
    </main>
  );
}
