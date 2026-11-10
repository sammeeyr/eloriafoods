import React from 'react';
import { Flame, Utensils, GlassWater } from 'lucide-react';

export const StorySection: React.FC = () => {
  return (
    <section id="lounge-story" className="py-24 bg-[#FFF6D9] border-b border-[#EFE4BF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#07552B] font-bold block mb-2">
            The Philosophy of Dera Buzor
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-[#07552B] tracking-tight">
            Craftsmanship in Every Dish. Relaxation in Every Moment.
          </h2>
          <p className="text-sm text-[#536353] mt-3 leading-relaxed">
            At Dera Buzor Lounge, dining is not merely sustenance—it is an elevated Nigerian culinary ritual. We pair ancient firewood traditions with modern lounge comfort.
          </p>
        </div>

        {/* 3 Pillar Grid in Pure White Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Firewood Jollof */}
          <div className="flex flex-col bg-white rounded-3xl overflow-hidden border border-[#EFE4BF] shadow-xs hover:shadow-md transition-all">
            <div className="relative aspect-[4/3] w-full bg-[#FFFBF0] flex items-center justify-center p-4">
              <img
                src="/assets/aistudio/jollof-plate_ea4269ad.png"
                alt="Firewood jollof rice at Dera Buzor Lounge"
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#07552B] font-bold mb-2">
                  <Flame className="w-3.5 h-3.5 text-[#F28C00]" />
                  <span>The Firewood Secret</span>
                </div>
                <h3 className="font-display font-bold text-xl text-[#07552B] mb-2">
                  Smokey Firewood Simmer
                </h3>
                <p className="text-xs text-[#536353] leading-relaxed">
                  Our celebrated party jollof is slow-cooked over aged natural hardwood logs to infuse deep, smoky undertones that cannot be replicated on gas stoves.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#F4EAC4] text-[11px] text-[#8A908A] font-mono">
                Natural aromatics · Charred sweetness · Aged red peppers
              </div>
            </div>
          </div>

          {/* Pillar 2: Artisanal Soups */}
          <div className="flex flex-col bg-white rounded-3xl overflow-hidden border border-[#EFE4BF] shadow-xs hover:shadow-md transition-all">
            <div className="relative aspect-[4/3] w-full bg-[#FFFBF0] flex items-center justify-center p-4">
              <img
                src="/assets/aistudio/egusi_15da00a5.png"
                alt="Rich traditional Egusi soup"
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#07552B] font-bold mb-2">
                  <Utensils className="w-3.5 h-3.5 text-[#58A846]" />
                  <span>Native Heritage</span>
                </div>
                <h3 className="font-display font-bold text-xl text-[#07552B] mb-2">
                  Rich Artisanal Native Soups
                </h3>
                <p className="text-xs text-[#536353] leading-relaxed">
                  Stone-ground melon seeds, river catfish, and tender cuts of beef simmered with fresh pumpkin ugwu leaves and aromatic local spices.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#F4EAC4] text-[11px] text-[#8A908A] font-mono">
                Smoked stockfish · Pure red palm oil · Soft pounded yam
              </div>
            </div>
          </div>

          {/* Pillar 3: Mixology & Lounge Bar */}
          <div className="flex flex-col bg-white rounded-3xl overflow-hidden border border-[#EFE4BF] shadow-xs hover:shadow-md transition-all">
            <div className="relative aspect-[4/3] w-full bg-[#FFFBF0] flex items-center justify-center p-4">
              <img
                src="/src/assets/images/drinks_cocktail_special_1794247405359.jpg"
                alt="Buzor signature hibiscus cocktail"
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#07552B] font-bold mb-2">
                  <GlassWater className="w-3.5 h-3.5 text-[#58A846]" />
                  <span>Artisan Mixology</span>
                </div>
                <h3 className="font-display font-bold text-xl text-[#07552B] mb-2">
                  Botanical Zobo Infusions
                </h3>
                <p className="text-xs text-[#536353] leading-relaxed">
                  Crafted by our resident mixologists using cold-steeped organic hibiscus calyces, freshly crushed ginger root, cloves, and premium chilled blends.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#F4EAC4] text-[11px] text-[#8A908A] font-mono">
                Crystal ice · Fresh mint garnish · Handcrafted syrups
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
