import type { Metadata } from "next";
import Link from "next/link";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import OverlayEntityGridSection from "@/app/components/dcc/OverlayEntityGridSection";
import type { DccCityRegistryNode } from "@/src/data/cities-registry";
import type { DccEntityRegistryNode } from "@/src/data/entities-registry";
import type { DccOverlayRegistryNode, DccOverlayLink } from "@/src/data/overlay-registry";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";

function formatOverlayLabel(overlayType: string) {
  return overlayType.replace(/-/g, " ");
}

function linkKind(link: DccOverlayLink): "internal" | "external" {
  if (link.kind) return link.kind;
  return link.href.startsWith("http") ? "external" : "internal";
}

function categoryPathForEntityType(entityType: string) {
  switch (entityType) {
    case "hotel":
      return "hotels";
    case "attraction":
      return "attractions";
    case "beach":
      return "beaches";
    case "pool":
      return "pools";
    case "casino":
      return "casinos";
    case "venue":
      return "venues";
    default:
      return `${entityType}s`;
  }
}

export function buildOverlayMetadata(city: DccCityRegistryNode, overlay: DccOverlayRegistryNode): Metadata {
  const overlayLabel = formatOverlayLabel(overlay.overlayType);
  const cityLabel = city.name;
  const title = `${overlayLabel.replace(/\b\w/g, (match) => match.toUpperCase())} ${cityLabel} | Destination Command Center`;
  const description = `${overlay.summary} Use this ${overlayLabel} overlay to branch into the strongest matching ${cityLabel} nodes.`;
  return {
    title,
    description,
    alternates: { canonical: overlay.canonicalPath },
    openGraph: {
      title,
      description,
      url: `https://destinationcommandcenter.com${overlay.canonicalPath}`,
      type: "website",
    },
  };
}

type Props = {
  city: DccCityRegistryNode;
  overlay: DccOverlayRegistryNode;
  entities: DccEntityRegistryNode[];
};

export default function OverlayPageTemplate({ city, overlay, entities }: Props) {
  const overlayLabel = formatOverlayLabel(overlay.overlayType);
  const title = `${overlayLabel.replace(/\b\w/g, (match) => match.toUpperCase())} ${city.name}`;
  const availableEntityTypes = Array.from(new Set(entities.map((entity) => entity.entityType)));
  const featuredRelationshipLinks =
    overlay.overlayType === "accessibility"
      ? (overlay.relatedLinks ?? []).filter((link) => link.href.includes("/accessible-hotels-near/"))
      : [];
  const socialPlanning =
    overlay.overlayType === "group-friendly" || overlay.overlayType === "date-night";
  const actionBarActions: PageAction[] = [
    { href: city.canonicalPath, label: `${city.name} hub`, kind: "internal" },
    { href: buildMapsSearchUrl(`${city.name}, ${city.state ?? city.country}`), label: "Open city in Maps", kind: "external" },
    ...(overlay.relatedLinks?.slice(0, 4).map((link) => ({ href: link.href, label: link.label, kind: linkKind(link) })) ?? []),
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.14),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Overlay Node</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
          <p className="max-w-3xl text-lg text-zinc-200">{overlay.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {city.name} · Last updated: March 2026
          </p>
        </header>

        <PageActionBar title={`Useful actions for ${title}`} actions={actionBarActions} />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">What this overlay is for</h2>
            <p className="mt-2 text-sm text-zinc-300">
              This page exists for the way people actually search: intent first, then specific hotels, beaches, attractions, or pools that fit it.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Entity coverage</h2>
            <p className="mt-2 text-sm text-zinc-300">
              {overlay.entityTypes.map((entityType) => entityType.replace(/-/g, " ")).join(" · ")}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-lg font-semibold">Why this matters</h2>
            <p className="mt-2 text-sm text-zinc-300">
              {socialPlanning
                ? "This social-intent overlay turns vague trip energy into actual planning choices: where to stay, what to do, and which areas fit the trip best."
                : "Overlay pages make the DCC graph easier to browse, easier to crawl, and closer to how real trip planning decisions get made."}
            </p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">How to use this {overlayLabel} page</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Modifier searches like {overlayLabel} {city.name} are usually easier to rank than the broad city term because the traveler already knows the constraint or trip style that matters. This page works best when it helps that visitor move directly into the right hotel, attraction, beach, pool, or casino instead of forcing them back through a generic city guide.
              </p>
              <p>
                The strongest next step is usually one of three things: a specific entity page, a category child page, or a related overlay that narrows the decision even further.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
              <div className="mt-4 grid gap-3">
                <Link href={city.canonicalPath} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                  {city.name} hub
                </Link>
                {availableEntityTypes.slice(0, 2).map((entityType) => {
                  const categoryPath = categoryPathForEntityType(entityType);
                  return (
                    <Link
                      key={`best-next-${entityType}`}
                      href={`/${overlay.overlayType}/${categoryPath}/${city.slug}`}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
                    >
                      {categoryPath.replace(/-/g, " ")}
                    </Link>
                  );
                })}
                {(overlay.relatedLinks || []).filter((link) => linkKind(link) === "internal").slice(0, 1).map((link) => (
                  <Link key={`internal-${link.href}`} href={link.href} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {socialPlanning ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">How to use this overlay</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-semibold">Choose the base first</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  Start with the hotel or casino that matches the trip energy, then branch into shows, dining, and district decisions from there.
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-semibold">Use vibe over generic ratings</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  These pages are for trip-fit questions like couples, groups, pregame flow, and photo moments, not only generic review averages.
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-semibold">Branch into nearby planning</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  Once the anchor is right, use DCC relationship pages and district hubs to tighten the rest of the night or weekend plan.
                </p>
              </article>
            </div>
          </section>
        ) : null}

        <OverlayEntityGridSection
          eyebrow={`${city.name} overlay`}
          title={title}
          intro={`Use this ${overlayLabel} surface to compare the strongest matching ${city.name} entities without dropping back into a generic city list.`}
          entities={entities}
        />

        {featuredRelationshipLinks.length ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Accessible hotel planning near major anchors</h2>
            <p className="mt-2 max-w-3xl text-zinc-300">
              Use these relationship guides when the trip starts from a specific venue, attraction, or casino and the next decision is which nearby hotel reduces friction.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {featuredRelationshipLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {availableEntityTypes.length ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Browse this overlay by category</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {availableEntityTypes.map((entityType) => {
                const categoryPath = categoryPathForEntityType(entityType);
                return (
                  <Link
                    key={`${overlay.slug}-${categoryPath}`}
                    href={`/${overlay.overlayType}/${categoryPath}/${city.slug}`}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
                  >
                    {categoryPath.replace(/-/g, " ")}
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
          <h2 className="text-2xl font-bold">Best-fit planning lanes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Constraint-first search</h3>
              <p className="mt-2 text-sm text-zinc-300">Best when the traveler already knows the rule, comfort need, or trip style that matters most.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Compare categories</h3>
              <p className="mt-2 text-sm text-zinc-300">Use child category pages when the traveler wants only hotels, beaches, pools, casinos, or attractions.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Named-place decision</h3>
              <p className="mt-2 text-sm text-zinc-300">Move into the exact entity page when one property or place is already on the shortlist.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Broader trip planning</h3>
              <p className="mt-2 text-sm text-zinc-300">Return to the city hub when the trip question expands beyond the modifier and into general planning.</p>
            </article>
          </div>
        </section>

        {overlay.relatedLinks?.length ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <h2 className="text-2xl font-bold">Related guides</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {overlay.relatedLinks.map((link) => (
                linkKind(link) === "external" ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
