import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { Product, DailyMenuItem, CartItem } from '../types';
import { useCart } from '../context/CartContext';

interface ProductModalProps {
  product: Product | null;
  menuItem?: DailyMenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  menuItem,
  isOpen,
  onClose,
}) => {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (product) {
      const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
      setSelectedVariantId(defaultVariant ? defaultVariant.id : '');
      setSelectedAddons({});
      setQuantity(1);
      setNotes('');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const basePrice = menuItem ? menuItem.displayPrice : product.basePrice;
  const currentVariant = product.variants?.find(v => v.id === selectedVariantId);
  const variantModifier = currentVariant ? currentVariant.priceModifier : 0;

  let addonsCost = 0;
  if (product.addons) {
    product.addons.forEach(addon => {
      const qty = selectedAddons[addon.id] || 0;
      addonsCost += addon.price * qty;
    });
  }

  const unitPrice = basePrice + variantModifier;
  const lineTotal = (unitPrice + addonsCost) * quantity;
  const maxAvailable = menuItem ? menuItem.availableQuantity : 50;

  const handleToggleAddon = (addonId: string, maxQty: number) => {
    setSelectedAddons(prev => {
      const current = prev[addonId] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[addonId];
        return next;
      }
      return { ...prev, [addonId]: 1 };
    });
  };

  const handleAddonQty = (addonId: string, delta: number, maxQty: number) => {
    setSelectedAddons(prev => {
      const current = prev[addonId] || 0;
      const nextVal = Math.max(0, Math.min(maxQty, current + delta));
      if (nextVal === 0) {
        const next = { ...prev };
        delete next[addonId];
        return next;
      }
      return { ...prev, [addonId]: nextVal };
    });
  };

  const handleAddToCart = () => {
    const addonsArray = product.addons
      ?.filter(a => selectedAddons[a.id] > 0)
      .map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
        quantity: selectedAddons[a.id],
      })) || [];

    const cartItem: CartItem = {
      cartItemId: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: product.id,
      productName: product.name,
      basePrice,
      unitPrice: unitPrice + addonsCost,
      quantity,
      selectedVariant: currentVariant
        ? {
            id: currentVariant.id,
            name: currentVariant.name,
            priceModifier: currentVariant.priceModifier,
          }
        : undefined,
      selectedAddons: addonsArray,
      notes: notes.trim() || undefined,
      imagePath: product.imagePath,
      lineTotal,
    };

    addItem(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white border border-[#EFE4BF] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#202820]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#202820] flex items-center justify-center transition-colors border border-[#EFE4BF] shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Header Image Container */}
          <div className="relative aspect-[16/9] w-full bg-[#FFFBF0] flex items-center justify-center p-6">
            <img
              src={product.imagePath}
              alt={product.name}
              className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)]"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#07552B] leading-tight">
                {product.name}
              </h2>
              <span className="font-mono font-extrabold text-2xl text-[#07552B] tabular-nums whitespace-nowrap">
                ₦{unitPrice.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-[#536353] leading-relaxed mb-6 font-normal">
              {product.description}
            </p>

            {/* Variants Section */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6 pt-4 border-t border-[#F2E8CA]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#07552B] mb-3">
                  Choose Portion / Variation
                </label>
                <div className="space-y-2">
                  {product.variants.map(variant => {
                    const isSelected = selectedVariantId === variant.id;
                    return (
                      <div
                        key={variant.id}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#E7F6EA] border-[#07552B] text-[#07552B] font-semibold'
                            : 'bg-white border-[#EFE4BF] text-[#202820] hover:bg-[#FFFBF0]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#07552B] bg-[#07552B]' : 'border-[#A0A0A0]'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm">{variant.name}</span>
                        </div>
                        <span className="font-mono text-sm tabular-nums font-bold">
                          {variant.priceModifier > 0
                            ? `+₦${variant.priceModifier.toLocaleString()}`
                            : 'Included'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Addons Section */}
            {product.addons && product.addons.length > 0 && (
              <div className="mb-6 pt-4 border-t border-[#F2E8CA]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#07552B] mb-3">
                  Select Add-ons & Sides (Optional)
                </label>
                <div className="space-y-2">
                  {product.addons.map(addon => {
                    const qty = selectedAddons[addon.id] || 0;
                    const isChecked = qty > 0;
                    return (
                      <div
                        key={addon.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                          isChecked
                            ? 'bg-[#FFFBF0] border-[#F28C00]'
                            : 'bg-white border-[#EFE4BF]'
                        }`}
                      >
                        <div
                          onClick={() => handleToggleAddon(addon.id, addon.maxQuantity)}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isChecked ? 'bg-[#58A846] border-[#58A846]' : 'border-[#A0A0A0]'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-[#202820]">{addon.name}</span>
                            <span className="block text-xs font-mono text-[#07552B] font-bold tabular-nums">
                              +₦{addon.price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {isChecked && (
                          <div className="flex items-center gap-2 bg-[#FFF6D9] rounded-lg px-2 py-1 border border-[#EFE4BF]">
                            <button
                              type="button"
                              onClick={() => handleAddonQty(addon.id, -1, addon.maxQuantity)}
                              className="w-5 h-5 flex items-center justify-center text-[#202820] hover:text-[#B91C1C]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono text-xs font-bold text-[#07552B] px-1">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddonQty(addon.id, 1, addon.maxQuantity)}
                              className="w-5 h-5 flex items-center justify-center text-[#202820] hover:text-[#58A846]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chef Preparation Notes */}
            <div className="mb-6 pt-4 border-t border-[#F2E8CA]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07552B] mb-2">
                Special Kitchen Instructions
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="E.g., extra spicy, pack pepper sauce separately, less salt..."
                maxLength={200}
                rows={2}
                className="w-full bg-[#FFFDF2] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] placeholder-[#8A908A] outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="p-4 sm:p-6 bg-[#FFFBF0] border-t border-[#EFE4BF] flex items-center justify-between gap-4">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 bg-white border border-[#EFE4BF] rounded-xl px-3 py-2 shadow-2xs">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="text-[#536353] hover:text-[#07552B] disabled:opacity-30 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-sm text-[#07552B] px-2 tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(q => Math.min(maxAvailable, q + 1))}
              disabled={quantity >= maxAvailable}
              className="text-[#536353] hover:text-[#07552B] disabled:opacity-30 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Bag CTA */}
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-between px-6 py-4 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F28C00]/25"
          >
            <span>Add to Bag</span>
            <span className="font-mono font-extrabold text-sm tabular-nums">
              ₦{lineTotal.toLocaleString()}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
