import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const FloatingCartBar: React.FC = () => {
  const { totalItemsCount, subtotal, setIsCartOpen } = useCart();

  if (totalItemsCount === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden animate-in slide-in-from-bottom duration-300">
      <button
        onClick={() => setIsCartOpen(true)}
        className="w-full bg-[#F28C00] hover:bg-[#D97D00] text-white py-4 px-5 rounded-2xl shadow-xl flex items-center justify-between font-bold text-xs tracking-wider uppercase border border-white/20 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#07552B] text-white flex items-center justify-center font-extrabold text-[11px]">
            {totalItemsCount}
          </div>
          <span className="font-bold text-white">View Order Bag</span>
        </div>

        <div className="flex items-center gap-2 font-mono font-extrabold text-sm tabular-nums">
          <span>₦{subtotal.toLocaleString()}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
};
