import type { Metadata } from "next";
import ContactPage from "@/app/new-orleans/contact/page";

export const metadata: Metadata = {
  title: "Contact & Group Planning | Welcome to New Orleans Tours",
  description:
    "Contact us for tour selection help, group planning, or a scheduled New Orleans Tour Concierge conversation.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact & Group Planning | Welcome to New Orleans Tours",
    description:
      "Call or text to schedule New Orleans Tour Concierge help for individuals, families, and groups.",
    url: "/contact",
  },
};

export default ContactPage;
