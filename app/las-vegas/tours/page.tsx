import type { Metadata } from "next";
import CityToursPageContent from "@/app/components/dcc/CityToursPageContent";

export const metadata: Metadata = {
  title: "Las Vegas Tours | Destination Command Center",
  description: "Use DCC to narrow down the right Las Vegas tour style, then continue into booking with Viator.",
  alternates: { canonical: "/las-vegas/tours" },
};

export default function LasVegasToursPage() {
  return <CityToursPageContent cityKey="las-vegas" />;
}
