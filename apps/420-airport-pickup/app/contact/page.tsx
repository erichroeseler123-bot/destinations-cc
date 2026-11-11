import type { Metadata } from "next";
import { NetworkContactForm } from "../components/NetworkContactForm";

export const metadata: Metadata = {
  title: "Contact | 420 Friendly Airport Pickup",
  description: "Reach 420 Friendly Airport Pickup for Denver arrival questions and site follow-up.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ sent?: string; error?: string }>;
}) {
  const sp = (await searchParams) || {};
  const sent = sp.sent === "1";
  const error = sp.error === "1" || sp.error === "contact";

  return (
    <main>
      <section className="panel" style={{ width: "min(1160px, calc(100vw - 32px))", margin: "32px auto 18px" }}>
        <NetworkContactForm
          action="/api/help-request"
          siteName="420 Friendly Airport Pickup"
          visibleEmail="hello@420friendlyairportpickup.com"
          sourcePath="/contact"
          sent={sent}
          error={error}
          intro="Use this if you need help with DEN pickup planning, route fit, or anything else on the site."
        />
      </section>
    </main>
  );
}
