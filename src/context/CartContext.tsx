import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, FulfilmentType, DeliveryZone } from '../types';
import { fetchDeliveryZones, validatePromotion } from '../services/api';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  fulfilmentType: FulfilmentType;
  setFulfilmentType: (type: FulfilmentType) => void;
  selectedZoneId: string;
  setSelectedZoneId: (zoneId: string) => void;
  deliveryZones: DeliveryZone[];
  promoCode: string;
  setPromoCode: (code: string) => void;
  applyPromo: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromo: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dbl_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>('delivery');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('b1');
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchDeliveryZones()
      .then(zones => {
        setDeliveryZones(zones);
        if (zones.length > 0 && !selectedZoneId) {
          setSelectedZoneId(zones[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('dbl_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems(prev => {
      // Check if identical item already exists (same product, same variant, same addons)
      const existingIdx = prev.findIndex(item => {
        if (item.productId !== newItem.productId) return false;
        if (item.selectedVariant?.id !== newItem.selectedVariant?.id) return false;
        const a1 = (item.selectedAddons || []).map(a => `${a.id}:${a.quantity}`).sort().join(',');
        const a2 = (newItem.selectedAddons || []).map(a => `${a.id}:${a.quantity}`).sort().join(',');
        return a1 === a2 && item.notes === newItem.notes;
      });

      if (existingIdx > -1) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + newItem.quantity;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          lineTotal: existing.unitPrice * newQty,
        };
        return updated;
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeItem = (cartItemId: string) => {
    setItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity,
            lineTotal: item.unitPrice * quantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode('');
    setDiscountAmount(0);
    try {
      localStorage.removeItem('dbl_cart');
    } catch {}
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId);
  const deliveryFee = fulfilmentType === 'delivery' && selectedZone ? selectedZone.fee : 0;
  const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

  const applyPromo = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!code.trim()) {
      return { success: false, message: 'Please enter a code' };
    }
    try {
      const res = await validatePromotion(code, subtotal);
      if (res.valid) {
        setPromoCode(res.code);
        setDiscountAmount(res.discountAmount);
        return { success: true, message: `Code ${res.code} applied! Saved ₦${res.discountAmount.toLocaleString()}` };
      }
      return { success: false, message: res.error || 'Invalid promotional code' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to apply promotional code' };
    }
  };

  const removePromo = () => {
    setPromoCode('');
    setDiscountAmount(0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
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
        isCheckoutOpen,
        setIsCheckoutOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
