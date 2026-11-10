import React, { useState, useEffect } from 'react';
import { X, Search, Clock, ArrowRight, AlertCircle, Truck, Store, ChevronRight, Calendar } from 'lucide-react';
import { fetchOrder } from '../services/api';
import { Order, RecentOrderSummary } from '../types';
import { getRecentOrders, saveRecentOrder, removeRecentOrder, clearRecentOrders } from '../services/recentOrders';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderFound: (order: Order) => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  onOrderFound,
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderSummary[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecentOrders(getRecentOrders());
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTrackByNumber = async (numToTrack: string) => {
    const cleanNum = numToTrack.trim().toUpperCase();
    if (!cleanNum) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const order = await fetchOrder(cleanNum);
      const updatedList = saveRecentOrder(order);
      setRecentOrders(updatedList);

      onOrderFound(order);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'No order found with that order number.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrackByNumber(orderNumber);
  };

  const handleRemoveSingle = (e: React.MouseEvent, num: string) => {
    e.stopPropagation();
    const updated = removeRecentOrder(num);
    setRecentOrders(updated);
  };

  const handleClearAll = () => {
    clearRecentOrders();
    setRecentOrders([]);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} mins ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[#07552B] bg-[#E7F6EA] border-[#BFE3C7]';
      case 'preparing':
        return 'text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]';
      case 'ready_for_pickup':
      case 'out_for_delivery':
        return 'text-[#07552B] bg-[#FFF6D9] border-[#EFE4BF]';
      case 'confirmed':
        return 'text-[#07552B] bg-[#E7F6EA] border-[#BFE3C7]';
      default:
        return 'text-[#536353] bg-[#FFFBF0] border-[#EFE4BF]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white border border-[#EFE4BF] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-[#202820]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#EFE4BF] bg-[#FFF6D9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#07552B]/10 flex items-center justify-center text-[#07552B]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl text-[#07552B]">Track Your Order</h3>
              <p className="text-[11px] text-[#536353]">Live kitchen cooking and dispatch updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#FFFBF0] text-[#202820] flex items-center justify-center transition-colors border border-[#EFE4BF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Lookup Input Form */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#07552B] mb-2 font-mono font-bold">
              Enter Order Reference Number
            </label>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                required
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. DBL-20261109-7712"
                className="flex-1 bg-[#FFFDF2] border border-[#EFE4BF] focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] font-mono uppercase outline-none placeholder-[#8A908A]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-3 bg-[#F28C00] hover:bg-[#D97D00] disabled:bg-[#A0A0A0] text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                <span>{isLoading ? 'Searching...' : 'Track'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* RECENT ORDERS SECTION */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#07552B]" />
                <h4 className="text-xs uppercase font-bold text-[#07552B] tracking-wider font-mono">
                  Recent Orders
                </h4>
                {recentOrders.length > 0 && (
                  <span className="text-[10px] text-[#536353] font-mono">
                    ({recentOrders.length})
                  </span>
                )}
              </div>
              {recentOrders.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-[#8A908A] hover:text-[#B91C1C] transition-colors font-medium"
                >
                  Clear history
                </button>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-6 text-center bg-[#FFFBF0] rounded-2xl border border-[#EFE4BF]">
                <Clock className="w-6 h-6 text-[#8A908A] mx-auto mb-2" />
                <p className="text-xs text-[#536353] font-bold">No recent orders on this device</p>
                <p className="text-[11px] text-[#8A908A] mt-0.5">
                  Orders you place will automatically appear here for 1-click status checking.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(item => (
                  <div
                    key={item.orderNumber}
                    onClick={() => handleTrackByNumber(item.orderNumber)}
                    className="group p-4 bg-[#FFFBF0] hover:bg-white rounded-2xl border border-[#EFE4BF] hover:border-[#07552B]/40 transition-all cursor-pointer flex flex-col gap-2 shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#07552B] group-hover:text-[#F28C00] transition-colors">
                          {item.orderNumber}
                        </span>
                        {item.createdAt && (
                          <span className="text-[10px] text-[#8A908A]">
                            · {formatRelativeTime(item.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusColor(item.orderStatus)}`}>
                          {item.orderStatus.replace(/_/g, ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSingle(e, item.orderNumber)}
                          title="Remove from recent orders list"
                          className="opacity-0 group-hover:opacity-100 text-[#8A908A] hover:text-[#B91C1C] p-0.5 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#536353] line-clamp-1">
                      {item.itemsSummary}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#F4EAC4] text-[11px]">
                      <div className="flex items-center gap-2 text-[#536353]">
                        <span className="flex items-center gap-1 font-semibold">
                          {item.fulfilmentType === 'delivery' ? (
                            <Truck className="w-3 h-3 text-[#58A846]" />
                          ) : (
                            <Store className="w-3 h-3 text-[#58A846]" />
                          )}
                          <span className="capitalize">{item.fulfilmentType}</span>
                        </span>
                        {item.scheduledFor && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-[10px] text-[#07552B] bg-[#FFF6D9] px-2 py-0.5 rounded-md font-mono">
                              <Calendar className="w-2.5 h-2.5 text-[#F28C00]" />
                              <span>{item.scheduledFor}</span>
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span className="font-mono text-[#07552B] font-extrabold tabular-nums">
                          ₦{item.totalAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[#07552B] font-bold group-hover:text-[#F28C00] group-hover:translate-x-0.5 transition-all">
                        <span>View Live Status</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FFFBF0] border-t border-[#EFE4BF] flex items-center justify-between text-[11px] text-[#536353]">
          <span>Tip: Tap any recent order to instantly check preparation progress</span>
          <button
            onClick={onClose}
            className="text-[#07552B] hover:text-[#F28C00] font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
