import React from 'react';
import { MapPin, Phone, MessageSquare, Clock, Mail, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenTrackOrder: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenTrackOrder }) => {
  return (
    <footer id="contact" className="bg-[#07552B] text-white border-t border-[#054020]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & Tagline */}
          <div className="md:col-span-1 space-y-4">
            <a href="#" className="inline-block">
              <img
                src="/assets/aistudio/05-reversed-dark-logo_fc6acdcc.svg"
                alt="Dera Buzor Lounge"
                className="h-14 w-auto object-contain"
              />
            </a>
            <p className="text-xs text-[#D6E8CF] leading-relaxed">
              Taste More. Relax Better. Authentic Nigerian culinary excellence, curated daily menus, foodstuff market baskets, and relaxed lounge comfort in Lagos.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-[#FFF6D9] hover:text-[#F28C00] font-semibold transition-colors underline"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#58A846]" />
                <span>Restaurant Staff Management Portal</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#BFE3B8] font-mono">
              Dining & Ordering
            </h4>
            <ul className="space-y-2 text-xs text-[#E2EEDD]">
              <li>
                <a href="#today-menu" className="hover:text-[#F28C00] transition-colors">
                  Today's Chef Menu
                </a>
              </li>
              <li>
                <a href="#timetable" className="hover:text-[#F28C00] transition-colors">
                  Weekly Lunch Timetable
                </a>
              </li>
              <li>
                <a href="#market-baskets" className="hover:text-[#F28C00] transition-colors">
                  Foodstuff Restock Baskets
                </a>
              </li>
              <li>
                <a href="#meal-plan" className="hover:text-[#F28C00] transition-colors">
                  5-Day Lunch Subscription
                </a>
              </li>
              <li>
                <button onClick={onOpenTrackOrder} className="hover:text-[#F28C00] transition-colors text-left">
                  Track Your Order
                </button>
              </li>
            </ul>
          </div>

          {/* Operating Hours (Africa/Lagos) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#BFE3B8] font-mono">
              Kitchen & Lounge Hours
            </h4>
            <div className="space-y-2 text-xs text-[#E2EEDD]">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#F28C00] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-white font-bold">Monday – Sunday</span>
                  <span>11:00 AM – 11:30 PM (WAT)</span>
                </div>
              </div>
              <p className="text-[11px] text-[#BFE3B8] pt-1">
                Kitchen accepts last delivery orders at 10:45 PM daily.
              </p>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#BFE3B8] font-mono">
              Lekki Lounge & Dispatch
            </h4>
            <div className="space-y-2.5 text-xs text-[#E2EEDD]">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#F28C00] shrink-0 mt-0.5" />
                <span>Plot 14B Admiralty Way, Lekki Phase 1, Lagos, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#58A846] shrink-0" />
                <a href="tel:+2348145550192" className="hover:text-white transition-colors">
                  +234 814 555 0192
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <a
                  href="https://wa.me/2348145550192"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#25D366] transition-colors font-medium"
                >
                  WhatsApp Kitchen Line (+234 814 555 0192)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#D6E8CF] shrink-0" />
                <span>orders@derabuzorlounge.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#BFE3B8]">
          <p>© {new Date().getFullYear()} Dera Buzor Lounge & Suites Ltd. Taste More. Relax Better.</p>
          <div className="flex items-center gap-6">
            <span>Powered by Node.js & Supabase</span>
            <span aria-hidden="true">·</span>
            <span>Paystack & Flutterwave Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
