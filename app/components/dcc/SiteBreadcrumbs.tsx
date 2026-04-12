"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  accessibility: "Accessibility",
  "accessible-hotels-near": "Accessible Hotels Near",
  "attractions-near": "Attractions Near",
  authority: "Route Intel",
  cannabis: "Cannabis Rules",
  casino: "Casinos",
  "casinos-near": "Casinos Near",
  cities: "Cities",
  cruises: "Ports & Hubs",
  diner: "Diners",
  "diners-near": "Diners Near",
  "fremont-street": "Fremont Street",
  "grand-canyon": "Grand Canyon",
  "helicopter-tours": "Helicopter Tours",
  hotel: "Hotels",
  "hotels-near": "Hotels Near",
  "kid-friendly": "Kid-Friendly",
  "las-vegas": "Las Vegas",
  "las-vegas-strip": "Las Vegas Strip",
  miami: "Miami",
  nashville: "Nashville",
  "national-parks": "National Parks",
  "new-orleans": "New Orleans",
  penthouses: "Penthouses",
  "pet-friendly": "Pet-Friendly",
  ports: "Ports & Hubs",
  "road-trips": "Road Trips",
  roadside: "Roadside Stops",
  route: "Route Intel",
  "route-segment": "Route Segments",
  scenic: "Scenic Stops",
  "scenic-drives": "Scenic Drives",
  "smoker-friendly": "Smoker-Friendly",
  smoking: "Smoking Policies",
  sports: "Sports",
  suites: "Suites",
  tours: "Tours & Activities",
  usa: "USA Cities",
  vegas: "Las Vegas",
  venues: "Venues",
};

function titleizeSegment(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SiteBreadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") return null;
  if (pathname === "/sedona/jeep-tours") return null;

  const cleanPath = pathname.split("?")[0];
  const segments = cleanPath.split("/").filter(Boolean);

  if (!segments.length) return null;

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    return {
      href,
      label: SEGMENT_LABELS[segment] ?? titleizeSegment(segment),
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="dcc-breadcrumbs">
      <ol className="dcc-breadcrumbs__list">
        <li>
          <Link href="/" className="dcc-breadcrumbs__link">
            Home
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="dcc-breadcrumbs__item">
              <span aria-hidden="true" className="dcc-breadcrumbs__sep">
                /
              </span>
              {isLast ? (
                <span aria-current="page" className="dcc-breadcrumbs__current">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="dcc-breadcrumbs__link">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
