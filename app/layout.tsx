// app/layout.tsx
import { Montserrat, Playfair_Display } from 'next/font/google';
import './globals.css'; // your global styles
import SiteHeader from "@/app/components/dcc/SiteHeader";
import SiteBreadcrumbs from "@/app/components/dcc/SiteBreadcrumbs";
import SiteFooter from "@/app/components/dcc/SiteFooter";
import TravelpayoutsDriveScript from "@/app/components/dcc/TravelpayoutsDriveScript";
import { getTravelpayoutsDrivePolicy } from "@/lib/travelpayouts/policy";
import { getLiveCityRegistryNodes } from "@/src/data/cities-registry";

const headingFont = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-heading',
});

const accentFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-accent',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navCities = getLiveCityRegistryNodes().map((city) => ({
    slug: city.slug,
    name: city.name,
    canonicalPath: city.canonicalPath,
    state: city.state,
  }));
  const drivePolicy = getTravelpayoutsDrivePolicy();

  return (
    <html lang="en">
      <head>
      </head>
      <body className={`${headingFont.variable} ${accentFont.variable}`}>
        <TravelpayoutsDriveScript
          enabled={drivePolicy.enabled}
          src={drivePolicy.src}
          allowedPrefixes={drivePolicy.allowedPrefixes}
          blockedPrefixes={drivePolicy.blockedPrefixes}
        />
        <a href="#main-content" className="dcc-skip-link">
          Skip to main content
        </a>
        <SiteHeader cities={navCities} />
        <div id="main-content" className="dcc-site-shell">
          <div className="dcc-site-shell__inner">
            <SiteBreadcrumbs />
            {children}
          </div>
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
