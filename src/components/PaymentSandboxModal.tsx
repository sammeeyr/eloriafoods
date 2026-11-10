import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { verifyPayment } from '../services/api';

interface PaymentSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  amount: number;
  onPaymentVerified: (orderNumber: string) => void;
}

export const PaymentSandboxModal: React.FC<PaymentSandboxModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  amount,
  onPaymentVerified,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'card' | 'bank' | 'ussd'>('card');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSimulateSuccess = async () => {
    try {
      setIsProcessing(true);
      const ref = `PSTK_LIVE_MOCK_${Date.now()}`;
      await verifyPayment(orderNumber, ref);
      setSuccess(true);
      setTimeout(() => {
        onPaymentVerified(orderNumber);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`Payment verification error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white border border-[#EFE4BF] rounded-3xl shadow-2xl overflow-hidden text-[#202820]"
        onClick={e => e.stopPropagation()}
      >
        {/* Paystack / Gateway Header */}
        <div className="bg-[#FFF6D9] p-5 border-b border-[#EFE4BF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#07552B] flex items-center justify-center text-white font-black text-xs">
              P
            </div>
            <div>
              <span className="font-bold text-xs tracking-wider uppercase text-[#07552B] block font-mono">
                Paystack Secure Checkout
              </span>
              <span className="text-[11px] text-[#536353]">
                Dera Buzor Lounge · {orderNumber}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#FDEBA6] text-[#202820] flex items-center justify-center border border-[#EFE4BF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="p-6 text-center border-b border-[#EFE4BF] bg-[#FFFBF0]">
          <span className="text-xs uppercase text-[#8A908A] font-semibold tracking-wider font-mono">
            Total Amount Due
          </span>
          <div className="font-mono text-3xl font-black text-[#07552B] mt-1 tabular-nums">
            ₦{amount.toLocaleString()}
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] text-[#58A846] mt-2 font-mono font-semibold">
            <Lock className="w-3 h-3" />
            <span>256-Bit SSL Encrypted Transaction</span>
          </div>
        </div>

        {/* Payment Channels Tabs */}
        <div className="p-6 space-y-4">
          <div className="flex rounded-2xl bg-[#FFF6D9] p-1 border border-[#EFE4BF]">
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'card' ? 'bg-[#07552B] text-white shadow-xs' : 'text-[#07552B]'
              }`}
            >
              Debit Card
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'bank' ? 'bg-[#07552B] text-white shadow-xs' : 'text-[#07552B]'
              }`}
            >
              Bank Transfer
            </button>
            <button
              onClick={() => setActiveTab('ussd')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'ussd' ? 'bg-[#07552B] text-white shadow-xs' : 'text-[#07552B]'
              }`}
            >
              USSD / *737#
            </button>
          </div>

          {activeTab === 'card' && (
            <div className="space-y-3 bg-[#FFFBF0] p-4 rounded-2xl border border-[#EFE4BF]">
              <div className="flex items-center justify-between text-xs text-[#536353]">
                <span>Test Card Number:</span>
                <span className="font-mono text-[#202820] font-bold">4084 0840 8408 4084</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#536353]">
                <span>Expiry / CVV:</span>
                <span className="font-mono text-[#202820] font-bold">12/28 · 408</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#536353]">
                <span>PIN:</span>
                <span className="font-mono text-[#202820] font-bold">1111</span>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-2 bg-[#FFFBF0] p-4 rounded-2xl border border-[#EFE4BF] text-xs">
              <span className="text-[#536353] block font-medium">Temporary Paystack Virtual Account:</span>
              <p className="font-mono font-bold text-[#07552B] text-base">Wema Bank · 9928172910</p>
              <p className="text-[11px] text-[#58A846] font-semibold">Account expires in 25 minutes</p>
            </div>
          )}

          {activeTab === 'ussd' && (
            <div className="space-y-2 bg-[#FFFBF0] p-4 rounded-2xl border border-[#EFE4BF] text-xs text-center">
              <span className="text-[#536353] block font-medium">Dial on your phone to complete:</span>
              <p className="font-mono font-bold text-[#07552B] text-lg">*737*000*8420#</p>
            </div>
          )}

          {success ? (
            <div className="py-3 flex items-center justify-center gap-2 text-xs font-bold text-[#07552B] bg-[#E7F6EA] rounded-2xl border border-[#BFE3C7]">
              <CheckCircle2 className="w-4 h-4 text-[#58A846]" />
              <span>Payment Successful & Verified!</span>
            </div>
          ) : (
            <button
              onClick={handleSimulateSuccess}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#F28C00] hover:bg-[#D97D00] disabled:bg-[#A0A0A0] text-white font-extrabold rounded-2xl text-xs tracking-wider uppercase transition-colors shadow-md shadow-[#F28C00]/25"
            >
              <span>{isProcessing ? 'Verifying with Paystack...' : `Authorize Pay ₦${amount.toLocaleString()}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <p className="text-[11px] text-[#8A908A] text-center">
            Integration mode: Paystack & Flutterwave sandbox. Real API credentials can be connected in .env
          </p>
        </div>
      </div>
    </div>
  );
};
