import "../../../app/globals.css";
import "./wno-recovery.css";
import CanonicalNewOrleansLayout from "@/app/new-orleans/layout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CanonicalNewOrleansLayout>{children}</CanonicalNewOrleansLayout>
      </body>
    </html>
  );
}
