import "../../../app/globals.css";
import "./wno-recovery.css";
import CanonicalNewOrleansLayout from "@/app/new-orleans/layout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fareharbor.com" />
        <link rel="dns-prefetch" href="//fareharbor.com" />
      </head>
      <body>
        <CanonicalNewOrleansLayout>{children}</CanonicalNewOrleansLayout>
      </body>
    </html>
  );
}
