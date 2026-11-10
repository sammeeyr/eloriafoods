import React, { useState } from 'react';
import { Package, Plus, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { INITIAL_PRODUCTS } from '../data/mockData';

export const MarketBasketsSection: React.FC = () => {
  const { addItem } = useCart();
  const [expandedBasketId, setExpandedBasketId] = useState<string | null>(null);

  const baskets = INITIAL_PRODUCTS.filter(p => p.categoryId === 'cat-baskets');

  const handleAddBasket = (basket: any) => {
    addItem({
      cartItemId: `ci-bsk-${basket.id}-${Date.now()}`,
      productId: basket.id,
      productName: basket.name,
      basePrice: basket.basePrice,
      unitPrice: basket.basePrice,
      quantity: 1,
      selectedVariant: undefined,
      selectedAddons: [],
      imagePath: basket.imagePath,
      lineTotal: basket.basePrice,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedBasketId(prev => (prev === id ? null : id));
  };

  return (
    <section id="market-baskets" className="py-20 bg-[#FFF6D9] border-b border-[#EFE4BF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#07552B] font-bold mb-1">
              <Package className="w-3.5 h-3.5 text-[#58A846]" />
              <span>Foodstuff Market Packages</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#07552B] tracking-tight">
              Raw Foodstuff Restock Baskets
            </h2>
            <p className="text-xs sm:text-sm text-[#536353] mt-1 max-w-xl">
              Freshly packaged staples delivered directly to your doorstep. Each basket contains verified Nigerian food measures (congos of rice, beans, garri, vegetable & palm oils, yams, and eggs).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#07552B] bg-white px-4 py-2 rounded-xl border border-[#EFE4BF] self-start md:self-auto font-mono shadow-xs font-semibold">
            <Truck className="w-4 h-4 text-[#58A846]" />
            <span>Doorstep delivery across Abuja</span>
          </div>
        </div>

        {/* Baskets Grid: Pure White Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {baskets.map(basket => {
            const isExpanded = expandedBasketId === basket.id;

            return (
              <div
                key={basket.id}
                className="bg-white rounded-3xl border border-[#EFE4BF] hover:border-[#07552B]/40 transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md group"
              >
                {/* Image and Header */}
                <div className="relative aspect-[16/10] w-full bg-[#FFFBF0] flex items-center justify-center p-4 overflow-hidden">
                  <img
                    src={basket.imagePath}
                    alt={basket.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 px-3.5 py-1 rounded-full border border-[#EFE4BF] font-mono font-extrabold text-sm text-[#07552B] tabular-nums shadow-xs">
                    ₦{basket.basePrice.toLocaleString()}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#07552B] mb-2 group-hover:text-[#F28C00] transition-colors">
                      {basket.name}
                    </h3>
                    <p className={`text-xs text-[#536353] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {basket.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => toggleExpand(basket.id)}
                      className="mt-2 text-[11px] font-bold text-[#07552B] hover:text-[#F28C00] flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide item breakdown' : 'View full grocery breakdown'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#F4EAC4] flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#8A908A] uppercase font-mono">Basket Total</span>
                      <span className="font-mono text-base font-extrabold text-[#07552B] tabular-nums">
                        ₦{basket.basePrice.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddBasket(basket)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Order Basket</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
