import type { DccSocialProfile } from "@/src/data/entities-registry";

type Props = {
  profile: DccSocialProfile;
  title?: string;
};

function formatLabel(value: string) {
  return value.replace(/-/g, " ");
}

export default function SocialProfileSection({
  profile,
  title = "Best For and Social Vibe",
}: Props) {
  const badges = [
    ...(profile.vibe ?? []),
    ...(profile.bestFor ?? []),
    ...(profile.crowdType ?? []),
  ];

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best for</p>
          <p className="mt-2 text-sm text-zinc-300">
            {profile.bestFor?.length ? profile.bestFor.map(formatLabel).join(" · ") : "Trip-fit guidance still being expanded."}
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Social vibe</p>
          <p className="mt-2 text-sm text-zinc-300">
            {profile.vibe?.length ? profile.vibe.map(formatLabel).join(" · ") : "Vibe notes still being expanded."}
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Crowd pattern</p>
          <p className="mt-2 text-sm text-zinc-300">
            {profile.crowdType?.length ? profile.crowdType.map(formatLabel).join(" · ") : "Crowd guidance still being expanded."}
          </p>
        </article>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {badges.slice(0, 8).map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-200"
          >
            {formatLabel(item)}
          </span>
        ))}
        {profile.groupFriendly ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-emerald-100">
            group-friendly
          </span>
        ) : null}
        {profile.dateNightFriendly ? (
          <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-rose-100">
            date-night
          </span>
        ) : null}
        {profile.pregameFriendly ? (
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-amber-100">
            pregame-friendly
          </span>
        ) : null}
        {profile.photoMoment ? (
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-cyan-100">
            photo moment
          </span>
        ) : null}
      </div>

      {profile.notes ? <p className="mt-5 text-sm text-zinc-300">{profile.notes}</p> : null}
    </section>
  );
}
