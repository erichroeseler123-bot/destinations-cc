import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Help Me Choose | Welcome to New Orleans Tours',
  description: 'Find the New Orleans experience that best fits your group, timing, transportation needs, and interests.',
  robots: { index: false, follow: true },
};

export default function FrenchQuarterOrientationPage() {
  permanentRedirect('/help-me-choose');
}
