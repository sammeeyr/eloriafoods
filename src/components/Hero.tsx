import React, { useState, useEffect } from 'react';
import { Clock, Truck, ArrowRight, Sparkles, Flame, ShoppingBag, Utensils } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { INITIAL_PRODUCTS } from '../data/mockData';

interface HeroProps {
  onExploreMenu: () => void;
  onExploreBaskets: () => void;
  onOpenTrackOrder: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreMenu, onExploreBaskets, onOpenTrackOrder }) => {
  const { addItem } = useCart();
  const [lagosTime, setLagosTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Lagos',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      setLagosTime(new Intl.DateTimeFormat('en-GB', options).format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderTodayMeal = () => {
    const jollofProduct = INITIAL_PRODUCTS.find(p => p.id === 'prod-meal-jollof') || INITIAL_PRODUCTS[0];
    addItem({
      cartItemId: `ci-hero-${Date.now()}`,
      productId: jollofProduct.id,
      productName: jollofProduct.name,
      basePrice: jollofProduct.basePrice,
      unitPrice: jollofProduct.basePrice,
      quantity: 1,
      selectedVariant: { id: 'v-j1', name: 'Standard Plate', priceModifier: 0 },
      selectedAddons: [],
      imagePath: jollofProduct.imagePath,
      lineTotal: jollofProduct.basePrice,
    });
  };

  return (
    <section className="relative overflow-hidden bg-[#FFF6D9] pt-10 pb-16 border-b border-[#EFE4BF]">
      {/* Background warm radiance */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FDEBA6]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#58A846]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 text-xs pb-4 border-b border-[#EFE4BF]">
          <div className="flex items-center gap-2 font-mono">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EFE4BF] text-[#07552B] font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#58A846] animate-pulse" />
              Lagos Time: {lagosTime || '12:30 PM'} · Kitchen Active
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#536353] font-medium">
            <Truck className="w-3.5 h-3.5 text-[#07552B]" />
            <span>Fast delivery in Lekki, Ikoyi, VI & across Lagos</span>
          </div>
        </div>

        {/* Hero Main Intro */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#07552B]/10 text-[#07552B] text-xs font-bold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#F28C00]" />
            <span>Taste More. Relax Better.</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#07552B] leading-[1.05] mb-4 text-balance">
            GOOD FOOD. <br className="hidden sm:inline" />
            <span className="text-[#F28C00]">GREAT MOMENTS.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#202820] leading-relaxed mb-8 max-w-2xl font-normal">
            Freshly prepared meals, refreshing drinks and a relaxing lounge experience. Savor firewood jollof, charcoal-grilled seafood, and native soups made to order.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreMenu}
              className="px-7 py-4 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#F28C00]/30 hover:-translate-y-0.5 flex items-center gap-2.5"
            >
              <span>ORDER TODAY'S MENU</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#lounge-story"
              className="px-7 py-4 bg-white hover:bg-[#FFFBF0] text-[#07552B] font-bold rounded-2xl text-xs sm:text-sm tracking-wider uppercase transition-colors border border-[#07552B]/30 hover:border-[#07552B] shadow-xs"
            >
              EXPLORE OUR LOUNGE
            </a>
          </div>
        </div>

        {/* Signature 2-Card Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Today's Cooked Meal Card */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-[#EFE4BF] p-6 sm:p-8 flex flex-col justify-between group shadow-md hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#07552B] bg-[#07552B]/10 px-3.5 py-1 rounded-full border border-[#07552B]/20">
                <Flame className="w-3.5 h-3.5 text-[#F28C00]" />
                TODAY'S SPECIAL
              </span>
              <span className="font-mono font-extrabold text-2xl text-[#07552B] tabular-nums">
                ₦4,000
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center my-2">
              <div>
                <h3 className="font-display font-extrabold text-2xl text-[#07552B] tracking-tight mb-2 leading-tight">
                  Smokey Jollof + Plantain + Chicken
                </h3>
                <p className="text-xs sm:text-sm text-[#536353] leading-relaxed mb-4">
                  Signature party firewood jollof rice simmered in plum tomato stew, served with golden dodo plantain and seasoned crispy fried chicken.
                </p>
                <div className="flex items-center gap-2 text-xs text-[#58A846] font-bold">
                  <span>✓ FRESHLY PREPARED</span>
                  <span>·</span>
                  <span>✓ AVAILABLE TODAY</span>
                </div>
              </div>

              {/* Jollof Plate Image */}
              <div className="relative aspect-square flex items-center justify-center p-2">
                <img
                  src="/assets/aistudio/jollof-plate_ea4269ad.png"
                  alt="Smokey Jollof Plantain Chicken"
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-[#F4EAC4]">
              <button
                onClick={handleOrderTodayMeal}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F28C00]/25"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Quick Add (₦4,000)</span>
              </button>
              <button
                onClick={onExploreMenu}
                className="py-3.5 px-5 bg-[#FFF6D9] hover:bg-[#FCECC0] text-[#07552B] font-bold rounded-xl text-xs transition-colors border border-[#EFE4BF]"
              >
                View Details
              </button>
            </div>
          </div>

          {/* Card 2: Market Restock Baskets Card */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-[#EFE4BF] p-6 sm:p-8 flex flex-col justify-between group shadow-md hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#07552B] bg-[#58A846]/10 px-3.5 py-1 rounded-full border border-[#58A846]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#58A846]" />
                PANTRY & FOODSTUFF MARKET
              </span>
              <span className="font-mono font-extrabold text-2xl text-[#07552B] tabular-nums">
                From ₦15,000
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center my-2">
              <div>
                <h3 className="font-display font-extrabold text-2xl text-[#07552B] tracking-tight mb-2 leading-tight">
                  Raw Foodstuff Restock Baskets
                </h3>
                <p className="text-xs sm:text-sm text-[#536353] leading-relaxed mb-4">
                  Skip the open market hassle. Fresh congos of rice, beans, garri, vegetable oils, yam tubers, plantains, and farm eggs delivered in one clean box.
                </p>
                <div className="flex items-center gap-2 text-xs text-[#58A846] font-bold">
                  <span>✓ 8 Foodstuff Packages</span>
                  <span>·</span>
                  <span>✓ Weighed & Sorted</span>
                </div>
              </div>

              {/* Foodstuff Image */}
              <div className="relative aspect-square flex items-center justify-center p-2">
                <img
                  src="/assets/aistudio/foodstuff_3de1e558.png"
                  alt="Raw Foodstuff Restock Basket"
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-[#F4EAC4]">
              <button
                onClick={onExploreBaskets}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 bg-[#07552B] hover:bg-[#054020] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#07552B]/20"
              >
                <span>Browse Food Baskets</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenTrackOrder}
                className="py-3.5 px-5 bg-[#FFF6D9] hover:bg-[#FCECC0] text-[#07552B] font-bold rounded-xl text-xs transition-colors border border-[#EFE4BF]"
              >
                Track Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
