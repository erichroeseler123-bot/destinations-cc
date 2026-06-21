import type { Metadata } from "next";
import CommandViewPage from "@/app/command/page";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "DCC Governance | Destination Command Center",
  description: "Governance view for DCC readiness, command, and routing state.",
  alternates: { canonical: "/governance" },
};

export default async function GovernancePage() {
  return <CommandViewPage />;
}
