export type FulfilmentType = 'pickup' | 'delivery';

export type PaymentMethod = 
  | 'paystack' 
  | 'flutterwave' 
  | 'bank_transfer' 
  | 'cash_on_pickup' 
  | 'cash_on_delivery';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready_for_pickup' 
  | 'out_for_delivery' 
  | 'completed' 
  | 'cancelled' 
  | 'rejected';

export type UserRole = 'admin' | 'manager' | 'staff';

export interface Profile {
  id: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface ProductAddon {
  id: string;
  productId: string;
  name: string;
  price: number;
  maxQuantity: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  imagePath: string;
  basePrice: number;
  isActive: boolean;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyMenuItem {
  id: string;
  dailyMenuId: string;
  productId: string;
  displayPrice: number;
  availableQuantity: number;
  isAvailable: boolean;
  displayOrder: number;
  product?: Product;
}

export interface DailyMenu {
  id: string;
  menuDate: string; // YYYY-MM-DD (Africa/Lagos)
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  items: DailyMenuItem[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedMinutes: number;
  isActive: boolean;
  displayOrder: number;
}

export interface RestaurantSettings {
  id: string;
  restaurantName: string;
  tagline: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  email: string;
  isAcceptingOrders: boolean;
  isDeliveryEnabled: boolean;
  isPickupEnabled: boolean;
  openingTime: string;
  closingTime: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
}

export interface PromotionalCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  isActive: boolean;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  selectedVariant?: {
    id: string;
    name: string;
    priceModifier: number;
  };
  selectedAddons?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  notes?: string;
  imagePath: string;
  lineTotal: number;
}

export interface OrderItemSnapshot {
  id: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  selectedVariants: any[];
  selectedAddons: any[];
  itemNotes?: string;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfilmentType: FulfilmentType;
  deliveryAddress?: string;
  deliveryZoneId?: string;
  deliveryZoneName?: string;
  deliveryInstructions?: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerNotes?: string;
  scheduledFor?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItemSnapshot[];
  statusHistory?: OrderStatusHistory[];
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  previousStatus?: string;
  newStatus: OrderStatus;
  actorType: 'customer' | 'admin' | 'system' | 'webhook';
  actorId?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: 'paystack' | 'flutterwave' | 'bank_transfer' | 'cash';
  providerReference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfilmentType: FulfilmentType;
  deliveryAddress?: string;
  deliveryZoneId?: string;
  deliveryInstructions?: string;
  pickupTime?: string;
  scheduledFor?: string;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  promoCode?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    variantName?: string;
    selectedAddons?: Array<{ id: string; name: string; price: number; quantity: number }>;
    quantity: number;
    notes?: string;
  }>;
  idempotencyKey?: string;
}

export interface RecentOrderSummary {
  orderNumber: string;
  customerName?: string;
  createdAt: string;
  scheduledFor?: string;
  totalAmount: number;
  fulfilmentType: FulfilmentType;
  itemsSummary: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}

export interface Testimonial {
  id: string;
  name: string;
  roleOrLocation: string;
  rating: number;
  comment: string;
  favoriteItem: string;
  verified: boolean;
  date: string;
}
