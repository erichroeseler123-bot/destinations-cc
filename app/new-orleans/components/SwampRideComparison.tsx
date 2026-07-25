import React from 'react';

export default function SwampRideComparison() {
  return (
    <section className="my-16 bg-[#1a1a1a] border border-[#2a2a2a] p-8 md:p-12">
      <h2 className="text-3xl font-serif text-[#fdfbf7] text-center mb-10">Compare Swamp Rides</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-[#101010] border border-[#d4af37]/30">
          <h3 className="font-serif text-2xl text-[#d4af37] mb-4">Covered Tour Boat</h3>
          <ul className="space-y-4">
            <li className="flex text-[#aaaaaa] font-light"><span className="text-[#d4af37] mr-4">&bull;</span> Relaxed and shaded ride</li>
            <li className="flex text-[#aaaaaa] font-light"><span className="text-[#d4af37] mr-4">&bull;</span> Great for photography</li>
            <li className="flex text-[#aaaaaa] font-light"><span className="text-[#d4af37] mr-4">&bull;</span> Family-friendly and slower-paced</li>
          </ul>
        </div>
        <div className="p-8 bg-[#151515] border border-[#2a2a2a]">
          <h3 className="font-serif text-2xl text-[#fdfbf7] mb-4">Airboat Ride</h3>
          <ul className="space-y-4">
            <li className="flex text-[#aaaaaa] font-light"><span className="text-[#fdfbf7] mr-4">&bull;</span> High-speed and thrilling</li>
            <li className="flex text-[#aaaaaa] font-light"><span className="text-[#fdfbf7] mr-4">&bull;</span> Access to shallow, remote marshes</li>
            <li className="flex text-[#aaaaaa] font-light"><span className="text-[#fdfbf7] mr-4">&bull;</span> Open-air experience</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
