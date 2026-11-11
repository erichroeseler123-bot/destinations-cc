import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/content";
import DellsInquiryForm from "../components/DellsInquiryForm";

export const metadata: Metadata = {
  title: "Contact & Group Planning Desk",
  description:
    "Send a Wisconsin Dells or Lake Delton trip-planning question for river tours, Ducks, multi-family itineraries, or vacation-rental logistics.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return (
    <main style={{ maxWidth: "52rem", margin: "0 auto", padding: "3rem 1.25rem 4rem" }}>
      <p style={{ fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.75 }}>
        Welcome to the Dells · Trip &amp; Group Planning Desk
      </p>
      <h1 style={{ fontSize: "2.15rem", lineHeight: 1.15, marginTop: "0.5rem" }}>
        Plan Your Wisconsin Dells River Window or Group Day
      </h1>
      <p style={{ fontSize: "1.05rem", lineHeight: 1.65, marginTop: "0.85rem" }}>
        Coordinating multiple cars, kids and grandparents, Upper Dells vs. Ducks timing, or a Lake Delton
        rental-house reset? Send your trip notes below and our planning desk will point you to the cleanest route.
      </p>

      <div
        style={{
          marginTop: "1.25rem",
          padding: "0.95rem 1.1rem",
          borderRadius: "0.65rem",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          fontSize: "0.92rem",
          lineHeight: 1.55,
        }}
      >
        <strong>Disclosure:</strong> Welcome to the Dells is an independent planning guide in the Destination Command
        Center network, not an attraction operator or ticket office. Submitting an inquiry requests planning guidance
        and does not hold seats or process payment; tickets are booked directly with the operating company or
        disclosed marketplace.
      </div>

      <DellsInquiryForm />

      <p style={{ marginTop: "2rem", fontSize: "0.95rem" }}>
        Looking for immediate side-by-side river comparisons?{" "}
        <Link href="/boat-tours" style={{ textDecoration: "underline", fontWeight: 600 }}>
          Compare Boat Tours &amp; Ducks
        </Link>{" "}
        or{" "}
        <Link href="/about" style={{ textDecoration: "underline", fontWeight: 600 }}>
          read how Welcome to the Dells works
        </Link>
        .
      </p>
    </main>
  );
}
