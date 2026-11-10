import React from 'react';
import { Plus, Utensils } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { INITIAL_PRODUCTS } from '../data/mockData';

export const QuickPotSection: React.FC = () => {
  const { addItem } = useCart();

  const proteins = INITIAL_PRODUCTS.filter(p => p.categoryId === 'cat-proteins');

  const handleAddProtein = (product: any) => {
    addItem({
      cartItemId: `ci-prot-${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      unitPrice: product.basePrice,
      quantity: 1,
      selectedVariant: undefined,
      selectedAddons: [],
      imagePath: product.imagePath,
      lineTotal: product.basePrice,
    });
  };

  return (
    <section id="quick-pot" className="py-16 bg-[#FFF6D9] border-b border-[#EFE4BF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#07552B] font-bold mb-1">
              <Utensils className="w-3.5 h-3.5 text-[#58A846]" />
              <span>Quick Pot & Extras</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#07552B] tracking-tight">
              Add Extra Proteins & Portions
            </h2>
            <p className="text-xs sm:text-sm text-[#536353] mt-1">
              Customize your plate. Add crispy chicken, spicy beef cubes, panla fish, fried plantain, or an extra hot scoop of rice.
            </p>
          </div>
        </div>

        {/* Proteins Grid: Pure White Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {proteins.map(item => (
            <div
              key={item.id}
              className="bg-white hover:bg-[#FFFBF0] p-4 rounded-2xl border border-[#EFE4BF] hover:border-[#07552B]/40 transition-all flex flex-col justify-between group shadow-xs hover:shadow-sm"
            >
              <div>
                <span className="font-display font-bold text-sm text-[#07552B] group-hover:text-[#F28C00] transition-colors line-clamp-1">
                  {item.name}
                </span>
                <p className="text-[11px] text-[#536353] line-clamp-2 mt-1">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F4EAC4]">
                <span className="font-mono text-sm font-extrabold text-[#07552B] tabular-nums">
                  ₦{item.basePrice.toLocaleString()}
                </span>
                <button
                  onClick={() => handleAddProtein(item)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#F28C00] hover:bg-[#D97D00] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
