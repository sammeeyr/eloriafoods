import { Order, RecentOrderSummary } from '../types';

const STORAGE_KEY = 'dbl_recent_orders';

// Initial fallback seeds so returning customers or new users can immediately see how it works
const DEFAULT_INITIAL_RECENT_ORDERS: RecentOrderSummary[] = [
  {
    orderNumber: 'DBL-20261109-7712',
    customerName: 'Chidera Nwosu',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    totalAmount: 17700,
    fulfilmentType: 'delivery',
    itemsSummary: '1x Smokey Firewood Jollof, 1x Peppered Asun',
    orderStatus: 'preparing',
    paymentStatus: 'paid',
  },
  {
    orderNumber: 'DBL-20261109-8420',
    customerName: 'Babatunde Adeleke',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    totalAmount: 14500,
    fulfilmentType: 'pickup',
    itemsSummary: '1x Whole Charcoal-Grilled Croaker Fish',
    orderStatus: 'confirmed',
    paymentStatus: 'pending',
  }
];

export function getRecentOrders(): RecentOrderSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial sample orders on first visit
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_RECENT_ORDERS));
      return DEFAULT_INITIAL_RECENT_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse recent orders from localStorage:', e);
    return DEFAULT_INITIAL_RECENT_ORDERS;
  }
}

export function saveRecentOrder(order: Order): RecentOrderSummary[] {
  try {
    const current = getRecentOrders();
    const itemsSummary = (order.items || [])
      .map(i => `${i.quantity}x ${i.productNameSnapshot}`)
      .join(', ') || 'Dera Buzor Delicacies';

    const newSummary: RecentOrderSummary = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      createdAt: order.createdAt || new Date().toISOString(),
      totalAmount: order.totalAmount,
      fulfilmentType: order.fulfilmentType,
      itemsSummary,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
    };

    // Filter out existing occurrence if any and prepend
    const filtered = current.filter(o => o.orderNumber !== order.orderNumber);
    const updated = [newSummary, ...filtered].slice(0, 8); // Keep up to 8 recent orders

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save recent order to localStorage:', e);
    return [];
  }
}

export function removeRecentOrder(orderNumber: string): RecentOrderSummary[] {
  try {
    const current = getRecentOrders();
    const updated = current.filter(o => o.orderNumber !== orderNumber);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to remove recent order:', e);
    return [];
  }
}

export function clearRecentOrders(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear recent orders:', e);
  }
}
