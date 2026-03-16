import Image from "next/image";
import Link from "next/link";
import CityTimePanel from "@/app/components/dcc/CityTimePanel";
import WeatherPanel from "@/app/components/dcc/WeatherPanel";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";

type CityHeroTint = "warm" | "cool" | "emerald";

type CityHeroProps = {
  cityName: string;
  eyebrow: string;
  title: string;
  summary: string;
  trustLine?: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  heroImage?: string;
  heroImageAlt?: string;
  heroImagePosition?: string;
  heroTint?: CityHeroTint;
  timezone?: string;
  weatherLat?: number;
  weatherLng?: number;
};

function toneClass(tint: CityHeroTint) {
  if (tint === "warm") {
    return {
      tone: "amber" as const,
      shell:
        "bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.16),transparent_28%),linear-gradient(180deg,rgba(24,12,10,0.75),rgba(7,11,25,0.96))]",
      overlay:
        "bg-[linear-gradient(180deg,rgba(11,7,6,0.15),rgba(11,7,6,0.62)_45%,rgba(6,8,16,0.92)_100%)]",
      border: "border-amber-300/25",
      eyebrow: "text-amber-200",
      chip: "border-amber-300/20 bg-amber-400/10 text-amber-100",
      primary: "bg-amber-300 text-zinc-950 hover:bg-amber-200",
      secondary: "border-white/15 bg-black/30 text-white/88 hover:bg-white/10",
    };
  }
  if (tint === "emerald") {
    return {
      tone: "emerald" as const,
      shell:
        "bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,rgba(10,18,15,0.74),rgba(7,11,25,0.96))]",
      overlay:
        "bg-[linear-gradient(180deg,rgba(6,10,8,0.18),rgba(6,10,8,0.58)_45%,rgba(6,8,16,0.92)_100%)]",
      border: "border-emerald-300/20",
      eyebrow: "text-emerald-200",
      chip: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
      primary: "bg-emerald-300 text-zinc-950 hover:bg-emerald-200",
      secondary: "border-white/15 bg-black/30 text-white/88 hover:bg-white/10",
    };
  }
  return {
    tone: "cyan" as const,
    shell:
      "bg-[radial-gradient(circle_at_top_left,rgba(143,208,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.12),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.74),rgba(7,11,25,0.96))]",
    overlay:
      "bg-[linear-gradient(180deg,rgba(4,9,18,0.18),rgba(4,9,18,0.56)_45%,rgba(6,8,16,0.92)_100%)]",
    border: "border-cyan-300/20",
    eyebrow: "text-cyan-200",
    chip: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
    primary: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    secondary: "border-white/15 bg-black/30 text-white/88 hover:bg-white/10",
  };
}

export default function CityHero({
  cityName,
  eyebrow,
  title,
  summary,
  trustLine,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  heroImage,
  heroImageAlt,
  heroImagePosition,
  heroTint = "cool",
  timezone,
  weatherLat,
  weatherLng,
}: CityHeroProps) {
  const palette = toneClass(heroTint);

  return (
    <header
      className={`relative overflow-hidden rounded-[2rem] border ${palette.border} ${palette.shell} shadow-[0_28px_90px_rgba(0,0,0,0.45)]`}
    >
      {heroImage ? (
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={heroImageAlt || `${cityName} travel scene`}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: heroImagePosition || "center center" }}
            priority
          />
        </div>
      ) : null}
      <div className={`absolute inset-0 ${palette.overlay}`} />
      {!heroImage ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:auto,auto,48px_48px,48px_48px]" />
      ) : null}

      <div className="relative grid gap-8 px-8 py-10 md:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <RouteHeroMark eyebrow="Destination Command Center" title={cityName.toUpperCase()} tone={palette.tone} />
          <p className={`mt-5 text-xs uppercase tracking-[0.24em] ${palette.eyebrow}`}>{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/86">{summary}</p>
          {trustLine ? <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68">{trustLine}</p> : null}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={primaryCtaHref} className={`rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.16em] transition-colors ${palette.primary}`}>
              {primaryCtaLabel}
            </Link>
            <Link href={secondaryCtaHref} className={`rounded-full border px-6 py-3 text-xs font-black uppercase tracking-[0.16em] transition-colors ${palette.secondary}`}>
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="space-y-4 lg:pl-8">
          <div className={`inline-flex rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] ${palette.chip}`}>
            Travel guide • Local context • Experiences
          </div>
          {(timezone || (typeof weatherLat === "number" && typeof weatherLng === "number")) ? (
            <div className="grid gap-3">
              {timezone ? <CityTimePanel cityName={cityName} timezone={timezone} showWeekday /> : null}
              {typeof weatherLat === "number" && typeof weatherLng === "number" ? (
                <WeatherPanel locationLabel={cityName} lat={weatherLat} lng={weatherLng} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
