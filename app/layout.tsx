// app/layout.tsx
import { Roboto, Montserrat } from 'next/font/google'; // Built-in font import
import './globals.css'; // your global styles

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
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${montserrat.variable}`}>
        {children}
      </body>
    </html>
  );
}
