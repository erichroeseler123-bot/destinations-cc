// app/layout.tsx
import { Montserrat, Playfair_Display } from 'next/font/google';
import './globals.css'; // your global styles
import SiteHeader from "@/app/components/dcc/SiteHeader";
import SiteBreadcrumbs from "@/app/components/dcc/SiteBreadcrumbs";
import SiteFooter from "@/app/components/dcc/SiteFooter";
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
  const travelpayoutsDriveEnabled = process.env.TRAVELPAYOUTS_DRIVE_ENABLED === "true";
  const travelpayoutsDriveSrc = process.env.TRAVELPAYOUTS_DRIVE_SRC?.trim();
  const shouldLoadTravelpayoutsDrive = travelpayoutsDriveEnabled && Boolean(travelpayoutsDriveSrc);

  return (
    <html lang="en">
      <head>
        {shouldLoadTravelpayoutsDrive ? (
          <script
            async
            data-noptimize="1"
            data-cfasync="false"
            data-wpfc-render="false"
            src={travelpayoutsDriveSrc}
          />
        ) : null}
      </head>
      <body className={`${headingFont.variable} ${accentFont.variable}`}>
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
