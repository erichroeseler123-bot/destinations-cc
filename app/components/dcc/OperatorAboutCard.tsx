import Link from "next/link";
import type { OperatorManifest } from "@/lib/dcc/operators";

type OperatorAboutCardProps = {
  operator: OperatorManifest;
  tourCount?: number;
};

export default function OperatorAboutCard({
  operator,
  tourCount,
}: OperatorAboutCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">About the Operator</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{operator.name}</h3>
          <p className="mt-2 text-sm text-zinc-300">
            {operator.city}
            {operator.founded ? ` · Founded ${operator.founded}` : ""}
          </p>
        </div>

        {operator.overview ? (
          <p className="text-base leading-8 text-zinc-300">{operator.overview}</p>
        ) : (
          <p className="text-base leading-8 text-zinc-300">
            This local operator appears on DCC so travelers can understand who runs the experience before checking availability.
          </p>
        )}

        {operator.specialties && operator.specialties.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-white">Specialties</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {operator.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.14em] text-zinc-300"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 text-sm">
          {operator.website ? (
            <a
              href={operator.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-2xl border border-white/12 bg-white/6 px-4 py-2 text-white/88 hover:bg-white/10"
            >
              Visit operator website
            </a>
          ) : null}
          {operator.phone ? (
            <a
              href={`tel:${operator.phone.replace(/[^\d+]/g, "")}`}
              className="rounded-2xl border border-white/12 bg-white/6 px-4 py-2 text-white/88 hover:bg-white/10"
            >
              {operator.phone}
            </a>
          ) : null}
          <Link
            href={`/operators/${operator.slug}`}
            className="rounded-2xl border border-white/12 bg-white/6 px-4 py-2 text-white/88 hover:bg-white/10"
          >
            More about {operator.name}
          </Link>
        </div>

        {typeof tourCount === "number" ? (
          <p className="text-sm text-zinc-400">
            {tourCount === 1 ? "1 tour" : `${tourCount} tours`} currently listed on DCC from this operator.
          </p>
        ) : null}
      </div>
    </section>
  );
}
