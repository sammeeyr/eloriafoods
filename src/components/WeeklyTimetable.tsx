import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { WEEKLY_TIMETABLE } from '../data/mockData';
import { useCart } from '../context/CartContext';

interface WeeklyTimetableProps {
  onSelectDish: (dishName: string) => void;
}

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({ onSelectDish }) => {
  const { addItem } = useCart();
  const [selectedDay, setSelectedDay] = useState<string>('MON');

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const activeDish = WEEKLY_TIMETABLE[selectedDay];

  const handleQuickAdd = () => {
    addItem({
      cartItemId: `ci-tt-${selectedDay}-${Date.now()}`,
      productId: `prod-tt-${selectedDay.toLowerCase()}`,
      productName: activeDish.dishName,
      basePrice: activeDish.price,
      unitPrice: activeDish.price,
      quantity: 1,
      selectedVariant: { id: 'v-std', name: 'Timetable Portion', priceModifier: 0 },
      selectedAddons: [],
      imagePath: activeDish.imagePath,
      lineTotal: activeDish.price,
    });
  };

  return (
    <section id="timetable" className="py-16 bg-[#FFF6D9] border-b border-[#EFE4BF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#07552B] font-bold block mb-1">
              Monday – Friday Lunch Menu
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#07552B] tracking-tight">
              Weekly Lunch Timetable
            </h2>
            <p className="text-xs sm:text-sm text-[#536353] mt-1">
              Cooked fresh every day by 11:30 AM. Pre-order your lunch or request immediate delivery.
            </p>
          </div>

          {/* Day Segmented Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-[#EFE4BF] self-start md:self-auto overflow-x-auto scrollbar-none shadow-xs">
            {days.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  selectedDay === d
                    ? 'bg-[#07552B] text-white shadow-xs'
                    : 'text-[#07552B] hover:bg-[#FFF6D9]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Showcase Card */}
        <div className="bg-[#07552B] rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-lg text-[#F2F8EE]">
          <div className="relative aspect-square md:aspect-auto md:h-64 flex items-center justify-center p-4 bg-white/10 rounded-2xl">
            <img
              src={activeDish.imagePath}
              alt={activeDish.dishName}
              className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)] hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="md:col-span-2 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-white uppercase bg-[#F28C00] px-3 py-0.5 rounded-full shadow-2xs">
                  {activeDish.day} Special
                </span>
                <span className="text-xs text-[#BFE3B8] font-mono">
                  Cooked Fresh by 11:30 AM
                </span>
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white mb-2 leading-tight">
                {activeDish.dishName}
              </h3>
              <p className="text-xs sm:text-sm text-[#D6E8CF] leading-relaxed max-w-xl">
                Served hot with your choice of protein and sweet dodo plantain. Packaged in insulated eco-friendly food bowls to retain moisture and warmth.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#BFE3B8] uppercase font-mono">Price per portion</span>
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  ₦{activeDish.price.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleQuickAdd}
                  className="flex items-center gap-2 px-6 py-3.5 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F28C00]/25"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {activeDish.day} Meal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
