import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, RefreshCw, Truck, Store, MessageSquare, AlertCircle, Calendar, Clock } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { fetchOrder } from '../services/api';

interface OrderConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  authorizationUrl?: string;
  onOpenSandbox?: (url: string) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order: initialOrder,
  isOpen,
  onClose,
  authorizationUrl,
  onOpenSandbox,
}) => {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  // Periodic poll to refresh status if open and not completed/cancelled
  useEffect(() => {
    if (!isOpen || !order) return;
    if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled') return;

    const interval = setInterval(() => {
      refreshOrderStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen, order?.orderNumber, order?.orderStatus]);

  if (!isOpen || !order) return null;

  const refreshOrderStatus = async () => {
    try {
      setIsRefreshing(true);
      const updated = await fetchOrder(order.orderNumber);
      setOrder(updated);
    } catch (err) {
      console.warn('Failed to refresh order status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const statusSteps: Array<{ key: OrderStatus; label: string }> = [
    { key: 'pending', label: 'Received' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'In Kitchen' },
    {
      key: order.fulfilmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup',
      label: order.fulfilmentType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup',
    },
    { key: 'completed', label: 'Delivered / Handed Over' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'preparing': return 2;
      case 'out_for_delivery':
      case 'ready_for_pickup': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order.orderStatus);

  // Pre-format WhatsApp Message (Requirement 11)
  const itemsSummary = (order.items || [])
    .map(i => `• ${i.quantity}x ${i.productNameSnapshot}`)
    .join('\n');

  const waMessage = encodeURIComponent(
    `*DERA BUZOR LOUNGE ORDER UPDATE*\n\n` +
    `Hello! I just placed an order:\n` +
    `*Order Number:* ${order.orderNumber}\n` +
    `*Customer:* ${order.customerName} (${order.customerPhone})\n` +
    `*Fulfilment:* ${order.fulfilmentType.toUpperCase()} ${order.deliveryAddress ? `to ${order.deliveryAddress}` : ''}\n` +
    `*Total Amount:* ₦${order.totalAmount.toLocaleString()}\n` +
    `*Payment Method:* ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})\n\n` +
    `*Items ordered:*\n${itemsSummary}\n\n` +
    `Please confirm receipt and estimated delivery/pickup time. Thank you!`
  );

  const whatsappUrl = `https://wa.me/2348145550192?text=${waMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white border border-[#EFE4BF] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-[#202820]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#EFE4BF] bg-[#FFF6D9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#58A846]/15 text-[#58A846] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#536353] font-bold">Order Received</span>
              <h2 className="font-mono font-black text-xl text-[#07552B]">
                {order.orderNumber}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshOrderStatus}
              disabled={isRefreshing}
              title="Refresh live kitchen status"
              className="p-2.5 text-[#07552B] hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#EFE4BF]"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#F28C00]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-[#202820] hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#EFE4BF]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6">
          {/* Online Payment Notice (If pending Paystack) */}
          {order.paymentStatus === 'pending' && authorizationUrl && (
            <div className="p-4 rounded-2xl bg-[#FFF6D9] border border-[#F28C00]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#F28C00] block">
                  Online Payment Pending (₦{order.totalAmount.toLocaleString()})
                </span>
                <span className="text-[11px] text-[#536353]">
                  Complete transaction to lock in your kitchen preparation slot.
                </span>
              </div>
              <button
                onClick={() => {
                  if (onOpenSandbox && authorizationUrl.includes('sandbox')) {
                    onOpenSandbox(authorizationUrl);
                  } else {
                    window.location.href = authorizationUrl;
                  }
                }}
                className="px-5 py-2.5 bg-[#F28C00] hover:bg-[#D97D00] text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs uppercase tracking-wider"
              >
                Complete Payment Now
              </button>
            </div>
          )}

          {/* Bank Transfer Instructions (If pending transfer) */}
          {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && (
            <div className="p-4 rounded-2xl bg-[#FFFBF0] border border-[#EFE4BF] text-xs space-y-1.5">
              <span className="font-bold text-[#07552B] block">
                Bank Transfer Instructions
              </span>
              <p className="text-[#536353]">
                Please transfer <span className="font-bold text-[#07552B] font-mono">₦{order.totalAmount.toLocaleString()}</span> to:
              </p>
              <p className="text-[#07552B] font-mono text-sm font-bold">
                GTBank · 0129845721 · DERA BUZOR LOUNGE & SUITES LTD
              </p>
              <p className="text-[11px] text-[#8A908A]">
                Please use order number <span className="text-[#07552B] font-mono font-bold">{order.orderNumber}</span> as your transfer remarks.
              </p>
            </div>
          )}

          {/* Visual Order Progress Timeline */}
          <div className="p-6 bg-[#FFFBF0] rounded-2xl border border-[#EFE4BF]">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#07552B] font-mono">
                Live Kitchen Status
              </span>
              <span className="text-xs font-mono font-extrabold text-[#58A846] uppercase px-2.5 py-0.5 rounded-full bg-[#E7F6EA] border border-[#BFE3C7]">
                {order.orderStatus.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Stepper Dots & Track */}
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-[#EFE4BF] z-0 rounded-full" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#07552B] z-0 transition-all duration-500 rounded-full"
                style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
              />

              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        isCurrent
                          ? 'bg-[#07552B] text-white ring-4 ring-[#07552B]/20 scale-110'
                          : isPassed
                          ? 'bg-[#58A846] text-white'
                          : 'bg-[#EFE4BF] text-[#8A908A]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-2 whitespace-nowrap text-center ${
                        isPassed ? 'text-[#07552B] font-bold' : 'text-[#8A908A]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fulfilment & Customer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#FFFBF0] rounded-2xl border border-[#EFE4BF]">
              <span className="text-[#8A908A] block mb-1 uppercase tracking-wider text-[10px] font-mono font-bold">
                Fulfilment Method
              </span>
              <div className="flex items-center gap-2 text-[#07552B] font-bold">
                {order.fulfilmentType === 'delivery' ? (
                  <>
                    <Truck className="w-4 h-4 text-[#58A846]" />
                    <span>Abuja Delivery ({order.deliveryZoneName || 'Metro'})</span>
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4 text-[#58A846]" />
                    <span>Lounge Pickup (Wuse 2, Abuja)</span>
                  </>
                )}
              </div>
              {order.deliveryAddress && (
                <p className="text-[#536353] mt-1 text-[11px] leading-relaxed">
                  {order.deliveryAddress}
                </p>
              )}
              {order.scheduledFor && (
                <div className="mt-2.5 p-2 bg-[#FFF6D9] border border-[#EFE4BF] rounded-xl flex items-center gap-2 text-[11px] text-[#07552B] font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#F28C00] shrink-0" />
                  <span>Scheduled: <strong className="font-bold">{order.scheduledFor}</strong></span>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#FFFBF0] rounded-2xl border border-[#EFE4BF]">
              <span className="text-[#8A908A] block mb-1 uppercase tracking-wider text-[10px] font-mono font-bold">
                Payment Status
              </span>
              <div className="flex items-center justify-between text-[#202820] font-bold">
                <span className="uppercase text-xs font-mono">{order.paymentMethod.replace(/_/g, ' ')}</span>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase font-mono ${
                  order.paymentStatus === 'paid'
                    ? 'bg-[#E7F6EA] text-[#07552B] border border-[#BFE3C7]'
                    : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              <p className="text-[#536353] mt-1 text-[11px]">
                Contact: {order.customerName} ({order.customerPhone})
              </p>
            </div>
          </div>

          {/* Itemized Order Summary */}
          <div className="border border-[#EFE4BF] rounded-2xl bg-white overflow-hidden shadow-xs">
            <div className="p-4 bg-[#FFF6D9] border-b border-[#EFE4BF] flex items-center justify-between">
              <span className="text-xs font-bold text-[#07552B]">Itemized Receipt Snapshot</span>
              <span className="text-xs text-[#536353] font-mono">{(order.items || []).length} items</span>
            </div>
            <div className="p-4 divide-y divide-[#F4EAC4] space-y-2.5">
              {(order.items || []).map(item => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#202820]">{item.quantity}x {item.productNameSnapshot}</span>
                    {item.itemNotes && (
                      <p className="text-[11px] text-[#536353] italic">Note: "{item.itemNotes}"</p>
                    )}
                  </div>
                  <span className="font-mono text-[#07552B] font-bold tabular-nums">
                    ₦{item.lineTotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-[#FFFBF0] border-t border-[#EFE4BF] space-y-1.5 text-xs text-[#536353]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-[#202820] font-bold tabular-nums">₦{order.subtotal.toLocaleString()}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-[#202820] font-bold tabular-nums">₦{order.deliveryFee.toLocaleString()}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[#58A846] font-bold">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-₦{order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#07552B] pt-2 border-t border-[#EFE4BF]">
                <span>Total Amount</span>
                <span className="font-mono text-xl tabular-nums">₦{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions: WhatsApp Notification & Close */}
        <div className="p-5 sm:p-6 bg-[#FFFBF0] border-t border-[#EFE4BF] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Click to Chat WhatsApp Action */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-2xl text-xs tracking-wider uppercase transition-colors shadow-md shadow-[#25D366]/25"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send Order Summary to Kitchen WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#FFF6D9] text-[#07552B] text-xs font-bold rounded-2xl transition-colors border border-[#EFE4BF]"
          >
            Keep Browsing
          </button>
        </div>
      </div>
    </div>
  );
};
