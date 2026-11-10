import { CheckoutPayload, Order, DailyMenu, DeliveryZone, RestaurantSettings, PromotionalCode, Product, AuthUser, UserRole, Permission, StaffMember } from '../types';
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

// ---------------- Admin & Staff RBAC API ----------------

export function getAuthHeaders(): Record<string, string> {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dbl_admin_token') || '' : '';
  const role = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dbl_admin_role') || '' : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}`, 'x-admin-token': token } : {}),
    ...(role ? { 'x-admin-role': role } : {}),
  };
}

export async function adminLogin(credentials: { email?: string; password?: string; passcode?: string }): Promise<{
  success: boolean;
  token: string;
  user: AuthUser;
}> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Authentication failed');
  return data;
}

export async function adminFetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/api/admin/orders`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch admin orders');
  }
  return res.json();
}

export async function adminCreateOrder(orderData: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfilmentType?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount: number;
  items: any[];
}): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/admin/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create order');
  return data;
}

export async function adminDeleteOrder(orderNumber: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Order deletion failed');
  return data;
}

export async function adminUpdateOrderStatus(
  orderNumber: string,
  newStatus: string,
  notes?: string,
  actorName?: string
): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
    method: 'POST',
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
    body: JSON.stringify({ verifiedBy, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment verification failed');
  return data;
}

export async function adminFetchMenuItems(): Promise<{ success: boolean; items: any[]; menuDate: string }> {
  const res = await fetch(`${API_BASE}/api/admin/menu/items`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch menu items');
  return data;
}

export async function adminCreateDish(dishData: {
  name: string;
  displayPrice: number;
  categoryId?: string;
  mealType?: string;
  description?: string;
  imagePath?: string;
  availableQuantity?: number;
}): Promise<{ success: boolean; item: any }> {
  const res = await fetch(`${API_BASE}/api/admin/menu/items`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dishData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create dish');
  return data;
}

export async function adminUpdateDish(
  id: string,
  dishData: {
    name?: string;
    displayPrice?: number;
    mealType?: string;
    description?: string;
    availableQuantity?: number;
    isAvailable?: boolean;
  }
): Promise<{ success: boolean; item: any }> {
  const res = await fetch(`${API_BASE}/api/admin/menu/items/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dishData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update dish');
  return data;
}

export async function adminDeleteDish(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/admin/menu/items/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete dish');
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
  const res = await fetch(`${API_BASE}/api/admin/reports`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch admin reports');
  return data;
}

export async function adminFetchStaffs(): Promise<StaffMember[]> {
  const res = await fetch(`${API_BASE}/api/admin/staffs`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch staff members');
  return data;
}

export async function adminCreateStaff(payload: {
  fullName: string;
  email?: string;
  phone: string;
  role: UserRole;
  department: string;
  passcode?: string;
}): Promise<{ success: boolean; staff: StaffMember }> {
  const res = await fetch(`${API_BASE}/api/admin/staffs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create staff member');
  return data;
}

export async function adminUpdateStaff(
  id: string,
  payload: Partial<StaffMember>
): Promise<{ success: boolean; staff: StaffMember }> {
  const res = await fetch(`${API_BASE}/api/admin/staffs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update staff member');
  return data;
}

export async function adminToggleStaffStatus(id: string): Promise<{ success: boolean; staff: StaffMember }> {
  const res = await fetch(`${API_BASE}/api/admin/staffs/${encodeURIComponent(id)}/toggle-status`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle staff status');
  return data;
}

export async function adminDeleteStaff(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/admin/staffs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete staff member');
  return data;
}
