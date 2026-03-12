// app/layout.tsx
import { Roboto, Montserrat } from 'next/font/google'; // Built-in font import
import './globals.css'; // your global styles
import SiteHeader from "@/app/components/dcc/SiteHeader";
import SiteBreadcrumbs from "@/app/components/dcc/SiteBreadcrumbs";
import SiteFooter from "@/app/components/dcc/SiteFooter";
import { getLiveCityRegistryNodes } from "@/src/data/cities-registry";

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap', // prevents invisible text
  variable: '--font-roboto',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
  variable: '--font-montserrat',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navCities = getLiveCityRegistryNodes().map((city) => ({
    slug: city.slug,
    name: city.name,
    canonicalPath: city.canonicalPath,
    state: city.state,
  }));

  return (
    <html lang="en">
      <body className={`${roboto.variable} ${montserrat.variable}`}>
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
