import type { Metadata } from "next";
import StaticPage from "../components/StaticPage";

export const metadata: Metadata = {
  title: "What to Do in Juneau Cruise Port",
  description:
    "Choose a Juneau cruise-port plan by port time, weather, glacier priority, wildlife interest, and return-to-ship margin.",
  alternates: { canonical: "https://juneauflightdeck.com/what-to-do-in-juneau-cruise-port" },
};

export default function JuneauCruisePortPage() {
  return (
    <StaticPage
      eyebrow="Juneau cruise port"
      title="Choose the experience that fits your actual port day."
      intro="Juneau has more good choices than most cruise calls. The useful question is not simply what is popular — it is what fits your ship window, weather, group, and Alaska priorities."
      bullets={[
        "Choose a glacier helicopter tour when flying over or landing on the ice is the main reason you are excited about Juneau.",
        "Choose whale watching when wildlife is the priority or when you want a strong non-flight alternative.",
        "Keep transportation time and your ship's all-aboard time in the decision instead of comparing advertised tour durations alone.",
        "Have a weather pivot ready before port day so a flight cancellation does not force a rushed decision.",
        "Open provider booking pages only after you have narrowed the experience type and timing that actually fit.",
      ]}
      ctaHref="/helicopter"
      ctaLabel="Start with glacier flights"
    />
  );
}
