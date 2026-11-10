import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Quote, 
  ShieldCheck, 
  MessageSquarePlus, 
  X, 
  CheckCircle2, 
  Sparkles,
  MapPin,
  UtensilsCrossed,
  Clock
} from 'lucide-react';
import { Testimonial } from '../types';
import { INITIAL_TESTIMONIALS } from '../data/mockData';

export const CustomerTestimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // New review form state
  const [name, setName] = useState('');
  const [roleOrLocation, setRoleOrLocation] = useState('Wuse 2, Abuja');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [favoriteItem, setFavoriteItem] = useState('Smokey Jollof + Plantain + Chicken');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch reviews from API on mount
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/testimonials');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setTestimonials(data);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch testimonials from server, using local data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Responsive items count per view
  // On desktop we advance by 1 card smoothly
  const totalSlides = testimonials.length;

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  // Auto-play timer
  useEffect(() => {
    if (isPaused || isFormOpen || totalSlides <= 1) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, isFormOpen, totalSlides]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        roleOrLocation: roleOrLocation.trim(),
        rating,
        comment: comment.trim(),
        favoriteItem: favoriteItem.trim(),
      };

      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let addedItem: Testimonial;
      if (res.ok) {
        addedItem = await res.json();
      } else {
        // Fallback optimistic
        addedItem = {
          id: `t-${Date.now()}`,
          ...payload,
          verified: true,
          date: 'Just now',
        };
      }

      setTestimonials(prev => [addedItem, ...prev]);
      setCurrentIndex(0);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsFormOpen(false);
        setName('');
        setComment('');
      }, 1800);
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      id="testimonials" 
      className="py-20 bg-[#07552B] text-[#FFF6D9] relative overflow-hidden selection:bg-[#F28C00] selection:text-white border-t border-[#043d1e]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Decorative Warm Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#58A846]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#F28C00]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#58A846] mb-2 uppercase tracking-widest font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#F28C00]" />
              <span>Real Abuja Diners & Subscribers</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#FFF6D9] tracking-tight">
              COMMUNITY LOVE & PRAISE
            </h2>
            <p className="text-sm text-[#FFF6D9]/80 mt-2 max-w-xl font-normal leading-relaxed">
              From fast corporate lunches in Maitama and Central Business District to doorstep weekend foodstuff restocks across Abuja estates.
            </p>
          </div>

          {/* Social Proof Badges & Add Review Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#054422] border border-[#58A846]/30 px-3.5 py-2 rounded-xl text-xs font-medium text-[#FFF6D9]">
              <div className="flex text-[#F28C00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#F28C00]" />
                ))}
              </div>
              <span className="font-bold text-white font-mono">4.9 / 5.0</span>
              <span className="text-[#FFF6D9]/70 text-[11px]">(380+ reviews)</span>
            </div>

            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 bg-[#F28C00] hover:bg-[#D97D00] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Share Your Experience</span>
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Main Slide Grid */}
          <div className="overflow-hidden py-2">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((t, idx) => (
                <div 
                  key={t.id || idx}
                  className="w-full shrink-0 px-2 sm:px-3"
                >
                  <div className="bg-[#0A6635] border border-[#58A846]/25 rounded-2xl p-6 sm:p-8 shadow-xl relative flex flex-col justify-between h-full min-h-[290px] hover:border-[#F28C00]/40 transition-colors">
                    {/* Top Row: Stars + Quote Mark + Date */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 text-[#F28C00]">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < t.rating ? 'fill-[#F28C00] text-[#F28C00]' : 'text-[#FFF6D9]/20'}`} 
                            />
                          ))}
                          <span className="ml-2 text-xs font-bold font-mono text-[#FFF6D9]/90">
                            {t.rating}.0
                          </span>
                        </div>
                        <Quote className="w-7 h-7 text-[#58A846]/30 shrink-0" />
                      </div>

                      {/* Review Comment Text */}
                      <p className="text-sm sm:text-base text-[#FFF6D9] leading-relaxed mb-6 font-normal">
                        "{t.comment}"
                      </p>
                    </div>

                    {/* Bottom Metadata & Customer Signature */}
                    <div className="pt-4 border-t border-[#58A846]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        {/* Avatar initials */}
                        <div className="w-10 h-10 rounded-full bg-[#FFF6D9] text-[#07552B] font-extrabold flex items-center justify-center text-sm shadow-xs border border-white/30 shrink-0">
                          {t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                            <span>{t.name}</span>
                            {t.verified && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#58A846] font-semibold bg-[#054422] px-1.5 py-0.5 rounded-md border border-[#58A846]/30">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Verified Diner
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[#FFF6D9]/70 text-[11px] mt-0.5">
                            <MapPin className="w-3 h-3 text-[#F28C00]" />
                            <span>{t.roleOrLocation}</span>
                            <span className="mx-1">·</span>
                            <span>{t.date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Favorite item tag */}
                      {t.favoriteItem && (
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-[#FFF6D9] bg-[#054422]/80 border border-[#58A846]/30 px-3 py-1.5 rounded-lg font-mono">
                          <UtensilsCrossed className="w-3 h-3 text-[#F28C00]" />
                          <span className="text-[#FFF6D9]/70">Favorite:</span>
                          <span className="font-semibold text-white truncate max-w-[200px]">{t.favoriteItem}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Navigation Arrows */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#FFF6D9]/80">
                {String(currentIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
              </span>
              <div className="hidden sm:flex items-center gap-1 ml-3">
                {testimonials.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setCurrentIndex(dotIdx)}
                    className={`h-1.5 rounded-full transition-all ${
                      dotIdx === currentIndex ? 'w-6 bg-[#F28C00]' : 'w-2 bg-[#58A846]/40 hover:bg-[#58A846]'
                    }`}
                    aria-label={`Go to review slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-full bg-[#054422] hover:bg-[#043319] text-[#FFF6D9] border border-[#58A846]/30 flex items-center justify-center transition-all active:scale-90"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-full bg-[#F28C00] hover:bg-[#D97D00] text-white flex items-center justify-center transition-all shadow-md active:scale-90"
                aria-label="Next review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Highlights Row Below Testimonials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-10 border-t border-[#58A846]/20 text-xs">
          <div className="flex items-center gap-3 bg-[#054422]/60 p-4 rounded-xl border border-[#58A846]/20">
            <div className="w-9 h-9 rounded-lg bg-[#58A846]/20 flex items-center justify-center text-[#58A846] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">100% Firewood & Fresh Guarantee</p>
              <p className="text-[11px] text-[#FFF6D9]/70">No stale pre-cooks; fresh spices daily</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#054422]/60 p-4 rounded-xl border border-[#58A846]/20">
            <div className="w-9 h-9 rounded-lg bg-[#F28C00]/20 flex items-center justify-center text-[#F28C00] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Rapid Abuja Dispatch</p>
              <p className="text-[11px] text-[#FFF6D9]/70">25–45 mins to Maitama, Wuse 2, Garki & CBD</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#054422]/60 p-4 rounded-xl border border-[#58A846]/20">
            <div className="w-9 h-9 rounded-lg bg-[#58A846]/20 flex items-center justify-center text-[#58A846] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Spill-Proof Heat Insulated Pack</p>
              <p className="text-[11px] text-[#FFF6D9]/70">Arrives piping hot and ready to enjoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Submission Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFF6D9] text-[#202820] w-full max-w-lg rounded-2xl shadow-2xl border border-[#07552B]/20 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#07552B] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-lg text-[#FFF6D9]">Write a Review</h3>
                <p className="text-xs text-[#FFF6D9]/80 mt-0.5">Share your experience dining or ordering in Abuja</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                aria-label="Close review modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            {submitSuccess ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#58A846]/10 text-[#58A846] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-lg text-[#07552B]">Thank You for Your Review!</h4>
                <p className="text-xs text-[#536353] mt-1">
                  Your feedback has been published to the Dera Buzor Lounge community reviews.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#07552B] mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Barrister Tolu Adebayo"
                    className="w-full bg-white border border-[#07552B]/20 focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#07552B] mb-1">Abuja District / Location *</label>
                    <select
                      value={roleOrLocation}
                      onChange={e => setRoleOrLocation(e.target.value)}
                      className="w-full bg-white border border-[#07552B]/20 focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] outline-none font-medium"
                    >
                      <option value="Wuse 2, Abuja">Wuse 2, Abuja</option>
                      <option value="Maitama, Abuja">Maitama, Abuja</option>
                      <option value="Garki / CBD, Abuja">Garki / CBD, Abuja</option>
                      <option value="Asokoro, Abuja">Asokoro, Abuja</option>
                      <option value="Jabi / Utako, Abuja">Jabi / Utako, Abuja</option>
                      <option value="Gwarinpa Estate, Abuja">Gwarinpa Estate, Abuja</option>
                      <option value="Life Camp, Abuja">Life Camp, Abuja</option>
                      <option value="Apo / Lokogoma, Abuja">Apo / Lokogoma, Abuja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#07552B] mb-1">Star Rating</label>
                    <div className="flex items-center gap-1.5 pt-2">
                      {[1, 2, 3, 4, 5].map(starVal => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(starVal)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              starVal <= rating
                                ? 'fill-[#F28C00] text-[#F28C00]'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="font-mono font-bold text-[#07552B] ml-2 text-xs">
                        {rating} Star{rating > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#07552B] mb-1">Favorite Dish or Foodstuff Basket</label>
                  <input
                    type="text"
                    value={favoriteItem}
                    onChange={e => setFavoriteItem(e.target.value)}
                    placeholder="e.g. Smokey Jollof or Egusi Soup or Restock Basket"
                    className="w-full bg-white border border-[#07552B]/20 focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#07552B] mb-1">Your Review / Dining Feedback *</label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Describe the meal quality, firewood flavor, delivery promptness, or packaging..."
                    className="w-full bg-white border border-[#07552B]/20 focus:border-[#07552B] rounded-xl p-3 text-xs text-[#202820] outline-none font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#07552B]/20 hover:bg-[#07552B]/10 font-bold text-[#07552B] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#F28C00] hover:bg-[#D97D00] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Post Verified Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
