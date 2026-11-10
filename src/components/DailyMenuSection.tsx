import React, { useState, useEffect } from 'react';
import { Calendar, Utensils, Filter } from 'lucide-react';
import { Product, DailyMenuItem, DailyMenu } from '../types';
import { ProductCard } from './ProductCard';
import { fetchTodayMenu } from '../services/api';
import { generateInitialDailyMenu } from '../data/mockData';
import { useCart } from '../context/CartContext';

interface DailyMenuSectionProps {
  onSelectProduct: (product: Product, menuItem?: DailyMenuItem) => void;
}

interface MealCategoryFilter {
  id: string;
  name: string;
}

const MEAL_CATEGORIES: MealCategoryFilter[] = [
  { id: 'all', name: 'All Dishes' },
  { id: 'soups', name: 'Soups' },
  { id: 'swallows', name: 'Swallows' },
  { id: 'rice-mains', name: 'Rice & Mains' },
  { id: 'small-chops', name: 'Small Chops' },
  { id: 'drinks', name: 'Drinks' },
];

export const DailyMenuSection: React.FC<DailyMenuSectionProps> = ({ onSelectProduct }) => {
  const { addItem } = useCart();
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(() => generateInitialDailyMenu());
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
      }
    } catch (err: any) {
      console.warn('Network issue loading live daily menu, using fallback:', err);
      if (!dailyMenu) {
        setDailyMenu(generateInitialDailyMenu());
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

  // Helper matching product to meal category
  const isItemInCategory = (product: Product, catId: string): boolean => {
    if (catId === 'all') return true;
    if (product.mealType === catId) return true;

    const name = (product.name || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();
    const cat = (product.categoryId || '').toLowerCase();

    if (catId === 'soups') {
      return name.includes('soup') || desc.includes('soup') || name.includes('egusi') || name.includes('ogbono') || name.includes('afang');
    }
    if (catId === 'swallows') {
      return (
        name.includes('swallow') ||
        name.includes('pounded yam') ||
        desc.includes('pounded yam') ||
        desc.includes('eba') ||
        desc.includes('semovita') ||
        desc.includes('swallow') ||
        name.includes('egusi')
      );
    }
    if (catId === 'rice-mains') {
      return (
        name.includes('rice') ||
        name.includes('jollof') ||
        name.includes('spaghetti') ||
        name.includes('yam') ||
        name.includes('beans')
      );
    }
    if (catId === 'small-chops') {
      return (
        name.includes('small chops') ||
        name.includes('chops') ||
        name.includes('asun') ||
        name.includes('gizzard') ||
        name.includes('puff puff') ||
        name.includes('samosa') ||
        name.includes('spring roll') ||
        name.includes('chicken') ||
        name.includes('beef') ||
        name.includes('titus') ||
        name.includes('panla') ||
        name.includes('ponmo') ||
        name.includes('plantain') ||
        name.includes('dodo') ||
        cat === 'cat-proteins'
      );
    }
    if (catId === 'drinks') {
      return (
        cat === 'cat-drinks' ||
        name.includes('zobo') ||
        name.includes('soya') ||
        name.includes('soda') ||
        name.includes('water') ||
        name.includes('cocktail') ||
        name.includes('drink')
      );
    }
    return false;
  };

  const allItems = dailyMenu?.items || [];

  // Filter items based on selected category
  const filteredItems = allItems.filter(item => {
    if (!item.product) return false;
    return isItemInCategory(item.product, selectedCategory);
  });

  // Calculate count for each category
  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return allItems.length;
    return allItems.filter(item => item.product && isItemInCategory(item.product, catId)).length;
  };

  return (
    <section id="today-menu" className="py-20 bg-[#FFF6D9] border-b border-[#EFE4BF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & Abuja Date Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
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
        </div>

        {/* Category Filtering Bar (Soups, Swallows, Rice & Mains, Small Chops, Drinks) */}
        <div className="mb-10 bg-white p-2.5 rounded-2xl border border-[#EFE4BF] shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {MEAL_CATEGORIES.map(cat => {
              const count = getCategoryCount(cat.id);
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? 'bg-[#07552B] text-white shadow-sm'
                      : 'text-[#07552B] hover:bg-[#FFF6D9] hover:text-[#F28C00]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FFF6D9] text-[#536353]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
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
            <Utensils className="w-8 h-8 text-[#07552B] mx-auto mb-3 opacity-60" />
            <p className="font-semibold text-[#07552B] mb-1">No dishes found under this category today.</p>
            <p className="text-xs text-[#536353] mb-4">Please explore our other fresh selections.</p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-4 py-2 bg-[#07552B] hover:bg-[#054020] text-white rounded-xl text-xs font-bold transition-colors"
            >
              View All Dishes
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
