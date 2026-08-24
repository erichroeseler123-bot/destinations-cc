import { redirect } from "next/navigation";

export const metadata = {
  title: "Argo Shuttle Service Retired | ShuttleYa",
  robots: { index: false, follow: true },
};

export default function RetiredArgoBookingPage() {
  redirect("/");
}
