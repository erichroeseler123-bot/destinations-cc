import Link from "next/link";

type Props = {
  city: string;
  cityName: string;
};

export default function CityCrossLinks({ city, cityName }: Props) {
  const links = [
    {
      href: `/${city}/tours`,
      label: "Top Tours",
      desc: "Guided experiences and activities",
    },
    {
      href: `/${city}/attractions`,
      label: "Attractions",
      desc: "Landmarks and must-see spots",
    },
    {
      href: `/${city}/day-trips`,
      label: "Day Trips",
      desc: "Nearby excursions and escapes",
    },
    {
      href: `/${city}/shows`,
      label: "Shows",
      desc: "Concerts and entertainment",
    },
    {
      href: `/${city}/helicopter`,
      label: "Helicopter Tours",
      desc: "Aerial and scenic flights",
    },
  ];

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 space-y-6">
      <h3 className="text-xl font-semibold text-center">
        Explore More in {cityName}
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 hover:bg-zinc-900/70 transition"
          >
            <div className="space-y-1">
              <p className="font-semibold text-white group-hover:text-cyan-400 transition">
                {l.label}
              </p>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {l.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
