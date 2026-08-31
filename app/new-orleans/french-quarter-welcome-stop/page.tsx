import { permanentRedirect } from 'next/navigation';

export default function WelcomeStopPage() {
  permanentRedirect('/help-me-choose');
}
