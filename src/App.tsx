import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WeeklyTimetable } from './components/WeeklyTimetable';
import { QuickPotSection } from './components/QuickPotSection';
import { DailyMenuSection } from './components/DailyMenuSection';
import { MarketBasketsSection } from './components/MarketBasketsSection';
import { MealPlanSection } from './components/MealPlanSection';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { StorySection } from './components/StorySection';
import { CustomerTestimonials } from './components/CustomerTestimonials';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { PaymentSandboxModal } from './components/PaymentSandboxModal';
import { FloatingCartBar } from './components/FloatingCartBar';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { ChefSpecialToast } from './components/ChefSpecialToast';
import { Product, DailyMenuItem, Order } from './types';
import { saveRecentOrder } from './services/recentOrders';

const checkIsStaffOrAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/admin' ||
    path === '/staff' ||
    path.startsWith('/admin/') ||
    path.startsWith('/staff/') ||
    search.includes('admin') ||
    search.includes('staff') ||
    hash === '#admin' ||
    hash === '#staff'
  );
};

const MainApp: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen } = useCart();

  // Route isolation: 'home' for public storefront, 'admin' for dedicated staff portal
  const [currentRoute, setCurrentRoute] = useState<'home' | 'admin'>(() => {
    return checkIsStaffOrAdmin() ? 'admin' : 'home';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(checkIsStaffOrAdmin() ? 'admin' : 'home');
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleReturnToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute('home');
  };

  // Modals state for public storefront
  const [selectedProduct, setSelectedProduct] = useState<{ product: Product; menuItem?: DailyMenuItem } | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | undefined>(undefined);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);

  // Payment Sandbox simulation
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);
  const [sandboxOrderNumber, setSandboxOrderNumber] = useState<string>('');
  const [sandboxAmount, setSandboxAmount] = useState<number>(0);

  const handleSelectProduct = (product: Product, menuItem?: DailyMenuItem) => {
    setSelectedProduct({ product, menuItem });
  };

  const handleOrderSuccess = (order: Order, authUrl?: string) => {
    setIsCheckoutOpen(false);
    setActiveOrder(order);
    setAuthorizationUrl(authUrl);
    setIsOrderModalOpen(true);
    saveRecentOrder(order);

    if (authUrl && authUrl.includes('sandbox')) {
      setSandboxOrderNumber(order.orderNumber);
      setSandboxAmount(order.totalAmount);
      setIsSandboxOpen(true);
    }
  };

  const handleOrderFound = (order: Order) => {
    setActiveOrder(order);
    setIsOrderModalOpen(true);
    saveRecentOrder(order);
  };

  const handlePaymentVerified = (orderNum: string) => {
    if (activeOrder && activeOrder.orderNumber === orderNum) {
      setActiveOrder({
        ...activeOrder,
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
      });
    }
  };

  const scrollToMeals = () => {
    const el = document.getElementById('today-menu') || document.getElementById('today-meal');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToBaskets = () => {
    const el = document.getElementById('market-baskets');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Dedicated, isolated Staff Operations Portal route
  if (currentRoute === 'admin') {
    return (
      <AdminDashboard
        isStandalonePage={true}
        onReturnToHome={handleReturnToHome}
      />
    );
  }

  // Public Storefront (No admin entry buttons visible to the public)
  return (
    <div className="min-h-screen bg-[#FFF6D9] text-[#202820] flex flex-col font-sans selection:bg-[#F28C00] selection:text-white pb-16 sm:pb-0 animate-page-enter">
      {/* Navigation Top Bar without staff/admin buttons */}
      <Header
        onOpenTrackOrder={() => setIsTrackModalOpen(true)}
      />

      <main className="flex-1">
        {/* 2-Card Hero Showcase */}
        <Hero
          onExploreMenu={scrollToMeals}
          onExploreBaskets={scrollToBaskets}
          onOpenTrackOrder={() => setIsTrackModalOpen(true)}
        />

        {/* Weekly Lunch Timetable Strip (Monday - Friday) */}
        <WeeklyTimetable
          onSelectDish={() => scrollToMeals()}
        />

        {/* Hot Cooked Meals & Native Soups */}
        <DailyMenuSection
          onSelectProduct={handleSelectProduct}
        />

        {/* Quick Pot Extra Meats & Sides */}
        <QuickPotSection />

        {/* Raw Foodstuff Market Restock Baskets */}
        <MarketBasketsSection />

        {/* 5-Day Weekly Lunch Subscription Plan */}
        <MealPlanSection />

        {/* Real Customer Reviews & Social Proof Carousel */}
        <CustomerTestimonials />

        {/* Lounge Experience & Firewood Heritage Story */}
        <StorySection />
      </main>

      {/* Footer without staff/admin button */}
      <Footer
        onOpenTrackOrder={() => setIsTrackModalOpen(true)}
      />

      {/* Persistent Bottom Floating Cart Bar for Mobile */}
      <FloatingCartBar />

      {/* Floating WhatsApp Quick Order Overlay */}
      <WhatsAppFloatingButton />

      {/* Subtle 'Today's Chef Special' Toast Notification (Appears after 3 seconds) */}
      <ChefSpecialToast onOrderSpecial={scrollToMeals} />

      {/* Product Customization Modal */}
      <ProductModal
        product={selectedProduct?.product || null}
        menuItem={selectedProduct?.menuItem}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Slide-out Cart Drawer */}
      <CartDrawer />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Confirmation & Real-Time Tracking Modal */}
      <OrderConfirmationModal
        order={activeOrder}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        authorizationUrl={authorizationUrl}
        onOpenSandbox={(url) => {
          if (activeOrder) {
            setSandboxOrderNumber(activeOrder.orderNumber);
            setSandboxAmount(activeOrder.totalAmount);
            setIsSandboxOpen(true);
          }
        }}
      />

      {/* Order Tracker Search Modal with Recent Orders Section */}
      <OrderTrackerModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        onOrderFound={handleOrderFound}
      />

      {/* Interactive Paystack Gateway Sandbox */}
      <PaymentSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        orderNumber={sandboxOrderNumber}
        amount={sandboxAmount}
        onPaymentVerified={handlePaymentVerified}
      />
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}
