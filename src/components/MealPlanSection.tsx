import React from 'react';
import { Check, Calendar, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { INITIAL_PRODUCTS } from '../data/mockData';

export const MealPlanSection: React.FC = () => {
  const { addItem } = useCart();
  const mealPlanProduct = INITIAL_PRODUCTS.find(p => p.id === 'prod-plan-weekly') || INITIAL_PRODUCTS[0];

  const handleSubscribe = () => {
    addItem({
      cartItemId: `ci-plan-${Date.now()}`,
      productId: mealPlanProduct.id,
      productName: mealPlanProduct.name,
      basePrice: mealPlanProduct.basePrice,
      unitPrice: mealPlanProduct.basePrice,
      quantity: 1,
      selectedVariant: { id: 'v-plan-std', name: 'Standard Weekly Plan (5 Days)', priceModifier: 0 },
      selectedAddons: [],
      imagePath: '/assets/aistudio/jollof-plate_ea4269ad.png',
      lineTotal: mealPlanProduct.basePrice,
    });
  };

  return (
    <section id="meal-plan" className="py-20 bg-[#FFF6D9] border-b border-[#EFE4BF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#07552B] p-8 sm:p-12 relative overflow-hidden shadow-xl text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#58A846]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#58A846] px-3.5 py-1 rounded-full shadow-2xs mb-4">
                <Calendar className="w-3.5 h-3.5" />
                Office & Residence Lunch Plan
              </div>

              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-4">
                5-Day Weekly Lunch Subscription
              </h2>

              <p className="text-sm text-[#D6E8CF] leading-relaxed mb-6 max-w-lg">
                Never stress about what to eat at work. Get guaranteed piping hot Nigerian meals delivered to your desk every Monday through Friday by 12:00 noon.
              </p>

              {/* Benefits list */}
              <div className="space-y-2.5 text-xs text-[#F2F8EE] mb-8 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#58A846] text-white flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <span>5 hot daily chef meals (Jollof, Fried Rice, Stir Fried Pasta, Rice & Beans, Yam & Sauce)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#58A846] text-white flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <span>Choice of protein daily (Fried Chicken, Titus Fish, Beef, or Peppered Panla)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#58A846] text-white flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <span>Complimentary chilled hibiscus zobo drink with Friday's feast</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#58A846] text-white flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <span>Priority rider dispatch — zero waiting in restaurant queues</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#BFE3B8] uppercase font-mono">Weekly Subscription</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-black text-white tabular-nums">
                      ₦17,500
                    </span>
                    <span className="text-xs text-[#D6E8CF]">/ week (5 meals)</span>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  className="px-8 py-4 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#F28C00]/30 flex items-center gap-2"
                >
                  <span>Subscribe to 5-Day Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visual representation */}
            <div className="relative aspect-square max-w-md mx-auto flex items-center justify-center p-4">
              <img
                src="/assets/aistudio/jollof-plate_ea4269ad.png"
                alt="Weekly Meal Subscription"
                className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
