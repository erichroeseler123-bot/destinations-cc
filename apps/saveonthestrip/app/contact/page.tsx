import type { Metadata } from "next";
import { HelpRequestForm } from "@/app/components/HelpRequestForm";
import { SocialLinks } from "../components/SocialLinks";
import { SITE_CONFIG } from "../site-config";

export const metadata: Metadata = {
  title: "Contact Save On The Strip",
  description:
    "Reach Save On The Strip for help with Vegas show picks, tours, deals, hotel questions, and general trip-planning follow-up.",
  alternates: { canonical: "https://saveonthestrip.com/contact" },
  openGraph: {
    title: "Contact Save On The Strip",
    description:
      "Phone, email, and help-request options for Save On The Strip travel planning and site support.",
    url: "https://saveonthestrip.com/contact",
    type: "website",
  },
};

export default function ContactPage({
  searchParams,
}: {
  searchParams?: { sent?: string; error?: string };
}) {
  const brandKey = SITE_CONFIG.socialBrandKey;
  const sent = searchParams?.sent === "1";
  const error = searchParams?.error === "contact";

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="eyebrow">Contact</div>
        <div style={{ height: 10 }} />
        <h2>How to reach Save On The Strip</h2>
        <p>
          Save On The Strip is a Vegas-first planning guide built to help travelers make faster
          decisions on shows, tours, deals, and hotel updates.
        </p>
        <p>
          Use this page for help-request follow-up, general site issues, or questions about Vegas
          planning.
        </p>
      </section>

      <section className="panel">
        <div className="eyebrow">Direct contact</div>
        <div style={{ height: 10 }} />
        <h2>Call or email</h2>
        <p>
          Phone: <a href="tel:+17025303081">702-530-3081</a>
        </p>
        <p>
          Email: <a href="mailto:contact@saveonthestrip.com">contact@saveonthestrip.com</a>
        </p>
        <p>
          If you want help picking the right show, tour, deal, or timeshare angle, send the form
          below and it will be routed for follow-up.
        </p>
        <div style={{ height: 10 }} />
        <SocialLinks brandKey={brandKey} mode="minimal" showLabels />
      </section>

      <HelpRequestForm sourcePath="/contact" sent={sent} error={error} />
    </main>
  );
}
