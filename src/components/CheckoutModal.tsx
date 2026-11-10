import React, { useState } from 'react';
import { X, CreditCard, Building2, Banknote, ArrowRight, Truck, Store, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PaymentMethod, CheckoutPayload, Order } from '../types';
import { submitCheckout, initializePayment } from '../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order, authorizationUrl?: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const {
    items,
    clearCart,
    subtotal,
    deliveryFee,
    discountAmount,
    totalAmount,
    fulfilmentType,
    selectedZoneId,
    deliveryZones,
    promoCode,
  } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [pickupTime, setPickupTime] = useState('As soon as possible (~30 mins)');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [transferReference, setTransferReference] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please enter your full name and phone number.');
      return;
    }

    if (fulfilmentType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Please provide your delivery address in Lagos.');
      return;
    }

    try {
      setIsSubmitting(true);

      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;

      const payload: CheckoutPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        fulfilmentType,
        deliveryAddress: fulfilmentType === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryZoneId: fulfilmentType === 'delivery' ? selectedZoneId : undefined,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        pickupTime: fulfilmentType === 'pickup' ? pickupTime : undefined,
        paymentMethod,
        customerNotes: customerNotes.trim() || (transferReference ? `Transfer Ref: ${transferReference}` : undefined),
        promoCode: promoCode || undefined,
        idempotencyKey,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.selectedVariant?.id,
          variantName: item.selectedVariant?.name,
          selectedAddons: item.selectedAddons,
          quantity: item.quantity,
          notes: item.notes,
        })),
      };

      const result = await submitCheckout(payload);

      if (result.success && result.order) {
        clearCart();

        // If online payment, initialize payment gateway
        if (paymentMethod === 'paystack' || paymentMethod === 'flutterwave') {
          try {
            const payInit = await initializePayment(result.orderNumber, customerEmail);
            onOrderSuccess(result.order, payInit.authorizationUrl);
          } catch (payErr: any) {
            console.warn('Online payment initialization warning:', payErr);
            onOrderSuccess(result.order);
          }
        } else {
          onOrderSuccess(result.order);
        }
      } else {
        setErrorMessage('Failed to place order. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white border border-[#EFE4BF] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-[#202820]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#EFE4BF] flex items-center justify-between bg-[#FFF6D9]">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-[#07552B]">Checkout & Order Placement</h2>
            <p className="text-xs text-[#536353] mt-0.5">
              {fulfilmentType === 'delivery' ? 'Lagos Doorstep Delivery' : 'Lounge Pickup'} · Total: <span className="font-bold text-[#07552B]">₦{totalAmount.toLocaleString()}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#FFFBF0] text-[#202820] flex items-center justify-center transition-colors border border-[#EFE4BF] shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#07552B] mb-3 font-mono">
              1. Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#536353] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Chidera Nwosu"
                  className="w-full bg-[#FFFDF2] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] placeholder-[#8A908A] outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#536353] mb-1">Phone Number (WhatsApp Active) *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 0803 123 4567"
                  className="w-full bg-[#FFFDF2] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] placeholder-[#8A908A] outline-none font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#536353] mb-1">Email Address (Optional for E-Receipt)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  className="w-full bg-[#FFFDF2] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] placeholder-[#8A908A] outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fulfilment Details */}
          <div className="pt-4 border-t border-[#F2E8CA]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#07552B] mb-3 font-mono">
              2. Fulfilment Destination ({fulfilmentType.toUpperCase()})
            </h3>
            {fulfilmentType === 'delivery' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#536353] mb-1">
                    Street Address & Apartment / Estate *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. House 14, Block B, Road 3, Lekki Phase 1"
                    className="w-full bg-[#FFFDF2] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] placeholder-[#8A908A] outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#536353] mb-1">
                    Delivery Instructions / Landmark
                  </label>
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={e => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g. Call security on arrival, opposite Ebeano supermarket"
                    className="w-full bg-[#FFFDF2] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] placeholder-[#8A908A] outline-none font-medium"
                  />
                </div>
                <div className="text-xs text-[#536353] bg-[#FFF6D9] p-3 rounded-xl border border-[#EFE4BF]">
                  Delivering to: <span className="text-[#07552B] font-bold">{selectedZone?.name}</span> (₦{deliveryFee.toLocaleString()} fee included)
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#536353] mb-1">Pickup Time</label>
                  <select
                    value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    className="w-full bg-[#FFFDF2] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] outline-none font-medium"
                  >
                    <option value="As soon as possible (~30 mins)">As soon as possible (~30 mins)</option>
                    <option value="In 45 minutes">In 45 minutes</option>
                    <option value="In 1 hour">In 1 hour</option>
                    <option value="This Evening (7:00 PM - 9:00 PM)">This Evening (7:00 PM - 9:00 PM)</option>
                  </select>
                </div>
                <div className="text-xs text-[#536353] bg-[#FFF6D9] p-3 rounded-xl border border-[#EFE4BF]">
                  Pickup Address: <span className="text-[#07552B] font-bold">Plot 14B Admiralty Way, Lekki Phase 1, Lagos</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Payment Method */}
          <div className="pt-4 border-t border-[#F2E8CA]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#07552B] mb-3 font-mono">
              3. Payment Selection
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Paystack */}
              <div
                onClick={() => setPaymentMethod('paystack')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'paystack'
                    ? 'bg-[#E7F6EA] border-[#07552B] shadow-xs'
                    : 'bg-[#FFFBF0] border-[#EFE4BF] text-[#536353] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#07552B]">Paystack Online</span>
                  <CreditCard className="w-4 h-4 text-[#F28C00]" />
                </div>
                <p className="text-[11px] text-[#536353]">
                  Instant debit card, USSD, Apple Pay & Bank App transfer.
                </p>
              </div>

              {/* Bank Transfer */}
              <div
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-[#E7F6EA] border-[#07552B] shadow-xs'
                    : 'bg-[#FFFBF0] border-[#EFE4BF] text-[#536353] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#07552B]">Direct Bank Transfer</span>
                  <Building2 className="w-4 h-4 text-[#F28C00]" />
                </div>
                <p className="text-[11px] text-[#536353]">
                  Transfer directly to Dera Buzor Lounge GTBank account.
                </p>
              </div>

              {/* Cash On Delivery / Pickup */}
              <div
                onClick={() => setPaymentMethod(fulfilmentType === 'delivery' ? 'cash_on_delivery' : 'cash_on_pickup')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between sm:col-span-2 ${
                  paymentMethod === 'cash_on_delivery' || paymentMethod === 'cash_on_pickup'
                    ? 'bg-[#E7F6EA] border-[#07552B] shadow-xs'
                    : 'bg-[#FFFBF0] border-[#EFE4BF] text-[#536353] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#07552B]">
                    {fulfilmentType === 'delivery' ? 'Cash on Delivery (COD)' : 'Cash / POS at Lounge Counter'}
                  </span>
                  <Banknote className="w-4 h-4 text-[#F28C00]" />
                </div>
                <p className="text-[11px] text-[#536353]">
                  Pay in cash or POS card machine upon receiving your order.
                </p>
              </div>
            </div>

            {/* Bank Transfer Details Box */}
            {paymentMethod === 'bank_transfer' && (
              <div className="mt-4 p-4 rounded-2xl bg-[#FFF6D9] border border-[#EFE4BF] space-y-2 text-xs">
                <div className="font-bold text-[#07552B]">Official Restaurant Bank Account:</div>
                <div className="text-[#202820] space-y-0.5">
                  <p><span className="text-[#536353]">Bank:</span> Guaranty Trust Bank (GTBank)</p>
                  <p><span className="text-[#536353]">Account Name:</span> DERA BUZOR LOUNGE & SUITES LTD</p>
                  <p className="font-mono text-sm font-bold text-[#07552B] tracking-wider">
                    <span className="text-[#536353] font-sans font-normal text-xs">Account No:</span> 0129845721
                  </p>
                </div>
                <div className="pt-2">
                  <label className="block text-[11px] text-[#536353] mb-1 font-semibold">
                    Your Transfer Reference or Sender Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={transferReference}
                    onChange={e => setTransferReference(e.target.value)}
                    placeholder="e.g. GTB-TRF-Chidera"
                    className="w-full bg-white border border-[#EFE4BF] rounded-xl p-2.5 text-xs text-[#202820] outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Action */}
        <div className="p-5 sm:p-6 bg-[#FFFBF0] border-t border-[#EFE4BF] flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#536353] uppercase font-mono tracking-wider">Total to Pay</span>
            <span className="font-mono font-black text-2xl text-[#07552B] tabular-nums">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-7 py-4 bg-[#F28C00] hover:bg-[#D97D00] disabled:bg-[#A0A0A0] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F28C00]/25"
          >
            <span>{isSubmitting ? 'Securing Order...' : 'Confirm & Place Order'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
