import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Product, DailyMenuItem } from '../types';

interface ProductCardProps {
  product: Product;
  menuItem?: DailyMenuItem;
  onSelect: (product: Product, menuItem?: DailyMenuItem) => void;
  onQuickAdd: (product: Product, menuItem?: DailyMenuItem) => void;
  promoBadge?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  menuItem,
  onSelect,
  onQuickAdd,
  promoBadge,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isAvailable = menuItem ? menuItem.isAvailable && menuItem.availableQuantity > 0 : product.isActive;
  const displayPrice = menuItem ? menuItem.displayPrice : product.basePrice;
  const hasVariantsOrAddons = (product.variants && product.variants.length > 1) || (product.addons && product.addons.length > 0);

  // Derive contextual badge
  let badgeText = promoBadge;
  let badgeStyle = "text-[#07552B] bg-[#E7F6EA] border-[#BFE3C7]";

  if (!isAvailable) {
    badgeText = "SOLD OUT";
    badgeStyle = "text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]";
  } else if (menuItem && menuItem.availableQuantity <= 5) {
    badgeText = `LIMITED QUANTITY (${menuItem.availableQuantity} LEFT)`;
    badgeStyle = "text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]";
  } else if (!badgeText) {
    badgeText = product.id.includes('jollof') ? "TODAY'S SPECIAL" : "FRESHLY PREPARED";
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-[#EFE4BF] hover:border-[#07552B]/40 transition-all duration-200 hover:-translate-y-1 shadow-xs hover:shadow-md"
    >
      {/* Food Photography Container */}
      <div 
        onClick={() => onSelect(product, menuItem)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#FFFBF0] flex items-center justify-center p-3 cursor-pointer"
      >
        {!imageError && product.imagePath ? (
          <img
            src={product.imagePath}
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className={`max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] transition-transform duration-500 ${
              isHovered ? 'scale-105' : 'scale-100'
            } ${!isAvailable ? 'grayscale filter brightness-75' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#FDF8E7] text-center">
            <span className="font-display font-bold text-base text-[#07552B] mb-1">{product.name}</span>
            <span className="text-xs text-[#536353]">Dera Buzor Kitchen</span>
          </div>
        )}

        {/* Promotional / Status Label */}
        {badgeText && (
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${badgeStyle}`}>
              {badgeText}
            </span>
          </div>
        )}
      </div>

      {/* Card Content & Action */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          <h3 
            onClick={() => onSelect(product, menuItem)}
            className="font-display font-bold text-base sm:text-lg text-[#07552B] mb-1.5 line-clamp-1 group-hover:text-[#F28C00] transition-colors cursor-pointer"
          >
            {product.name}
          </h3>
          <p className="text-xs text-[#536353] leading-relaxed line-clamp-2 mb-4 font-normal">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#F2E8CA]">
          {/* Price with Tabular Numerals */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8A908A]">Price</span>
            <span className="font-mono font-extrabold text-lg text-[#07552B] tabular-nums">
              ₦{displayPrice.toLocaleString()}
            </span>
          </div>

          {/* Action Button */}
          {isAvailable ? (
            hasVariantsOrAddons ? (
              <button
                onClick={() => onSelect(product, menuItem)}
                className="px-3.5 py-2 text-xs font-bold text-[#07552B] bg-[#FFF6D9] hover:bg-[#F28C00] hover:text-white rounded-xl transition-all whitespace-nowrap shrink-0 border border-[#EFE4BF] hover:border-transparent"
              >
                Customize
              </button>
            ) : (
              <button
                onClick={() => onQuickAdd(product, menuItem)}
                aria-label={`Add ${product.name} to order`}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#F28C00] hover:bg-[#D97D00] rounded-xl transition-all whitespace-nowrap shrink-0 shadow-sm shadow-[#F28C00]/25"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )
          ) : (
            <span className="text-xs font-semibold text-[#B91C1C] uppercase font-mono">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
