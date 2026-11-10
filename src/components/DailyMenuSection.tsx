import React, { useState, useEffect } from 'react';
import { Calendar, Utensils, Sparkles } from 'lucide-react';
import { Product, DailyMenuItem, DailyMenu, Category } from '../types';
import { ProductCard } from './ProductCard';
import { fetchTodayMenu } from '../services/api';
import { generateInitialDailyMenu, INITIAL_CATEGORIES } from '../data/mockData';
import { useCart } from '../context/CartContext';

interface DailyMenuSectionProps {
  onSelectProduct: (product: Product, menuItem?: DailyMenuItem) => void;
}

export const DailyMenuSection: React.FC<DailyMenuSectionProps> = ({ onSelectProduct }) => {
  const { addItem } = useCart();
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(() => generateInitialDailyMenu());
  const [categories, setCategories] = useState<Category[]>(() => INITIAL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setError(null);
      const data: any = await fetchTodayMenu();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setDailyMenu(data);
        if (data.categories) {
          setCategories(data.categories);
        }
      }
    } catch (err: any) {
      console.warn('Network issue loading live daily menu, using fallback:', err);
      // Ensure dailyMenu is populated from fallback
      if (!dailyMenu) {
        setDailyMenu(generateInitialDailyMenu());
        setCategories(INITIAL_CATEGORIES);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (product: Product, menuItem?: DailyMenuItem) => {
    const displayPrice = menuItem ? menuItem.displayPrice : product.basePrice;
    const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];

    addItem({
      cartItemId: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: product.id,
      productName: product.name,
      basePrice: displayPrice,
      unitPrice: displayPrice + (defaultVariant?.priceModifier || 0),
      quantity: 1,
      selectedVariant: defaultVariant
        ? {
            id: defaultVariant.id,
            name: defaultVariant.name,
            priceModifier: defaultVariant.priceModifier,
          }
        : undefined,
      selectedAddons: [],
      imagePath: product.imagePath,
      lineTotal: displayPrice + (defaultVariant?.priceModifier || 0),
    });
  };

  // Filter items based on selected category
  const filteredItems = dailyMenu?.items.filter(item => {
    if (selectedCategory === 'all') return true;
    const category = categories.find(c => c.slug === selectedCategory);
    return item.product?.categoryId === category?.id;
  }) || [];

  return (
    <section id="today-menu" className="py-20 bg-[#FFF6D9] border-b border-[#EFE4BF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & Lagos Date Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#07552B] mb-2 uppercase tracking-widest font-bold">
              <Calendar className="w-3.5 h-3.5 text-[#58A846]" />
              <span>Abuja Business Date · {dailyMenu?.menuDate || 'Today'}</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#07552B] tracking-tight">
              TODAY'S MENU
            </h2>
            <p className="text-sm text-[#536353] mt-2 max-w-xl font-normal">
              {dailyMenu?.description || 'Authentic slow-smoked firewood delicacies, charcoal-grilled seafood, and artisan drinks freshly prepared for you.'}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#07552B] text-white shadow-sm'
                  : 'bg-white text-[#07552B] hover:bg-[#FFFBF0] border border-[#EFE4BF]'
              }`}
            >
              All Selections
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-[#07552B] text-white shadow-sm'
                    : 'bg-white text-[#07552B] hover:bg-[#FFFBF0] border border-[#EFE4BF]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-[#EFE4BF]" />
            ))}
          </div>
        )}

        {/* Error State only if completely empty */}
        {error && (!dailyMenu || dailyMenu.items.length === 0) && (
          <div className="p-8 rounded-2xl bg-white border border-[#EFE4BF] text-center max-w-md mx-auto shadow-sm">
            <p className="text-sm text-[#B91C1C] mb-4 font-semibold">{error}</p>
            <button
              onClick={loadMenu}
              className="px-5 py-2.5 bg-[#F28C00] hover:bg-[#D97D00] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Retry Loading Menu
            </button>
          </div>
        )}

        {/* Products Grid (Pure White Cards on Warm Cream Canvas) */}
        {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredItems.map(item => {
                if (!item.product) return null;
                return (
                  <ProductCard
                    key={item.id}
                    product={item.product}
                    menuItem={item}
                    onSelect={onSelectProduct}
                    onQuickAdd={handleQuickAdd}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-[#536353] text-sm bg-white rounded-2xl border border-[#EFE4BF]">
              No dishes found under this category today. Please explore our other selections.
            </div>
          )}
      </div>
    </section>
  );
};
