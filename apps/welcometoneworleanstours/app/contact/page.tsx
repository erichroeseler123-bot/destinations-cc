import type { Metadata } from "next";
import ContactPage from "@/app/new-orleans/contact/page";

export const metadata: Metadata = {
  title: "Contact & Group Planning | Welcome to New Orleans Tours",
  description: "Contact Welcome to New Orleans Tours for tour selection help, group planning, the $5 French Quarter orientation, or local visitor questions.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact & Group Planning | Welcome to New Orleans Tours",
    description: "Call or text Welcome to New Orleans Tours for tour selection, group planning, and local visitor help.",
    url: "/contact",
  },
};

export default ContactPage;
