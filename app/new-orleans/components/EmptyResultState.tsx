import React from 'react';

export default function EmptyResultState({ message, onReset }: { message: string, onReset?: () => void }) {
  return (
    <div className="p-12 text-center bg-white border border-[#EBE8E0] shadow-sm my-10 max-w-2xl mx-auto rounded-sm">
      <div className="text-4xl mb-4 text-[#B59A65]">&times;</div>
      <p className="text-[#2C2C2A] font-serif text-2xl mb-6">{message}</p>
      {onReset && <button onClick={onReset} className="px-6 py-3 border border-[#1C2E25] text-[#1C2E25] hover:bg-[#1C2E25] hover:text-[#F9F8F6] transition-colors font-bold text-xs uppercase tracking-widest rounded-sm">Reset Filters</button>}
    </div>
  );
}