import type { Metadata } from "next";
import NetworkPage from "@/app/network/page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "DCC Routing | Destination Command Center",
  description: "Routing map for Destination Command Center network surfaces.",
  alternates: { canonical: "/routing" },
};

export default function RoutingPage() {
  return <NetworkPage />;
}
