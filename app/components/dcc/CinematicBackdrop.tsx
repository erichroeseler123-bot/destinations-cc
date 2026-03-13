type CinematicBackdropProps = {
  variant?: "default" | "argo";
};

export default function CinematicBackdrop({ variant = "default" }: CinematicBackdropProps) {
  const isArgo = variant === "argo";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="dcc-beam-sweep absolute -top-32 left-[-18%] h-[120vh] w-[72vw] bg-[linear-gradient(110deg,rgba(34,211,238,0.12),transparent_52%)] blur-2xl" />
      <div className="dcc-beam-sweep absolute -bottom-24 right-[-24%] h-[110vh] w-[68vw] bg-[linear-gradient(110deg,rgba(251,191,36,0.11),transparent_56%)] blur-2xl [animation-delay:5s]" />
      {isArgo ? (
        <div className="dcc-beam-sweep absolute -top-20 right-[-10%] h-[90vh] w-[58vw] bg-[linear-gradient(122deg,rgba(251,191,36,0.18),transparent_52%)] blur-2xl [animation-delay:2.4s]" />
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_86%_16%,rgba(251,191,36,0.16),transparent_34%),radial-gradient(circle_at_50%_92%,rgba(16,185,129,0.14),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.35),rgba(9,9,11,0.88))]" />
      <div className="dcc-grid-drift absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="dcc-noise-shift absolute inset-0 mix-blend-soft-light [background-image:radial-gradient(rgba(255,255,255,0.3)_0.6px,transparent_0.6px)] [background-size:3px_3px]" />

      <div className="dcc-float-a absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="dcc-float-b absolute -right-24 top-40 h-80 w-80 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="dcc-float-a absolute left-1/3 top-[58%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      {isArgo ? (
        <div className="dcc-float-b absolute left-[42%] top-[24%] h-80 w-80 rounded-full bg-amber-400/14 blur-3xl [animation-delay:700ms]" />
      ) : null}

      <svg
        viewBox="0 0 1440 760"
        className={`absolute bottom-0 h-auto w-full ${isArgo ? "opacity-55" : "opacity-40"}`}
        preserveAspectRatio="none"
      >
        <path d="M0 560L180 500L340 560L520 430L730 520L950 380L1180 520L1440 410V760H0Z" fill="rgba(255,255,255,0.05)" />
        <path d="M0 630L230 560L460 620L700 540L920 620L1180 560L1440 640V760H0Z" fill="rgba(255,255,255,0.04)" />
        <path
          d="M40 220L220 180L370 250L540 190L760 280L960 220L1210 290L1400 250"
          fill="none"
          stroke="rgba(34,211,238,0.78)"
          strokeWidth="2"
          className="dcc-route-glow dcc-route-dash"
        />
        <path
          d="M60 300L260 350L430 290L620 360L820 300L1040 360L1250 320L1420 350"
          fill="none"
          stroke="rgba(251,191,36,0.65)"
          strokeWidth="1.6"
          className="dcc-route-glow [animation-delay:900ms]"
        />
        {isArgo ? (
          <path
            d="M-20 390L180 330L340 360L520 300L720 380L920 330L1140 390L1460 320"
            fill="none"
            stroke="rgba(251,191,36,0.9)"
            strokeWidth="2.3"
            className="dcc-route-glow dcc-route-dash [animation-delay:1.1s]"
          />
        ) : null}
      </svg>
    </div>
  );
}
