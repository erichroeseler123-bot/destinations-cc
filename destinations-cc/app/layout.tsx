import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Destination Command Center',
  description: 'Cruise port intelligence and information',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
