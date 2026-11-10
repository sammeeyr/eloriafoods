import { CheckoutPayload, Order, DailyMenu, DeliveryZone, RestaurantSettings, PromotionalCode } from '../types';
import { generateInitialDailyMenu, INITIAL_CATEGORIES, INITIAL_DELIVERY_ZONES, INITIAL_SETTINGS } from '../data/mockData';

const API_BASE = '';

export async function fetchTodayMenu(): Promise<DailyMenu & { categories?: typeof INITIAL_CATEGORIES }> {
  try {
    const res = await fetch(`${API_BASE}/api/menu/today`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Network issue fetching today menu, using initial menu fallback', err);
  }

  const fallback = generateInitialDailyMenu();
  return {
    ...fallback,
    categories: INITIAL_CATEGORIES,
  };
}

export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  try {
    const res = await fetch(`${API_BASE}/api/delivery-zones`);
    if (res.ok) return res.json();
  } catch (err) {
    console.warn('Network issue fetching delivery zones, using fallback', err);
  }
  return INITIAL_DELIVERY_ZONES;
}

export async function fetchSettings(): Promise<RestaurantSettings & { currency: string; timezone: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (res.ok) return res.json();
  } catch (err) {
    console.warn('Network issue fetching restaurant settings, using fallback', err);
  }
  return {
    ...INITIAL_SETTINGS,
    currency: 'NGN',
    timezone: 'Africa/Lagos',
  };
}

export async function validatePromotion(code: string, subtotal: number): Promise<{
  valid: boolean;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/api/promotions/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to validate promo code');
  return data;
}

export async function submitCheckout(payload: CheckoutPayload): Promise<{
  success: boolean;
  orderNumber: string;
  orderId: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  order: Order;
  isDuplicate?: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Checkout submission failed');
  return data;
}

export async function fetchOrder(orderNumber: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Order not found');
  return data;
}

export async function initializePayment(orderNumber: string, email?: string): Promise<{
  provider: string;
  authorizationUrl: string;
  reference: string;
  simulated?: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment initialization failed');
  return data;
}

export async function verifyPayment(orderNumber: string, reference: string): Promise<{
  success: boolean;
  orderNumber: string;
  paymentStatus: string;
  orderStatus: string;
}> {
  const res = await fetch(`${API_BASE}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, reference }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment verification failed');
  return data;
}

// ---------------- Admin API ----------------

export async function adminLogin(credentials: { email?: string; password?: string; passcode?: string }): Promise<{
  success: boolean;
  token: string;
  user: { id: string; fullName: string; email: string; role: string };
}> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Admin login failed');
  return data;
}

export async function adminFetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/api/admin/orders`);
  if (!res.ok) throw new Error('Failed to fetch admin orders');
  return res.json();
}

export async function adminUpdateOrderStatus(
  orderNumber: string,
  newStatus: string,
  notes?: string,
  actorName?: string
): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStatus, notes, actorName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Status update failed');
  return data;
}

export async function adminVerifyOfflinePayment(
  orderNumber: string,
  verifiedBy: string,
  notes?: string
): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/admin/orders/${encodeURIComponent(orderNumber)}/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verifiedBy, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment verification failed');
  return data;
}

export async function adminPublishMenu(menuData: {
  date?: string;
  title?: string;
  description?: string;
  status: 'draft' | 'published';
}): Promise<{ success: boolean; menu: DailyMenu }> {
  const res = await fetch(`${API_BASE}/api/admin/menu/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menuData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Menu publishing failed');
  return data;
}

export async function adminToggleItemAvailability(
  itemId: string,
  isAvailable: boolean,
  availableQuantity?: number
): Promise<{ success: boolean; item: any }> {
  const res = await fetch(`${API_BASE}/api/admin/menu/items/${encodeURIComponent(itemId)}/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAvailable, availableQuantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Item availability update failed');
  return data;
}

export async function adminUpdateSettings(settings: Partial<RestaurantSettings>): Promise<{
  success: boolean;
  settings: RestaurantSettings;
}> {
  const res = await fetch(`${API_BASE}/api/admin/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data;
}

export async function adminFetchReports(): Promise<{
  todayRevenue: number;
  todayOrdersCount: number;
  totalAllTimeOrders: number;
  countsByStatus: {
    pending: number;
    preparing: number;
    readyOrOut: number;
    completed: number;
  };
  topSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
}> {
  const res = await fetch(`${API_BASE}/api/admin/reports`);
  if (!res.ok) throw new Error('Failed to fetch admin reports');
  return res.json();
}
