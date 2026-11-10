import React, { useState } from 'react';
import { MessageCircle, Phone, X, Send } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const WhatsAppFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { totalItemsCount } = useCart();
  const whatsappNumber = '2348145550192';

  const defaultMessage = encodeURIComponent(
    'Hello Dera Buzor Lounge! I would like to place an order / inquire about your Abuja menu and delivery.'
  );

  const quickMessages = [
    {
      label: '🍲 Order Today’s Special',
      text: 'Hello Dera Buzor Lounge, I want to order today’s hot cooked special for delivery in Abuja.',
    },
    {
      label: '🧺 Market Foodstuff Restock',
      text: 'Hi, I would like to order a Market Restock Foodstuff Basket to my Abuja address.',
    },
    {
      label: '📦 Track My Existing Order',
      text: 'Hello, please help me check the status of my order with Dera Buzor Lounge Abuja.',
    },
  ];

  return (
    <div
      className={`fixed z-40 right-4 sm:right-6 transition-all duration-300 ${
        totalItemsCount > 0 ? 'bottom-22 sm:bottom-6' : 'bottom-6 sm:bottom-6'
      }`}
    >
      {/* Popover Card */}
      {isOpen && (
        <div className="mb-3 w-[310px] sm:w-[340px] bg-white rounded-2xl shadow-2xl border border-[#07552B]/15 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Card Header */}
          <div className="bg-[#07552B] p-4 text-white relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3.5 right-3.5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close WhatsApp chat popup"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md">
                  <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#58A846] border-2 border-[#07552B] rounded-full" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white leading-tight">Dera Buzor Lounge</h4>
                <p className="text-[11px] text-[#FFF6D9]/80 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#58A846] animate-pulse" />
                  Wuse 2, Abuja · Online now
                </p>
              </div>
            </div>
            <p className="text-xs text-[#FFF6D9]/90 mt-2.5 leading-relaxed bg-white/10 p-2 rounded-lg">
              Welcome! We deliver freshly prepared meals & foodstuff across Abuja. How can we serve you today?
            </p>
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-[#FDFBF7] space-y-2 border-b border-[#07552B]/10">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#536353] block px-1">
              Quick Inquiries
            </span>
            {quickMessages.map((msg, idx) => (
              <a
                key={idx}
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg.text)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left text-xs bg-white hover:bg-[#FFF6D9] text-[#202820] hover:text-[#07552B] font-medium p-2.5 rounded-xl border border-gray-200 hover:border-[#07552B]/30 transition-all flex items-center justify-between group shadow-xs"
              >
                <span>{msg.label}</span>
                <Send className="w-3.5 h-3.5 text-[#58A846] group-hover:translate-x-0.5 transition-transform" />
              </a>
            ))}
          </div>

          {/* Direct CTA */}
          <div className="p-3 bg-white flex items-center gap-2">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${defaultMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Start WhatsApp Chat</span>
            </a>
            <a
              href="tel:+2348145550192"
              className="p-2.5 bg-[#FFF6D9] hover:bg-[#ffeec0] text-[#07552B] rounded-xl border border-[#07552B]/20 transition-colors"
              title="Call Lounge Directly"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <div className="flex items-center gap-2">
        {/* Subtle pill badge visible on desktop/tablets when popover is closed */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="hidden md:flex items-center gap-2 bg-white text-[#07552B] text-xs font-bold py-2 px-3.5 rounded-full shadow-lg border border-[#07552B]/15 hover:border-[#25D366] hover:bg-[#FFF6D9] transition-all group"
          >
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
            <span>Chat on WhatsApp</span>
          </button>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
          aria-label="Open WhatsApp support chat"
        >
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <>
              {/* WhatsApp Icon */}
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="currentColor"
                className="text-white"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>

              {/* Green online ping indicator */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58A846] opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#58A846] border-2 border-white" />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
