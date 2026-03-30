import { getActiveSocials, getSocialLabel } from "../../lib/socials";

type SocialLinksProps = {
  brandKey?: string;
  mode?: "minimal" | "footer" | "feature";
  theme?: "auto" | "dcc" | "parr" | "wta" | "sots";
  showLabels?: boolean;
  showPrimaryAccent?: boolean;
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SocialThemeKey = "dcc" | "parr" | "wta" | "sots";

const SOCIAL_THEME: Record<SocialThemeKey, { outer: string; badge: string; hover: string; primary: string }> = {
  dcc: {
    outer: "border-cyan-400/20 bg-cyan-400/10 text-cyan-50",
    badge: "border-cyan-300/25 bg-cyan-300/15 text-cyan-100",
    hover: "hover:-translate-y-[1px] hover:border-cyan-300/35 hover:bg-cyan-400/15",
    primary: "border-cyan-300/40 bg-cyan-300/14",
  },
  parr: {
    outer: "border-fuchsia-400/20 bg-white/5 text-white",
    badge: "border-fuchsia-300/25 bg-fuchsia-400/15 text-fuchsia-100",
    hover: "hover:-translate-y-[1px] hover:border-fuchsia-300/35 hover:bg-fuchsia-400/15",
    primary: "border-fuchsia-300/40 bg-fuchsia-400/18",
  },
  wta: {
    outer: "border-sky-300/20 bg-sky-300/10 text-slate-50",
    badge: "border-sky-200/25 bg-sky-200/15 text-sky-50",
    hover: "hover:-translate-y-[1px] hover:border-sky-200/35 hover:bg-sky-300/15",
    primary: "border-sky-200/40 bg-sky-300/16",
  },
  sots: {
    outer: "border-amber-300/20 bg-amber-300/10 text-white",
    badge: "border-amber-200/25 bg-amber-200/15 text-amber-50",
    hover: "hover:-translate-y-[1px] hover:border-amber-200/35 hover:bg-amber-300/15",
    primary: "border-amber-200/40 bg-amber-300/18",
  },
};

function inferTheme(brandKey: string): SocialThemeKey {
  if (brandKey === "partyatredrocks") return "parr";
  if (brandKey === "wta") return "wta";
  if (brandKey === "saveonthestrip") return "sots";
  return "dcc";
}

function platformGlyph(platform: string) {
  switch (platform) {
    case "instagram":
      return "◎";
    case "facebook":
      return "f";
    case "tiktok":
      return "♪";
    case "x":
      return "X";
    case "youtube":
      return "▶";
    case "linkedin":
      return "in";
    case "threads":
      return "@";
    case "spotify":
      return "◌";
    default:
      return platform.slice(0, 2).toUpperCase();
  }
}

export function SocialLinks({
  brandKey = "dcc",
  mode = "footer",
  theme = "auto",
  showLabels = true,
  showPrimaryAccent = true,
  className,
}: SocialLinksProps) {
  const socials = getActiveSocials(brandKey);

  if (!socials.length) {
    return null;
  }

  const resolvedTheme = theme === "auto" ? inferTheme(brandKey) : theme;
  const themeStyles = SOCIAL_THEME[resolvedTheme];
  const wrapperClasses =
    mode === "feature"
      ? "grid gap-3 sm:grid-cols-2"
      : "flex flex-row flex-wrap items-center gap-3";

  return (
    <nav
      aria-label="Social links"
      className={cx(wrapperClasses, className)}
    >
      {socials.map((item) => {
        const label = getSocialLabel(item.platform);
        const text = item.handle || label;
        const isPrimary = showPrimaryAccent && item.primary;

        return (
          <a
            key={`${brandKey}-${item.platform}-${item.url}`}
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={label}
            className={cx(
              "group rounded-full border backdrop-blur-[10px] transition duration-200",
              mode === "minimal" && "inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold",
              mode === "footer" && "inline-flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold",
              mode === "feature" && "flex items-center justify-between gap-3 rounded-[1.15rem] px-4 py-3 text-sm font-semibold",
              themeStyles.outer,
              themeStyles.hover,
              isPrimary && themeStyles.primary,
            )}
          >
            <span
              className={cx(
                "inline-flex items-center justify-center rounded-full border font-bold uppercase tracking-[0.12em]",
                mode === "minimal" ? "min-w-[1.4rem] px-1.5 py-1 text-[10px]" : "min-w-[1.75rem] px-2 py-1 text-[10px]",
                themeStyles.badge,
              )}
            >
              {platformGlyph(item.platform)}
            </span>
            {showLabels ? <span className={cx("leading-none", mode === "feature" && "flex-1")}>{text}</span> : null}
            {isPrimary ? <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">Primary</span> : null}
          </a>
        );
      })}
    </nav>
  );
}
