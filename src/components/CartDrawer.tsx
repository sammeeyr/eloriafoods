import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, Store, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    discountAmount,
    totalAmount,
    fulfilmentType,
    setFulfilmentType,
    selectedZoneId,
    setSelectedZoneId,
    deliveryZones,
    promoCode,
    setPromoCode,
    applyPromo,
    removePromo,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
  } = useCart();

  const [inputCode, setInputCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setIsApplyingPromo(true);
    setPromoMessage(null);
    const result = await applyPromo(inputCode);
    setIsApplyingPromo(false);
    setPromoMessage({ text: result.message, isError: !result.success });
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FFF6D9] border-l border-[#EFE4BF] shadow-2xl flex flex-col text-[#202820]">
          {/* Cart Header */}
          <div className="p-5 border-b border-[#EFE4BF] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#07552B]/10 flex items-center justify-center text-[#07552B]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-lg text-[#07552B]">Your Order Bag</h2>
                <span className="text-[11px] text-[#536353] font-mono">({items.length} dishes / items)</span>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-[#FFF6D9] hover:bg-[#FDEBA6] text-[#202820] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-white border border-[#EFE4BF] flex items-center justify-center mx-auto mb-4 text-[#8A908A] shadow-xs">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <p className="text-base font-bold text-[#07552B] mb-1">Your bag is empty</p>
                <p className="text-xs text-[#536353] mb-6">Explore today’s menu to add your favorite Abuja delicacies.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 bg-[#F28C00] hover:bg-[#D97D00] text-white text-xs font-bold rounded-xl transition-colors shadow-xs uppercase tracking-wider"
                >
                  View Today's Dishes
                </button>
              </div>
            ) : (
              <>
                {/* Fulfilment Mode Selector */}
                <div className="bg-white p-1 rounded-2xl border border-[#EFE4BF] grid grid-cols-2 gap-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setFulfilmentType('delivery')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
                      fulfilmentType === 'delivery'
                        ? 'bg-[#07552B] text-white shadow-xs'
                        : 'text-[#07552B] hover:bg-[#FFF6D9]'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Abuja Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfilmentType('pickup')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
                      fulfilmentType === 'pickup'
                        ? 'bg-[#07552B] text-white shadow-xs'
                        : 'text-[#07552B] hover:bg-[#FFF6D9]'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Lounge Pickup</span>
                  </button>
                </div>

                {/* Delivery Zone Selector (When Delivery selected) */}
                {fulfilmentType === 'delivery' && (
                  <div className="bg-white p-4 rounded-2xl border border-[#EFE4BF] shadow-xs">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#07552B] mb-2 font-mono">
                      Select Delivery Area
                    </label>
                    <select
                      value={selectedZoneId}
                      onChange={e => setSelectedZoneId(e.target.value)}
                      className="w-full bg-[#FFFDF2] border border-[#EFE4BF] rounded-xl px-3 py-2.5 text-xs text-[#202820] focus:border-[#07552B] outline-none font-medium"
                    >
                      {deliveryZones.map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} — ₦{zone.fee.toLocaleString()} ({zone.estimatedMinutes} mins)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Itemized Cart List */}
                <div className="space-y-3.5">
                  {items.map(item => (
                    <div
                      key={item.cartItemId}
                      className="flex gap-3.5 p-4 bg-white rounded-2xl border border-[#EFE4BF] shadow-xs"
                    >
                      <img
                        src={item.imagePath}
                        alt={item.productName}
                        className="w-16 h-16 object-contain rounded-xl bg-[#FFFBF0] shrink-0 p-1"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-[#07552B] truncate">
                            {item.productName}
                          </h4>
                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            className="text-[#8A908A] hover:text-[#B91C1C] transition-colors p-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {item.selectedVariant && (
                          <p className="text-[11px] text-[#58A846] font-semibold mt-0.5">
                            {item.selectedVariant.name}
                          </p>
                        )}

                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <div className="text-[11px] text-[#536353] mt-0.5 space-y-0.5">
                            {item.selectedAddons.map((addon, idx) => (
                              <div key={idx}>+ {addon.quantity}x {addon.name}</div>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-[11px] text-[#536353] italic mt-1 bg-[#FFF6D9] px-2 py-0.5 rounded-lg border border-[#EFE4BF]">
                            "{item.notes}"
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#F4EAC4]">
                          {/* Quantity stepper */}
                          <div className="flex items-center gap-2 bg-[#FFF6D9] border border-[#EFE4BF] rounded-lg px-2 py-0.5">
                            <button
                              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                              className="text-[#536353] hover:text-[#07552B]"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-xs font-bold text-[#07552B] px-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              className="text-[#536353] hover:text-[#07552B]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="font-mono font-extrabold text-sm text-[#07552B] tabular-nums">
                            ₦{item.lineTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promotional Code Input */}
                <div className="bg-white p-4 rounded-2xl border border-[#EFE4BF] shadow-xs">
                  {promoCode ? (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#58A846] font-bold">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Code "{promoCode}" applied (-₦{discountAmount.toLocaleString()})</span>
                      </div>
                      <button
                        onClick={removePromo}
                        className="text-[#B91C1C] hover:underline text-[11px] font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value.toUpperCase())}
                        placeholder="Promo code (e.g. RELAX10)"
                        className="flex-1 bg-[#FFFDF2] border border-[#EFE4BF] rounded-xl px-3 py-2 text-xs text-[#202820] uppercase placeholder-[#8A908A] outline-none focus:border-[#07552B] font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingPromo}
                        className="px-4 py-2 bg-[#07552B] hover:bg-[#054020] text-white text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
                      >
                        {isApplyingPromo ? '...' : 'Apply'}
                      </button>
                    </form>
                  )}
                  {promoMessage && (
                    <p className={`text-[11px] mt-2 font-semibold ${promoMessage.isError ? 'text-[#B91C1C]' : 'text-[#58A846]'}`}>
                      {promoMessage.text}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Cart Footer Summary & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 bg-white border-t border-[#EFE4BF] space-y-3.5 shadow-lg">
              <div className="space-y-1.5 text-xs text-[#536353]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#202820] font-bold tabular-nums">₦{subtotal.toLocaleString()}</span>
                </div>
                {fulfilmentType === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Abuja Delivery Fee</span>
                    <span className="font-mono text-[#202820] font-bold tabular-nums">₦{deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#58A846] font-bold">
                    <span>Promotional Discount</span>
                    <span className="font-mono tabular-nums">-₦{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#07552B] pt-2 border-t border-[#F2E8CA]">
                  <span>Total Amount</span>
                  <span className="font-mono text-xl text-[#07552B] font-black tabular-nums">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F28C00]/30"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
