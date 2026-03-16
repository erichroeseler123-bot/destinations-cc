import type { Metadata } from "next";
import RedRocksAuthorityPage from "@/app/components/dcc/RedRocksAuthorityPage";

export const metadata: Metadata = {
  title: "Red Rocks Parking Guide | Destination Command Center",
  description: "Parking reality for Red Rocks concerts including arrival windows, uphill walking, and why some visitors choose shuttle service instead.",
  alternates: { canonical: "/red-rocks-parking" },
};

export default function RedRocksParkingPage() {
  return (
    <RedRocksAuthorityPage
      eyebrow="DCC Parking Guide"
      title="Parking is part of the Red Rocks experience, not a footnote."
      intro="Parking at Red Rocks changes the full shape of the night. It affects how early you leave, how much uphill walking you absorb, and how painful the exit feels when the show ends."
      sourcePath="/red-rocks-parking"
      sections={[
        {
          title: "Parking reality on busy nights",
          body: "The stress is not just finding a space. It is the full chain: arrival timing, lot selection, walking grade, weather exposure, and exit drag after the encore. Visitors who underweight parking friction usually end up compressing the whole night around the car.",
        },
        {
          title: "Why parking pages naturally recommend shuttles",
          body: "A useful parking guide should say when driving is still fine and when avoiding the car is smarter. For many visitors staying in Denver, a dedicated shuttle removes the need to optimize lot strategy and reduces the chance of a slow, messy end-of-night exit.",
        },
      ]}
    />
  );
}
