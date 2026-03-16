import Image from "next/image";
import HeroMedia from "@/app/components/dcc/HeroMedia";
import { getHeroAsset, getMediaEntryByPath } from "@/lib/dcc/media/registry";

type HeroVisualImage = {
  src: string;
  alt: string;
};

function getFallbackTheme(type?: string) {
  switch (type) {
    case "district":
      return {
        label: "Neighborhood feel",
        accent: "from-fuchsia-500/25 via-rose-500/15 to-amber-400/15",
        chips: ["walks", "food", "atmosphere"],
      };
    case "park":
    case "nature-area":
    case "garden":
      return {
        label: "Outdoor stop",
        accent: "from-emerald-500/25 via-lime-400/15 to-cyan-400/15",
        chips: ["outdoors", "slower pace", "scenery"],
      };
    case "waterfront":
    case "beach":
    case "pier":
    case "coastline":
      return {
        label: "Waterfront",
        accent: "from-sky-500/25 via-cyan-400/15 to-blue-500/15",
        chips: ["views", "walking", "open air"],
      };
    case "museum":
    case "museum-cluster":
      return {
        label: "Indoor anchor",
        accent: "from-violet-500/20 via-indigo-500/15 to-slate-400/10",
        chips: ["context", "indoors", "culture"],
      };
    case "historic-site":
    case "historic-route":
    case "historic-market":
      return {
        label: "Historic stop",
        accent: "from-amber-500/25 via-orange-400/15 to-stone-400/15",
        chips: ["history", "sightseeing", "context"],
      };
    case "theme-park":
      return {
        label: "All-day attraction",
        accent: "from-pink-500/25 via-purple-500/15 to-cyan-400/15",
        chips: ["family", "all day", "major draw"],
      };
    case "venue":
    case "stadium":
      return {
        label: "Event anchor",
        accent: "from-red-500/25 via-orange-400/15 to-zinc-400/15",
        chips: ["shows", "timing", "night out"],
      };
    default:
      return {
        label: "Destination guide",
        accent: "from-cyan-500/20 via-blue-500/15 to-amber-400/15",
        chips: ["trip planning", "top stops", "local context"],
      };
  }
}

function FallbackHero({
  title,
  subtitle,
  type,
}: {
  title: string;
  subtitle?: string;
  type?: string;
}) {
  const theme = getFallbackTheme(type);

  return (
    <figure
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${theme.accent} min-h-[280px]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(4,7,18,0.12),rgba(4,7,18,0.48))]" />
      <div className="relative flex h-full min-h-[280px] flex-col justify-end p-6">
        <div className="mb-3 text-[11px] uppercase tracking-[0.26em] text-white/60">{theme.label}</div>
        <div className="max-w-md text-3xl font-black tracking-tight text-white">{title}</div>
        {subtitle ? <p className="mt-3 max-w-md text-sm leading-7 text-white/74">{subtitle}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {theme.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-xs text-white/72"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

export default function HeroVisual({
  canonicalPath,
  image,
  fallbackTitle,
  fallbackSubtitle,
  fallbackType,
}: {
  canonicalPath?: string;
  image?: HeroVisualImage;
  fallbackTitle: string;
  fallbackSubtitle?: string;
  fallbackType?: string;
}) {
  const mediaEntry = canonicalPath ? getMediaEntryByPath(canonicalPath) : null;
  const heroAsset = mediaEntry ? getHeroAsset(mediaEntry) : null;

  if (heroAsset) {
    return <HeroMedia asset={heroAsset} />;
  }

  if (image?.src) {
    return (
      <figure className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        <Image
          src={image.src}
          alt={image.alt}
          width={1600}
          height={1067}
          className="h-full w-full object-cover"
          sizes="(max-width: 1024px) 100vw, 560px"
        />
      </figure>
    );
  }

  return <FallbackHero title={fallbackTitle} subtitle={fallbackSubtitle} type={fallbackType} />;
}
