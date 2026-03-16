import Link from "next/link";
import { getCrossSiteVenue } from "@/lib/crossSiteMap";
import { getTransportDirectoryEntry } from "@/src/data/transport-directory";

const PARR_ORIGIN = "https://www.partyatredrocks.com";

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

function buildBookingHref(
  parrBookingPath: string,
  venueSlug: string,
  sourcePage?: string,
  bookingContext?: RideOptionsCardProps["bookingContext"],
) {
  const url = new URL(parrBookingPath, PARR_ORIGIN);
  url.searchParams.set("source", "dcc");
  url.searchParams.set("source_slug", venueSlug);
  if (sourcePage) url.searchParams.set("source_page", sourcePage);
  if (bookingContext?.event) url.searchParams.set("event", bookingContext.event);
  if (bookingContext?.artist) url.searchParams.set("artist", bookingContext.artist);
  if (bookingContext?.date) url.searchParams.set("date", bookingContext.date);
  if (bookingContext?.qty) url.searchParams.set("qty", bookingContext.qty);
  return url.toString();
}

function buildVenueHref(parrVenuePath: string, venueSlug: string, sourcePage?: string) {
  const url = new URL(parrVenuePath, PARR_ORIGIN);
  url.searchParams.set("source", "dcc");
  url.searchParams.set("source_slug", venueSlug);
  if (sourcePage) url.searchParams.set("source_page", sourcePage);
  return url.toString();
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

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={bookingHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-400"
        >
          See Ride Options
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
