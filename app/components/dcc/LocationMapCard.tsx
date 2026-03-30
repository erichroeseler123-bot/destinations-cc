import Link from "next/link";

function fmtCoordinate(value: number) {
  return value.toFixed(4);
}

function buildGoogleMapsHref(lat: number, lng: number, label: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng} (${label})`)}`;
}

function buildAppleMapsHref(lat: number, lng: number, label: string) {
  return `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`;
}

function buildOpenStreetMapHref(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`;
}

function buildGoogleDirectionsHref(lat: number, lng: number, label: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng} (${label})`)}`;
}

function buildStaticMapPreview(lat: number, lng: number, label: string) {
  const latLabel = fmtCoordinate(lat);
  const lngLabel = fmtCoordinate(lng);
  return (
    <svg
      viewBox="0 0 640 360"
      role="img"
      aria-label={`${label} map preview centered on ${latLabel}, ${lngLabel}`}
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="map-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d1a2b" />
          <stop offset="100%" stopColor="#09111d" />
        </linearGradient>
        <linearGradient id="map-road" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.16)" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="28" fill="url(#map-bg)" />
      <g opacity="0.16" stroke="#d7ecff" strokeWidth="1">
        <path d="M0 84H640" />
        <path d="M0 156H640" />
        <path d="M0 228H640" />
        <path d="M0 300H640" />
        <path d="M96 0V360" />
        <path d="M224 0V360" />
        <path d="M352 0V360" />
        <path d="M480 0V360" />
      </g>
      <g opacity="0.8" stroke="url(#map-road)" strokeWidth="16" strokeLinecap="round" fill="none">
        <path d="M-20 290C94 252 172 222 282 230C420 240 495 186 668 154" />
        <path d="M68 -18C102 66 148 140 224 200C274 238 346 272 442 382" />
        <path d="M482 -10C456 60 416 120 366 168C318 214 264 250 178 302" />
      </g>
      <g opacity="0.32" fill="#63e4ff">
        <circle cx="164" cy="106" r="42" />
        <circle cx="536" cy="248" r="56" />
      </g>
      <g transform="translate(320 178)">
        <circle r="54" fill="rgba(61,243,255,0.14)" />
        <circle r="30" fill="rgba(61,243,255,0.22)" />
        <path d="M0 -34C16 -34 28 -20 28 -4C28 18 8 35 0 48C-8 35 -28 18 -28 -4C-28 -20 -16 -34 0 -34Z" fill="#3df3ff" />
        <circle cy="-4" r="9" fill="#07111d" />
      </g>
      <rect x="24" y="24" width="196" height="54" rx="18" fill="rgba(7,17,29,0.78)" stroke="rgba(143,208,255,0.22)" />
      <text x="42" y="47" fill="#8fd0ff" fontSize="14" fontWeight="700" letterSpacing="2.4">FAST MAP PREVIEW</text>
      <text x="42" y="66" fill="#f5fbff" fontSize="18" fontWeight="700">{label}</text>
      <rect x="24" y="282" width="216" height="54" rx="18" fill="rgba(7,17,29,0.82)" stroke="rgba(255,255,255,0.12)" />
      <text x="42" y="304" fill="#ffb07c" fontSize="13" fontWeight="700" letterSpacing="1.8">CENTERPOINT</text>
      <text x="42" y="324" fill="#f5fbff" fontSize="18" fontWeight="700">{latLabel}, {lngLabel}</text>
    </svg>
  );
}

export default function LocationMapCard({
  title,
  label,
  lat,
  lng,
  description,
  nearbyLinks = [],
}: {
  title?: string;
  label: string;
  lat: number;
  lng: number;
  description?: string;
  nearbyLinks?: Array<{ href: string; label: string }>;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,26,0.96),rgba(6,9,18,0.96))] p-6 sm:p-8">
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Map presence</div>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] sm:text-3xl">
        {title || `${label} map and directions`}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
        {description || `Use a lightweight map handoff for ${label}. Keep DCC fast, then open full directions only when the traveler actually needs them.`}
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,28,48,0.98),rgba(9,13,23,0.98))] p-5">
          <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
            {buildStaticMapPreview(lat, lng, label)}
          </div>
          <div className="relative mt-5">
            <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-100">
              Approximate centerpoint
            </div>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/20">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-200" />
              </div>
              <div>
                <div className="text-lg font-black uppercase tracking-[-0.02em] text-white">{label}</div>
                <div className="text-sm text-white/65">
                  {fmtCoordinate(lat)}, {fmtCoordinate(lng)}
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <a
                href={buildGoogleDirectionsHref(lat, lng, label)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[22px] border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-50 transition hover:bg-cyan-400/15"
              >
                Get directions
              </a>
              <a
                href={buildGoogleMapsHref(lat, lng, label)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/85 transition hover:bg-white/10"
              >
                Open Google Maps
              </a>
              <a
                href={buildAppleMapsHref(lat, lng, label)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/85 transition hover:bg-white/10"
              >
                Open Apple Maps
              </a>
            </div>
            <div className="mt-3">
              <a
                href={buildOpenStreetMapHref(lat, lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-black uppercase tracking-[0.16em] text-white/60 transition hover:text-white/85"
              >
                Open OpenStreetMap
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#0b1224] p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Why this stays fast</div>
          <div className="mt-3 space-y-3 text-sm leading-6 text-white/72">
            <p>DCC keeps the map layer fast by rendering a static preview instead of shipping a heavy interactive map bundle on first load.</p>
            <p>Travelers still get immediate location clarity, one-click directions, and map-provider choice only when intent is real.</p>
          </div>
          {nearbyLinks.length ? (
            <div className="mt-5">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">Nearby planning links</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {nearbyLinks.map((item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-200 hover:bg-white/10"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
