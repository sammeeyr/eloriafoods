import React from 'react';
import { ShoppingBag, ShieldCheck, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenTrackOrder: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin, onOpenTrackOrder }) => {
  const { totalItemsCount, subtotal, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF6D9]/95 backdrop-blur-md border-b border-[#EFE4BF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Official Primary Logo for Light/Cream Surface */}
        <a href="#" className="flex items-center shrink-0 group py-1">
          <img
            src="/assets/aistudio/01-primary-logo_acba5e67.svg"
            alt="Dera Buzor Lounge - Taste More. Relax Better."
            className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
          />
        </a>

        {/* Navigation Links in Forest Green */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-[#07552B]">
          <a href="#today-menu" className="hover:text-[#F28C00] transition-colors whitespace-nowrap">
            Today's Menu
          </a>
          <a href="#timetable" className="hover:text-[#F28C00] transition-colors whitespace-nowrap">
            Weekly Timetable
          </a>
          <a href="#quick-pot" className="hover:text-[#F28C00] transition-colors whitespace-nowrap">
            Quick Pot
          </a>
          <a href="#market-baskets" className="hover:text-[#F28C00] transition-colors whitespace-nowrap">
            Food Baskets
          </a>
          <a href="#meal-plan" className="hover:text-[#F28C00] transition-colors whitespace-nowrap font-bold text-[#F28C00]">
            5-Day Lunch Plan
          </a>
          <a href="#testimonials" className="hover:text-[#F28C00] transition-colors whitespace-nowrap">
            Reviews
          </a>
          <button
            onClick={onOpenTrackOrder}
            className="hover:text-[#F28C00] transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            Track Order
          </button>
        </nav>

        {/* Actions: Staff Portal & Cart Bag */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenTrackOrder}
            title="Track existing order"
            className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl bg-white border border-[#EFE4BF] text-[#07552B] hover:text-[#F28C00]"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAdmin}
            title="Restaurant Operations Portal"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#07552B] hover:text-[#F28C00] bg-white rounded-xl transition-colors whitespace-nowrap shrink-0 border border-[#EFE4BF] shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#58A846]" />
            Staff
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2.5 px-4 py-2.5 bg-[#F28C00] hover:bg-[#D97D00] text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-[#F28C00]/25 whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span>
              {totalItemsCount === 0 ? 'Bag' : `₦${subtotal.toLocaleString()}`}
            </span>
            {totalItemsCount > 0 && (
              <span className="bg-white text-[#F28C00] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
