import React, { useState, useEffect } from 'react';
import { Flame, X, ArrowRight } from 'lucide-react';

interface ChefSpecialToastProps {
  onOrderSpecial?: () => void;
}

export const ChefSpecialToast: React.FC<ChefSpecialToastProps> = ({ onOrderSpecial }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const alreadyDismissed = sessionStorage.getItem('dbl_chef_special_dismissed');
    if (alreadyDismissed) {
      return;
    }

    // Appear exactly 3 seconds after page loads
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('dbl_chef_special_dismissed', 'true');
    } catch {
      // ignore storage errors
    }
  };

  const handleAction = () => {
    handleDismiss();
    if (onOrderSpecial) {
      onOrderSpecial();
    } else {
      const menuSection = document.getElementById('today-menu') || document.getElementById('today-meal');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div 
      role="alert"
      aria-live="polite"
      className="fixed z-50 bottom-24 sm:bottom-8 right-4 sm:right-6 max-w-sm w-[calc(100vw-2rem)] sm:w-96 transition-all duration-500 ease-out transform translate-y-0 opacity-100"
      style={{
        animation: 'slideUpToast 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div className="bg-white rounded-2xl border-2 border-[#F28C00] shadow-[0_12px_36px_rgba(242,140,0,0.22)] overflow-hidden">
        {/* Vibrant Orange Top Accent Strip */}
        <div className="bg-[#F28C00] px-4 py-1.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5">
            <span className="p-0.5 bg-white/20 rounded-md">
              <Flame className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider font-display">
              Today's Chef Special
            </span>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss toast"
            className="text-white/80 hover:text-white hover:bg-black/10 rounded p-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 bg-gradient-to-b from-[#FFFDF7] to-white flex items-start gap-3.5">
          {/* Dish Thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#EFE4BF] shadow-xs relative bg-[#FFF6D9]">
            <img
              src="/assets/aistudio/jollof-plate_ea4269ad.png"
              alt="Smokey Jollof Chef Special"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span className="absolute bottom-0 inset-x-0 bg-[#07552B]/90 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-tighter">
              Hot & Ready
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h4 className="font-display font-extrabold text-sm text-[#07552B] truncate leading-tight">
                Smokey Firewood Jollof
              </h4>
              <span className="text-xs font-black text-[#F28C00] font-mono shrink-0">
                ₦4,000
              </span>
            </div>

            <p className="text-[11px] text-[#536353] leading-relaxed line-clamp-2 mb-3">
              Slow-simmered firewood party jollof with sweet dodo plantain & seasoned crispy chicken.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAction}
                className="flex-1 py-1.5 px-3 bg-[#F28C00] hover:bg-[#D97D00] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>Order Today's Special</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-1.5 px-2.5 text-[11px] font-semibold text-[#536353] hover:text-[#202820] hover:bg-[#FFF6D9] rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Availability Note */}
        <div className="px-4 py-1.5 bg-[#FFF6D9] border-t border-[#EFE4BF] flex items-center justify-between text-[10px] text-[#07552B] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#58A846] animate-pulse" />
            Freshly prepared in Abuja kitchen
          </span>
          <span className="font-mono text-[#F28C00] font-bold">14 portions left</span>
        </div>
      </div>
    </div>
  );
};
