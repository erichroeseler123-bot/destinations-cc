import { FEATURE_FLAG_MY_TRIP } from '../data/index';
import Link from 'next/link';

export function HeaderNav() {
  return (
    <nav className="flex flex-wrap gap-6 p-6 bg-nola-ivory border-b border-nola-amber/50">
      <Link href="/new-orleans/tours" className="text-nola-charcoal font-bold uppercase tracking-widest text-xs hover:text-nola-brass transition-colors">All Tours</Link>
      <Link href="/city-tours" className="text-nola-charcoal font-bold uppercase tracking-widest text-xs hover:text-nola-brass transition-colors">City</Link>
      <Link href="/swamp-tours" className="text-nola-charcoal font-bold uppercase tracking-widest text-xs hover:text-nola-brass transition-colors">Swamp</Link>
      <Link href="/plantation-tours" className="text-nola-charcoal font-bold uppercase tracking-widest text-xs hover:text-nola-brass transition-colors">Plantations</Link>
      <Link href="/tours-for/first-time-visitors" className="text-nola-charcoal font-bold uppercase tracking-widest text-xs hover:text-nola-brass transition-colors">Plan Your Trip</Link>
    </nav>
  );
}

export function FooterNav() {
  return (
    <footer className="bg-nola-charcoal text-nola-ivory p-12 md:p-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t-[8px] border-nola-brass">
      <div>
        <h4 className="font-serif text-nola-brass text-lg mb-4">Categories</h4>
        <div className="space-y-3">
          <Link href="/city-tours" className="block text-sm font-light text-nola-ivory/80 hover:text-white transition-colors">City Tours</Link>
          <Link href="/swamp-tours" className="block text-sm font-light text-nola-ivory/80 hover:text-white transition-colors">Swamp Tours</Link>
          <Link href="/plantation-tours" className="block text-sm font-light text-nola-ivory/80 hover:text-white transition-colors">Plantations</Link>
        </div>
      </div>
      <div>
        <h4 className="font-serif text-nola-brass text-lg mb-4">Plan Your Trip</h4>
        <div className="space-y-3">
          <Link href="/tours-for/first-time-visitors" className="block text-sm font-light text-nola-ivory/80 hover:text-white transition-colors">First-Time Visitors</Link>
          <Link href="/areas/french-quarter" className="block text-sm font-light text-nola-ivory/80 hover:text-white transition-colors">French Quarter Guides</Link>
        </div>
      </div>
      <div>
        <h4 className="font-serif text-nola-brass text-lg mb-4">Planning Guides</h4>
        <div className="space-y-3">
          <Link href="/guides/how-far-are-swamp-tours-from-new-orleans" className="block text-sm font-light text-nola-ivory/80 hover:text-white transition-colors">Distance to Swamps</Link>
          <Link href="/guides/how-long-does-a-swamp-tour-take" className="block text-sm font-light text-nola-ivory/80 hover:text-white transition-colors">Swamp Tour Duration</Link>
        </div>
      </div>
      <div>
        <h4 className="font-serif text-nola-brass text-lg mb-4">Marketplace</h4>
        <div className="space-y-3">
          <div className="text-sm font-light text-nola-ivory/80">Independent Marketplace Disclosure</div>
          <div className="text-sm font-light text-nola-ivory/80">Local Operator Responsibility</div>
          <div className="text-sm font-light text-nola-ivory/80">Verified Local Image Credits</div>
        </div>
      </div>
    </footer>
  );
}
