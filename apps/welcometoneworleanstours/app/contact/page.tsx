import type { Metadata } from "next";
import ContactPage from "@/app/new-orleans/contact/page";

export const metadata: Metadata = {
  title: "Contact & Group Planning | New Orleans Concierge Desk",
  description: "Contact New Orleans Concierge Desk for tour selection help, group planning, the $5 French Quarter orientation, or local visitor questions.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact & Group Planning | New Orleans Concierge Desk",
    description: "Call or text New Orleans Concierge Desk for tour selection, group planning, and local visitor help.",
    url: "/contact",
  },
};

export default ContactPage;
