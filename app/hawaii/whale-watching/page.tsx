import type { Metadata } from "next";
import CategoryDecisionEngineExperience from "@/app/components/dcc/CategoryDecisionEngineExperience";
import { HAWAII_WHALE_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/hawaiiWhaleWatchingEngine";
import type { DecisionResult } from "@/lib/dcc/decisionEngines/types";

export const metadata: Metadata = {
  title:
    "Hawaiʻi Whale Watching Decision Engine (Maui, Oʻahu, Big Island & Kauaʻi) | Destination Command Center",
  description:
    "Compare Hawaiʻi whale watching catamarans, small-group sailing catamarans, eye-level RIB rafts, gyro-stabilized ships, and free NOAA Sanctuary shore lookouts by island, seasickness tolerance, child age, mobility, and time window.",
  alternates: {
    canonical: HAWAII_WHALE_DECISION_ENGINE.canonicalUrl,
  },
  openGraph: {
    title: HAWAII_WHALE_DECISION_ENGINE.title,
    description: HAWAII_WHALE_DECISION_ENGINE.summaryDescription,
    url: HAWAII_WHALE_DECISION_ENGINE.canonicalUrl,
    type: "website",
  },
};

export default function HawaiiWhaleWatchingDecisionEnginePage() {
  const initialResult = HAWAII_WHALE_DECISION_ENGINE.evaluate(
    HAWAII_WHALE_DECISION_ENGINE.defaultExampleInput,
  ) as unknown as DecisionResult<Record<string, unknown>>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${HAWAII_WHALE_DECISION_ENGINE.canonicalUrl}#webpage`,
        url: HAWAII_WHALE_DECISION_ENGINE.canonicalUrl,
        name: HAWAII_WHALE_DECISION_ENGINE.title,
        description: HAWAII_WHALE_DECISION_ENGINE.summaryDescription,
        isPartOf: {
          "@type": "WebSite",
          name: "Destination Command Center",
          url: "https://destinationcommandcenter.com",
        },
        significantLink: [
          "https://destinationcommandcenter.com/api/v1/decision-engines/hawaii-whale-watching",
          "https://destinationcommandcenter.com/api/v1/decision-engines/hawaii-whale-watching/evaluate",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${HAWAII_WHALE_DECISION_ENGINE.canonicalUrl}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "When is humpback whale watching season in Hawaiʻi?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "North Pacific humpback whales migrate to Hawaiian waters from November through May, with peak density from January through March. Commercial whale watching tours do not operate from June through October while the whales feed in Alaska.",
            },
          },
          {
            "@type": "Question",
            name: "How close can whale watching boats get to whales in Hawaiʻi?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Under federal regulation 50 CFR § 224.103(a), all vessels in Hawaiian waters must remain at least 100 yards from humpback whales. When whales voluntarily approach a vessel ('mugging'), captains must place engines in neutral until the whales move away.",
            },
          },
          {
            "@type": "Question",
            name: "Which Hawaiʻi whale watching boat is best if I get seasick or use a wheelchair?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "For maximum stability and confirmed step-free wheelchair access, choose the 232-ft gyro-stabilized Star of Honolulu on Oʻahu (Pier 8 ramp + onboard elevators) or a 65-ft double-deck power catamaran departing Maʻalaea Harbor on Maui (PacWhale Eco-Adventures) on an early morning (7:30–9:30 AM) departure before afternoon trade winds build. Official NOAA Sanctuary shore lookouts (Papawai on Maui, Makapuʻu on Oʻahu, Puʻukoholā on Big Island) provide a 100% seasickness-free, $0 public alternative.",
            },
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryDecisionEngineExperience
        engineId="hawaii-whale-watching"
        initialResult={initialResult}
      />
    </main>
  );
}
