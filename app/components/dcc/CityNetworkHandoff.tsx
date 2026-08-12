import { getCityNetworkRoutesWithAffiliate } from "@/lib/dcc/networkRoutes";

export default function CityNetworkHandoff({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const routes = getCityNetworkRoutesWithAffiliate(citySlug, cityName);
  if (!routes.length) return null;

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">Continue from DCC</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">Turn {cityName} research into the next useful step</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">Owned destination and transportation sites stay first. When DCC does not have a stronger network destination for the job, it can fall back to an attributed Viator search instead of leaving the journey unfinished.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[9px] font-black uppercase tracking-[0.15em] text-white/40">Contextual routes only</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {routes.slice(0, 6).map((route) => (
          <a key={route.id} href={route.href} target={route.affiliate ? "_blank" : undefined} rel={route.affiliate ? "sponsored noopener noreferrer" : undefined} className="group rounded-[20px] border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.06]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200/60">{route.kind}</span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-white/28">{route.site}</span>
            </div>
            <h3 className="mt-2 text-base font-black text-white">{route.label}</h3>
            <p className="mt-2 text-xs leading-5 text-white/48">{route.reason}</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.13em] text-cyan-200/70 group-hover:text-cyan-100">Continue →</p>
          </a>
        ))}
      </div>
      {routes.some((route) => route.affiliate) ? <p className="mt-4 text-[10px] leading-4 text-white/30">Some outbound experience links are affiliate links. DCC may earn a commission if a booking is made, at no extra cost to the traveler.</p> : null}
    </section>
  );
}
