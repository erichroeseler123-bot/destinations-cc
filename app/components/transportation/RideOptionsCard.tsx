import Link from "next/link";
import { getCrossSiteVenue } from "@/lib/crossSiteMap";
import { getTransportDirectoryEntry } from "@/src/data/transport-directory";
import { buildParrHandoffHref } from "@/lib/dcc/satelliteHandoffs";

type RideOptionsCardProps = {
  venueSlug: string;
  title?: string;
  sourcePage?: string;
  showVenueLink?: boolean;
  bookingContext?: {
    event?: string;
    artist?: string;
    date?: string;
    qty?: string;
  };
};

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function serviceTypeLabel(value: "shared" | "private" | "group-charter") {
  if (value === "group-charter") return "group charters";
  if (value === "shared") return "shared shuttle seats";
  return "private rides";
}

function buildServiceCopy(venueSlug: string) {
  const entry = getTransportDirectoryEntry(venueSlug);
  if (!entry) {
    return "Shared shuttle seats and private rides are available for this venue.";
  }

  const items = entry.serviceTypes.map(serviceTypeLabel);
  if (items.length === 1) {
    return `${items[0].charAt(0).toUpperCase() + items[0].slice(1)} are available for this venue.`;
  }

  if (items.length === 2) {
    return `${items[0].charAt(0).toUpperCase() + items[0].slice(1)} and ${items[1]} are available for this venue.`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)} are available for this venue.`;
}

function cardToneClasses(value: "shared" | "private" | undefined) {
  if (value === "private") {
    return "border-[#ffb07c]/30 bg-[linear-gradient(180deg,rgba(58,30,18,0.7),rgba(18,10,7,0.8))]";
  }

  return "border-cyan-400/25 bg-[linear-gradient(180deg,rgba(14,40,53,0.7),rgba(8,17,29,0.8))]";
}

function buildBookingHref(
  parrBookingPath: string,
  venueSlug: string,
  sourcePage?: string,
  bookingContext?: RideOptionsCardProps["bookingContext"],
) {
  return buildParrHandoffHref(parrBookingPath, {
    sourceSlug: venueSlug,
    sourcePage,
    venueSlug,
    event: bookingContext?.event,
    artist: bookingContext?.artist,
    eventDate: bookingContext?.date,
    quantity: bookingContext?.qty,
    returnPath: sourcePage || `/transportation/venues/${venueSlug}`,
  });
}

function buildVenueHref(parrVenuePath: string, venueSlug: string, sourcePage?: string) {
  return buildParrHandoffHref(parrVenuePath, {
    sourceSlug: venueSlug,
    sourcePage,
    venueSlug,
    returnPath: sourcePage || `/transportation/venues/${venueSlug}`,
  });
}

export default function RideOptionsCard({
  venueSlug,
  title = "Getting There",
  sourcePage,
  showVenueLink = true,
  bookingContext,
}: RideOptionsCardProps) {
  const mapEntry = getCrossSiteVenue(venueSlug);
  if (!mapEntry) return null;

  const transportEntry = getTransportDirectoryEntry(venueSlug);
  const venueName = transportEntry?.name ?? titleFromSlug(venueSlug);
  const bookingHref = buildBookingHref(
    mapEntry.parrBookingPath,
    venueSlug,
    sourcePage,
    bookingContext,
  );
  const venueHref = buildVenueHref(mapEntry.parrVenuePath, venueSlug, sourcePage);
  const serviceCopy = buildServiceCopy(venueSlug);
  const status = transportEntry?.serviceStatus ?? "active";
  const trustBadges = transportEntry?.trustBadges ?? [];
  const offerCards = transportEntry?.offerCards ?? [];

  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">{title}</p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{venueName}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">{serviceCopy}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-cyan-200">
          {status.replace("_", " ")}
        </span>
      </div>

      {trustBadges.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {trustBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-100"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      {transportEntry?.urgencyNote ? (
        <div className="mt-5 rounded-[1.5rem] border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          {transportEntry.urgencyNote}
        </div>
      ) : null}

      {offerCards.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {offerCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-[1.6rem] border p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] ${cardToneClasses(card.emphasis)}`}
            >
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200">
                {card.emphasis === "private" ? "Group and premium fit" : "Fastest booking lane"}
              </div>
              <h3 className="mt-2 text-xl font-bold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-200">{card.detail}</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-100/90">
                {card.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
              <a
                href={bookingHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-5 inline-flex min-h-11 items-center justify-center rounded-full px-4 text-xs font-black uppercase tracking-[0.16em] transition ${
                  card.emphasis === "private"
                    ? "bg-[#ffb07c] text-[#1d0d06] hover:bg-[#ffc39a]"
                    : "bg-cyan-400 text-[#04131c] hover:bg-cyan-300"
                }`}
              >
                {card.ctaLabel}
              </a>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={bookingHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-400"
        >
          Book Shuttle or Private Ride
        </a>
        {showVenueLink ? (
          <a
            href={venueHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/15"
          >
            Venue details on PARR
          </a>
        ) : null}
        {transportEntry ? (
          <Link
            href={transportEntry.dccUrl}
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/10"
          >
            DCC transportation page
          </Link>
        ) : null}
      </div>
    </section>
  );
}
