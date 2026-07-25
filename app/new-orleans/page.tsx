import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getProductById } from "./data";
import ProductCard from "./components/ProductCard";

export const metadata = {
  title: "New Orleans Tours | Discover and Book Real Local Experiences",
  description:
    "Compare New Orleans tours, find real participating experiences, and get local help choosing.",
};

export default function NewOrleansHomePage() {
  const southernStyle = getProductById("southernstyle-city-tour");
  const southernStylePlantation = getProductById("southernstyle-plantation");
  const raginCajun = getProductById("ragincajun-covered-boat");
  const raginCajunAirboat = getProductById("ragincajun-airboat");

  return (
    <div className="bg-[#151515] text-[#fdfbf7] font-sans overflow-hidden">
      {/* 1. Hero */}
      <section className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/new-orleans/hero-french-quarter-balcony.jpg"
            alt="French Quarter Balcony in New Orleans"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/60 to-[#151515]/20"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center mt-16">
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 text-[#fdfbf7] tracking-tight">
            Discover the Real <br />
            <span className="text-[#d4af37]">New Orleans</span>
          </h1>
          <p className="text-lg md:text-xl text-[#fdfbf7]/80 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Compare participating New Orleans tours, book participating
            experiences, and get help choosing the right fit for your trip.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/new-orleans/tours"
              className="w-full sm:w-auto px-8 py-4 bg-[#d4af37] text-[#151515] font-bold uppercase tracking-widest text-sm hover:bg-[#b8952c] transition-colors rounded-sm"
            >
              Explore Tours
            </Link>
            <Link
              href="/new-orleans/tours-for/first-time-visitors"
              className="w-full sm:w-auto px-8 py-4 border border-[#d4af37] text-[#d4af37] font-bold uppercase tracking-widest text-sm hover:bg-[#d4af37]/10 transition-colors rounded-sm"
            >
              Help Me Choose
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Bookable experiences */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-[#d4af37] mb-4">
            Book Participating Tours
          </h2>
          <p className="text-[#fdfbf7]/70 font-light max-w-2xl text-lg">
            Directly book participating local operators, with clear descriptions
            and direct access to inventory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {southernStyle && <ProductCard product={southernStyle as any} />}
          {southernStylePlantation && (
            <ProductCard product={southernStylePlantation as any} />
          )}
          {raginCajun && <ProductCard product={raginCajun as any} />}
          {raginCajunAirboat && (
            <ProductCard product={raginCajunAirboat as any} />
          )}
        </div>
      </section>

      {/* 3. Explore by experience (Category System) */}
      <section className="py-24 bg-[#1a1a1a] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-[#fdfbf7] mb-4">
              Explore by Experience
            </h2>
            <div className="w-16 h-[1px] bg-[#d4af37] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CategoryCard
              title="Swamp & Airboat"
              desc="Venture into the Louisiana bayou."
              image="/images/travel-markets/new-orleans/louisiana-bayou-swamp.jpg"
              href="/new-orleans/swamp-tours"
            />
            <CategoryCard
              title="City Highlights"
              desc="Explore the history and architecture."
              image="/images/travel-markets/new-orleans/french-quarter-street.jpg"
              href="/new-orleans/areas/french-quarter"
            />
            <CategoryCard
              title="Plantations & History"
              desc="Step back into the historic River Road."
              image="/images/wikimedia/originals/oak-alley-front.jpg"
              disabled={true}
            />
            <CategoryCard
              title="Haunted & After Dark"
              desc="Discover ghosts, voodoo, and vampires."
              image="/images/wikimedia/originals/french-quarter-night.jpg"
              disabled={true}
            />
            <CategoryCard
              title="Food & Cooking"
              desc="Taste the city's culinary heritage."
              image="/images/wikimedia/originals/gumbo-dish.jpg"
              disabled={true}
            />
            <CategoryCard
              title="River & Music"
              desc="Experience jazz and the Mississippi."
              image="/images/travel-markets/new-orleans/steamboat-natchez.jpg"
              href="/new-orleans/music"
            />
          </div>
        </div>
      </section>

      {/* 4. Help Me Choose teaser & 5. Why book here */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="bg-[#101010] border border-[#2a2a2a] p-10 md:p-14 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="#d4af37">
                <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" />
              </svg>
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-[#d4af37] mb-4 relative z-10">
              Overwhelmed?
            </h3>
            <p className="text-[#fdfbf7]/80 text-lg mb-10 relative z-10 font-light leading-relaxed">
              Answer a few questions about your group, schedule, and interests,
              and we will point you to the right tour formats.
            </p>
            <Link
              href="/new-orleans/tours-for/first-time-visitors"
              className="inline-block border border-[#d4af37] text-[#d4af37] px-8 py-4 font-bold uppercase tracking-widest text-xs hover:bg-[#d4af37] hover:text-[#151515] transition-colors relative z-10"
            >
              Start the Chooser
            </Link>
          </div>

          <div className="pl-0 lg:pl-10">
            <h3 className="font-serif text-3xl mb-8">Why Book Here</h3>
            <ul className="space-y-8">
              <TrustItem
                title="Verified Inventory"
                desc="We display participating operators with current booking availability provided through participating operators and clear format details."
              />
              <TrustItem
                title="Clear Comparisons"
                desc="Understand the difference between a walking tour and a bus tour before you commit."
              />
              <TrustItem
                title="Direct Booking"
                desc="Book through the participating operator’s FareHarbor checkout."
              />
              <TrustItem
                title="Independent Assistance"
                desc="We help you plan the right itinerary without hiding operator identities."
              />
            </ul>
          </div>
        </div>
      </section>

      {/* 6. French Quarter Welcome Stop & 8. Group planning */}
      <section className="py-24 bg-[#101010] border-t border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="border border-[#2a2a2a] bg-[#151515] p-10 flex flex-col items-start">
            <div className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold mb-4">
              In-Person Help
            </div>
            <h3 className="font-serif text-3xl mb-4">
              French Quarter Welcome Stop
            </h3>
            <p className="text-[#fdfbf7]/70 font-light leading-relaxed mb-8 flex-grow">
              Stop by for local orientation, help choosing a tour, and practical
              visitor assistance.
            </p>
            <Link
              href="/new-orleans/french-quarter-welcome-stop"
              className="text-xs text-[#fdfbf7] font-bold uppercase tracking-widest border-b border-[#d4af37] pb-1 hover:text-[#d4af37] transition-colors"
            >
              View Location & Hours
            </Link>
          </div>

          <div className="border border-[#2a2a2a] bg-[#1a1423] p-10 flex flex-col items-start">
            <div className="text-[10px] text-[#b8952c] uppercase tracking-widest font-bold mb-4">
              Private Parties
            </div>
            <h3 className="font-serif text-3xl mb-4">Group Planning</h3>
            <p className="text-[#fdfbf7]/70 font-light leading-relaxed mb-8 flex-grow">
              Planning a family, wedding, or corporate group? Contact us to
              discuss available tour options.
            </p>
            <Link
              href="/contact"
              className="text-xs text-[#fdfbf7] font-bold uppercase tracking-widest border-b border-[#b8952c] pb-1 hover:text-[#d4af37] transition-colors"
            >
              Inquire About Groups
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Planning guides */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="font-serif text-2xl text-[#fdfbf7] mb-2">
            Editorial Guides
          </h2>
          <p className="text-[#aaaaaa] font-light text-sm">
            Dig deeper before you decide.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GuideLink
            href="/new-orleans/swamp-tours/types"
            title="Compare Swamp Tour Formats"
          />
          <GuideLink
            href="/new-orleans/swamp-tours/best-time"
            title="When to Visit the Swamp"
          />
          <GuideLink
            href="/new-orleans/swamp-tours/transportation"
            title="Swamp Tour Transportation"
          />
          <GuideLink
            href="/new-orleans/swamp-tours/with-kids"
            title="Swamp Tours with Kids"
          />
        </div>
      </section>
    </div>
  );
}

function CategoryCard({
  title,
  desc,
  image,
  href,
  disabled,
}: {
  title: string;
  desc: string;
  image: string;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-8 w-full">
        <h3 className="font-serif text-2xl text-[#fdfbf7] mb-2 group-hover:text-[#d4af37] transition-colors flex items-center justify-between">
          {title}
        </h3>
        <p className="text-sm text-[#aaaaaa] font-light">
          {disabled ? (
            <span className="inline-block mt-1 text-[10px] uppercase tracking-widest font-bold text-[#b8952c] border border-[#b8952c]/50 bg-[#b8952c]/10 px-2 py-1 rounded-sm">
              Guide Coming Soon
            </span>
          ) : (
            desc
          )}
        </p>
      </div>
    </>
  );

  if (disabled || !href) {
    return (
      <div className="group relative h-80 overflow-hidden rounded-sm border border-[#2a2a2a] block opacity-80 cursor-default">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group relative h-80 overflow-hidden rounded-sm border border-[#2a2a2a] hover:border-[#d4af37] transition-colors block"
    >
      {content}
    </Link>
  );
}

function TrustItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h4 className="font-bold text-[#fdfbf7] tracking-wide mb-1 uppercase text-sm">
        {title}
      </h4>
      <p className="text-[#aaaaaa] font-light leading-relaxed">{desc}</p>
    </div>
  );
}

function GuideLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="block p-6 border border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#d4af37] transition-colors group"
    >
      <h4 className="font-serif text-lg text-[#fdfbf7] mb-4 group-hover:text-[#d4af37]">
        {title}
      </h4>
      <span className="text-[10px] uppercase tracking-widest font-bold text-[#aaaaaa] group-hover:text-[#fdfbf7]">
        Read Guide →
      </span>
    </Link>
  );
}
