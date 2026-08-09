import { headers } from "next/headers";
import { redirect } from "next/navigation";

const JFD_HOSTS = new Set(["juneauflightdeck.com", "www.juneauflightdeck.com"]);

export default async function LegacyJuneauHelicopterRoute() {
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0].toLowerCase();
  redirect(JFD_HOSTS.has(host) ? "/helicopter" : "/juneau/helicopter-tours");
}
