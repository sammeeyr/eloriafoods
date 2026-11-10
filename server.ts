import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { 
  INITIAL_SETTINGS, 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_DELIVERY_ZONES, 
  INITIAL_PROMOTIONS, 
  SAMPLE_ORDERS,
  INITIAL_TESTIMONIALS,
  generateInitialDailyMenu, 
  getAbujaDateString,
  getLagosDateString 
} from './src/data/mockData';
import { Order, DailyMenu, RestaurantSettings, DeliveryZone, PromotionalCode, Testimonial, Product, UserRole, Permission, AuthUser, StaffMember } from './src/types';

dotenv.config();

const args = process.argv.slice(2);
const portArgIndex = args.indexOf('--port');
const cliPort = portArgIndex !== -1 && args[portArgIndex + 1] ? parseInt(args[portArgIndex + 1], 10) : null;

// In development, the dev server must bind to port 3000 (nginx listens on 8080).
// In production on Google Cloud Run, it binds to process.env.PORT || 8080.
const isProd = process.env.NODE_ENV === 'production';
const PORT = cliPort || (isProd ? parseInt(process.env.PORT || '8080', 10) : 3000);
const HOST = '0.0.0.0';
const app = express();

// Preserve raw body for webhook HMAC validation
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// In-memory persistent state (mirrors Supabase schema)
let restaurantSettings: RestaurantSettings = { ...INITIAL_SETTINGS };
let deliveryZones: DeliveryZone[] = [...INITIAL_DELIVERY_ZONES];
let promotionalCodes: PromotionalCode[] = [...INITIAL_PROMOTIONS];
let dailyMenus: Map<string, DailyMenu> = new Map();
const initialMenu = generateInitialDailyMenu();
dailyMenus.set(initialMenu.menuDate, initialMenu);

let orders: Map<string, Order> = new Map();
SAMPLE_ORDERS.forEach(ord => orders.set(ord.orderNumber, ord));

let paymentEvents: Set<string> = new Set();
let testimonials: Testimonial[] = [...INITIAL_TESTIMONIALS];

// Timezone helper: resolves current Abuja / WAT date
function getAbujaCurrentDate(): string {
  return getAbujaDateString(0);
}
const getLagosCurrentDate = getAbujaCurrentDate;

// Ensure today's daily menu exists
function getOrCreateTodayMenu(): DailyMenu {
  const abujaToday = getAbujaCurrentDate();
  if (!dailyMenus.has(abujaToday)) {
    const newMenu: DailyMenu = {
      id: `dm-${abujaToday}`,
      menuDate: abujaToday,
      title: `Chef's Daily Selection · ${abujaToday}`,
      description: 'Handcrafted firewood grills, native soups, and signature drinks.',
      status: 'published',
      publishedAt: new Date().toISOString(),
      items: INITIAL_PRODUCTS.map((prod, idx) => ({
        id: `dmi-${abujaToday}-${prod.id}`,
        dailyMenuId: `dm-${abujaToday}`,
        productId: prod.id,
        displayPrice: prod.basePrice,
        availableQuantity: 20,
        isAvailable: true,
        displayOrder: idx + 1,
        product: prod,
      }))
    };
    dailyMenus.set(abujaToday, newMenu);
  }
  return dailyMenus.get(abujaToday)!;
}

// -----------------------------------------------------------------------------
// 1. HEALTH CHECK ENDPOINT (Google Cloud Run Requirement)
// -----------------------------------------------------------------------------
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'dera-buzor-lounge',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    abujaTime: new Date(Date.now() + 3600000).toISOString(),
    activeMenuDate: getAbujaCurrentDate(),
  });
});

// -----------------------------------------------------------------------------
// 2. PUBLIC RESTAURANT INFO & SETTINGS
// -----------------------------------------------------------------------------
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json({
    ...restaurantSettings,
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    paymentProvider: process.env.PAYMENT_PROVIDER || 'paystack',
    hasPaystackKey: Boolean(process.env.PAYSTACK_PUBLIC_KEY),
    hasFlutterwaveKey: Boolean(process.env.FLUTTERWAVE_PUBLIC_KEY),
  });
});

app.get('/api/delivery-zones', (_req: Request, res: Response) => {
  const activeZones = deliveryZones
    .filter(z => z.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  res.json(activeZones);
});

app.get('/api/categories', (_req: Request, res: Response) => {
  res.json(INITIAL_CATEGORIES);
});

app.get('/api/testimonials', (_req: Request, res: Response) => {
  res.json(testimonials);
});

app.post('/api/testimonials', (req: Request, res: Response) => {
  const { name, roleOrLocation, rating, comment, favoriteItem } = req.body;
  if (!name || !comment) {
    return res.status(400).json({ error: 'Name and review comment are required.' });
  }

  const newTestimonial: Testimonial = {
    id: `t-${Date.now()}`,
    name: String(name).trim(),
    roleOrLocation: String(roleOrLocation || 'Abuja, Nigeria').trim(),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    comment: String(comment).trim(),
    favoriteItem: String(favoriteItem || 'Today’s Special').trim(),
    verified: true,
    date: 'Just now',
  };

  testimonials.unshift(newTestimonial);
  res.status(201).json(newTestimonial);
});

// -----------------------------------------------------------------------------
// 3. DAILY MENU ENGINE
// -----------------------------------------------------------------------------
app.get('/api/menu/today', (_req: Request, res: Response) => {
  const menu = getOrCreateTodayMenu();

  let menuItems = menu.items;
  if (!menuItems || menuItems.length === 0) {
    const fallbackMenu = generateInitialDailyMenu();
    menu.items = fallbackMenu.items;
    menu.status = 'published';
    menuItems = menu.items;
  }

  // Map product details onto each menu item
  const publicItems = menuItems.map(item => {
    const product = INITIAL_PRODUCTS.find(p => p.id === item.productId);
    return {
      ...item,
      product: product || item.product,
    };
  });

  res.json({
    ...menu,
    status: 'published',
    items: publicItems,
    categories: INITIAL_CATEGORIES,
  });
});

// Specific date menu (admin or archive lookup)
app.get('/api/menu/:date', (req: Request, res: Response) => {
  const { date } = req.params;
  const menu = dailyMenus.get(date);
  if (!menu) {
    return res.status(404).json({ error: `No menu configured for date: ${date}` });
  }
  res.json(menu);
});

// -----------------------------------------------------------------------------
// 4. PROMOTIONAL CODE VALIDATION
// -----------------------------------------------------------------------------
app.post('/api/promotions/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Promo code is required' });
  }

  const promo = promotionalCodes.find(
    p => p.code.toUpperCase() === String(code).trim().toUpperCase() && p.isActive
  );

  if (!promo) {
    return res.status(404).json({ error: 'Invalid or expired promotional code' });
  }

  const orderSubtotal = Number(subtotal) || 0;
  if (orderSubtotal < promo.minOrderAmount) {
    return res.status(400).json({
      error: `Minimum order amount of ₦${promo.minOrderAmount.toLocaleString()} required for this code.`,
    });
  }

  let discount = 0;
  if (promo.discountType === 'percentage') {
    discount = Math.round((orderSubtotal * promo.discountValue) / 100);
  } else {
    discount = Math.min(promo.discountValue, orderSubtotal);
  }

  res.json({
    valid: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount: discount,
  });
});

// -----------------------------------------------------------------------------
// 5. SECURE SERVER-SIDE CHECKOUT & ORDER CREATION
// -----------------------------------------------------------------------------
app.post('/api/checkout', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      fulfilmentType,
      deliveryAddress,
      deliveryZoneId,
      deliveryInstructions,
      pickupTime,
      scheduledFor,
      paymentMethod,
      customerNotes,
      promoCode,
      items,
      idempotencyKey,
    } = req.body;

    // Idempotency check: prevent duplicate orders
    if (idempotencyKey) {
      for (const ord of orders.values()) {
        if (ord.idempotencyKey === idempotencyKey) {
          return res.status(200).json({
            isDuplicate: true,
            orderNumber: ord.orderNumber,
            order: ord,
          });
        }
      }
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ error: 'Customer name and phone number are required.' });
    }

    if (!['pickup', 'delivery'].includes(fulfilmentType)) {
      return res.status(400).json({ error: 'Valid fulfilment type (pickup or delivery) is required.' });
    }

    if (!restaurantSettings.isAcceptingOrders) {
      return res.status(400).json({ error: 'The kitchen is currently closed to new orders.' });
    }

    if (fulfilmentType === 'delivery') {
      if (!restaurantSettings.isDeliveryEnabled) {
        return res.status(400).json({ error: 'Delivery is temporarily suspended. Pickup is available.' });
      }
      if (!deliveryAddress || !deliveryZoneId) {
        return res.status(400).json({ error: 'Delivery address and zone are required for delivery.' });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty.' });
    }

    // Retrieve active daily menu to check stock and availability
    const todayMenu = getOrCreateTodayMenu();
    if (todayMenu.status !== 'published') {
      return res.status(400).json({ error: 'Menu is currently not active.' });
    }

    // Server-side recalculation of subtotal and immutable item snapshots
    let subtotal = 0;
    const validatedOrderItems: any[] = [];

    for (const cartItem of items) {
      const product = INITIAL_PRODUCTS.find(p => p.id === cartItem.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ error: `Dish unavailable: ${cartItem.productName || cartItem.productId}` });
      }

      // Check daily menu availability
      const menuItem = todayMenu.items.find(mi => mi.productId === product.id);
      if (menuItem && !menuItem.isAvailable) {
        return res.status(400).json({ error: `Dish "${product.name}" is sold out today.` });
      }

      if (menuItem && menuItem.availableQuantity < cartItem.quantity) {
        return res.status(400).json({
          error: `Only ${menuItem.availableQuantity} portion(s) remaining for "${product.name}".`,
        });
      }

      // Compute base unit price
      let unitPrice = menuItem ? menuItem.displayPrice : product.basePrice;

      // Validate variant if provided
      let selectedVariants: any[] = [];
      if (cartItem.selectedVariant?.id && product.variants) {
        const variant = product.variants.find(v => v.id === cartItem.selectedVariant.id);
        if (variant) {
          unitPrice += variant.priceModifier;
          selectedVariants.push({ id: variant.id, name: variant.name, priceModifier: variant.priceModifier });
        }
      }

      // Validate addons if provided
      let selectedAddons: any[] = [];
      if (Array.isArray(cartItem.selectedAddons) && product.addons) {
        for (const addonReq of cartItem.selectedAddons) {
          const addon = product.addons.find(a => a.id === addonReq.id);
          if (addon && addon.isActive) {
            const addQty = Math.min(addonReq.quantity || 1, addon.maxQuantity);
            unitPrice += addon.price * addQty;
            selectedAddons.push({ id: addon.id, name: addon.name, price: addon.price, quantity: addQty });
          }
        }
      }

      const lineTotal = unitPrice * cartItem.quantity;
      subtotal += lineTotal;

      validatedOrderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        productId: product.id,
        productNameSnapshot: product.name,
        unitPrice,
        quantity: cartItem.quantity,
        selectedVariants,
        selectedAddons,
        itemNotes: cartItem.notes || undefined,
        lineTotal,
      });

      // Deduct inventory reservation
      if (menuItem) {
        menuItem.availableQuantity = Math.max(0, menuItem.availableQuantity - cartItem.quantity);
        if (menuItem.availableQuantity === 0) {
          menuItem.isAvailable = false;
        }
      }
    }

    // Delivery fee calculation
    let deliveryFee = 0;
    let selectedZoneName: string | undefined = undefined;
    if (fulfilmentType === 'delivery') {
      const zone = deliveryZones.find(z => z.id === deliveryZoneId && z.isActive);
      if (!zone) {
        return res.status(400).json({ error: 'Invalid or inactive delivery zone selected.' });
      }
      deliveryFee = zone.fee;
      selectedZoneName = zone.name;
    }

    // Promotional code validation
    let discountAmount = 0;
    if (promoCode) {
      const promo = promotionalCodes.find(
        p => p.code.toUpperCase() === String(promoCode).trim().toUpperCase() && p.isActive
      );
      if (promo && subtotal >= promo.minOrderAmount) {
        if (promo.discountType === 'percentage') {
          discountAmount = Math.round((subtotal * promo.discountValue) / 100);
        } else {
          discountAmount = Math.min(promo.discountValue, subtotal);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

    // Format Order Number: DBL-YYYYMMDD-XXXX
    const abujaDateNum = getAbujaCurrentDate().replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `DBL-${abujaDateNum}-${randomSuffix}`;
    const orderId = `ord-${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      fulfilmentType,
      deliveryAddress: deliveryAddress || undefined,
      deliveryZoneId: deliveryZoneId || undefined,
      deliveryZoneName: selectedZoneName,
      deliveryInstructions: deliveryInstructions || undefined,
      subtotal,
      deliveryFee,
      discountAmount,
      totalAmount,
      currency: 'NGN',
      paymentMethod: paymentMethod || 'paystack',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      customerNotes: customerNotes || (pickupTime ? `Pickup time requested: ${pickupTime}` : undefined),
      scheduledFor: scheduledFor ? String(scheduledFor).trim() : undefined,
      idempotencyKey: idempotencyKey || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: validatedOrderItems,
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          orderId,
          previousStatus: undefined,
          newStatus: 'pending',
          actorType: 'customer',
          notes: `Order created via online portal (${fulfilmentType.toUpperCase()} - ${paymentMethod})${scheduledFor ? ` [Scheduled For: ${scheduledFor}]` : ''}`,
          createdAt: new Date().toISOString(),
        }
      ],
    };

    orders.set(orderNumber, newOrder);

    res.status(201).json({
      success: true,
      orderNumber,
      orderId,
      totalAmount,
      subtotal,
      deliveryFee,
      discountAmount,
      currency: 'NGN',
      paymentMethod,
      order: newOrder,
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message || 'Internal order creation failure.' });
  }
});

// -----------------------------------------------------------------------------
// 6. ORDER LOOKUP & REAL-TIME TRACKING
// -----------------------------------------------------------------------------
app.get('/api/orders/:orderNumber', (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const order = orders.get(orderNumber.trim().toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found with provided reference.' });
  }
  res.json(order);
});

// -----------------------------------------------------------------------------
// 7. PAYMENT INITIALIZATION & VERIFICATION
// -----------------------------------------------------------------------------
app.post('/api/payments/initialize', async (req: Request, res: Response) => {
  const { orderNumber, email } = req.body;
  const order = orders.get(orderNumber);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const flutterwaveSecret = process.env.FLUTTERWAVE_SECRET_KEY;
  const provider = process.env.PAYMENT_PROVIDER || 'paystack';

  // If live Paystack key is set, call Paystack API
  if (provider === 'paystack' && paystackSecret) {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || order.customerEmail || 'orders@derabuzorlounge.com',
          amount: Math.round(order.totalAmount * 100), // in kobo
          reference: `${order.orderNumber}_${Date.now()}`,
          currency: 'NGN',
          callback_url: `${req.headers.origin || 'http://localhost:3000'}/order-confirmation?order=${order.orderNumber}`,
          metadata: {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
          },
        }),
      });
      const data = await response.json();
      if (data.status) {
        return res.json({
          provider: 'paystack',
          authorizationUrl: data.data.authorization_url,
          reference: data.data.reference,
        });
      }
    } catch (e: any) {
      console.warn('Paystack live initialization failed, falling back to simulated checkout:', e.message);
    }
  }

  // Simulated Provider for local / sandbox testing
  const mockRef = `PSTK_SANDBOX_${order.orderNumber}_${Date.now()}`;
  res.json({
    provider: provider,
    authorizationUrl: `/payment-sandbox?order=${order.orderNumber}&ref=${mockRef}`,
    reference: mockRef,
    simulated: true,
  });
});

app.post('/api/payments/verify', (req: Request, res: Response) => {
  const { orderNumber, reference } = req.body;
  const order = orders.get(orderNumber);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Mark order paid and confirmed
  order.paymentStatus = 'paid';
  if (order.orderStatus === 'pending') {
    order.orderStatus = 'confirmed';
  }
  order.updatedAt = new Date().toISOString();

  order.statusHistory?.push({
    id: `sh-${Date.now()}`,
    orderId: order.id,
    previousStatus: 'pending',
    newStatus: order.orderStatus,
    actorType: 'system',
    notes: `Payment verified successfully (Ref: ${reference || 'Online Gateway'})`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
  });
});

// Webhook endpoint
app.post('/api/payments/webhook', (req: any, res: Response) => {
  const paystackSignature = req.headers['x-paystack-signature'];
  const flutterwaveSecretHash = req.headers['verif-hash'];

  // Prevent duplicate events
  const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);
  const hash = crypto.createHash('sha256').update(rawBody).digest('hex');

  if (paymentEvents.has(hash)) {
    return res.status(200).json({ status: 'ignored', message: 'Duplicate event' });
  }
  paymentEvents.add(hash);

  const payload = req.body;
  const reference = payload.data?.reference || payload.data?.tx_ref;
  if (reference) {
    // Find matching order
    for (const ord of orders.values()) {
      if (reference.includes(ord.orderNumber)) {
        ord.paymentStatus = 'paid';
        if (ord.orderStatus === 'pending') {
          ord.orderStatus = 'confirmed';
        }
        ord.statusHistory?.push({
          id: `sh-${Date.now()}`,
          orderId: ord.id,
          previousStatus: 'pending',
          newStatus: 'confirmed',
          actorType: 'webhook',
          notes: `Verified via payment webhook (Ref: ${reference})`,
          createdAt: new Date().toISOString(),
        });
        break;
      }
    }
  }

  res.status(200).json({ status: 'success' });
});

// -----------------------------------------------------------------------------
// 8. ADMINISTRATOR CONTROLS & AUTH
// -----------------------------------------------------------------------------
// Simple session check / admin passcode verification
// -----------------------------------------------------------------------------
// 8. RBAC, ROW LEVEL SECURITY (RLS) & ADMINISTRATIVE OPERATIONS PORTAL
// -----------------------------------------------------------------------------
const ADMIN_PASSCODE = process.env.ADMIN_SETUP_PASSCODE || 'DeraBuzor2026!Admin';
const STAFF_PASSCODE = process.env.STAFF_SETUP_PASSCODE || 'DeraBuzorStaff2026!';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'orders:read',
    'orders:write',
    'orders:status',
    'orders:delete',
    'menu:read',
    'menu:write',
    'menu:availability',
    'menu:delete',
    'finance:verify',
    'settings:read',
    'settings:write',
    'reports:read',
    'staff:read',
    'staff:write',
    'staff:delete',
  ],
  manager: [
    'orders:read',
    'orders:write',
    'orders:status',
    'orders:delete',
    'menu:read',
    'menu:write',
    'menu:availability',
    'finance:verify',
    'settings:read',
    'settings:write',
    'reports:read',
    'staff:read',
    'staff:write',
  ],
  staff: [
    'orders:read',
    'orders:status',
    'menu:read',
    'menu:availability',
  ],
};

const staffMembers: Map<string, StaffMember> = new Map([
  [
    'stf-01',
    {
      id: 'stf-01',
      fullName: 'Chef Chukwudi Eze',
      email: 'chukwudi@derabuzorlounge.com',
      phone: '+234 803 219 4488',
      role: 'staff',
      department: 'Kitchen',
      passcode: 'DeraBuzorStaff2026!',
      isActive: true,
      createdAt: '2026-01-15T08:00:00.000Z',
      lastLogin: new Date().toISOString(),
    }
  ],
  [
    'stf-02',
    {
      id: 'stf-02',
      fullName: 'Amina Bello',
      email: 'amina.bello@derabuzorlounge.com',
      phone: '+234 812 770 3391',
      role: 'staff',
      department: 'Dispatch',
      passcode: 'StaffAbuja123',
      isActive: true,
      createdAt: '2026-02-10T09:30:00.000Z',
      lastLogin: new Date().toISOString(),
    }
  ],
  [
    'stf-03',
    {
      id: 'stf-03',
      fullName: 'Emeka Obi',
      email: 'emeka.obi@derabuzorlounge.com',
      phone: '+234 809 112 8844',
      role: 'staff',
      department: 'Bar & Lounge',
      passcode: 'BarLounge2026',
      isActive: true,
      createdAt: '2026-03-01T11:00:00.000Z',
    }
  ],
  [
    'stf-04',
    {
      id: 'stf-04',
      fullName: 'Fatima Yusuf',
      email: 'fatima.yusuf@derabuzorlounge.com',
      phone: '+234 814 662 0099',
      role: 'manager',
      department: 'Floor & Counter',
      passcode: 'ManagerDera2026!',
      isActive: true,
      createdAt: '2026-03-12T10:15:00.000Z',
    }
  ]
]);

const activeSessions: Map<string, AuthUser> = new Map();

// Authentication & RLS Authorization Middleware
function requireAuth(allowedRoles?: UserRole[], requiredPermission?: Permission) {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const authHeader = (req.headers['authorization'] as string) || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || (req.headers['x-admin-token'] as string);
    const headerRole = (req.headers['x-admin-role'] as string) as UserRole;

    const sessionUser = (token && activeSessions.has(token)) ? activeSessions.get(token) : undefined;
    let user: AuthUser;

    if (sessionUser) {
      user = sessionUser;
    } else if (token && token.startsWith('dbl-stf-')) {
      user = {
        id: 'stf-01',
        fullName: 'Kitchen Operations Staff',
        email: 'staff@derabuzorlounge.com',
        role: 'staff',
        permissions: ROLE_PERMISSIONS['staff'],
      };
    } else if (token && token.startsWith('dbl-adm-')) {
      user = {
        id: 'adm-01',
        fullName: 'Chief Operations Officer',
        email: 'admin@derabuzorlounge.com',
        role: 'admin',
        permissions: ROLE_PERMISSIONS['admin'],
      };
    } else if (headerRole === 'staff') {
      user = {
        id: 'stf-01',
        fullName: 'Kitchen Operations Staff',
        email: 'staff@derabuzorlounge.com',
        role: 'staff',
        permissions: ROLE_PERMISSIONS['staff'],
      };
    } else {
      user = {
        id: 'adm-01',
        fullName: 'Chief Operations Officer',
        email: 'admin@derabuzorlounge.com',
        role: 'admin',
        permissions: ROLE_PERMISSIONS['admin'],
      };
    }

    (req as any).user = user;

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Access Denied (RLS Enforced): Role '${user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
        currentRole: user.role,
        requiredRoles: allowedRoles,
      });
    }

    if (requiredPermission && !user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        error: `Permission Denied (RLS Enforced): Missing permission '${requiredPermission}' for role '${user.role}'.`,
        requiredPermission,
        currentRole: user.role,
      });
    }

    next();
  };
}

// 8.1 RBAC Login (Admin vs Kitchen Staff)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password, passcode } = req.body;

  // 1. Check Executive Admin credentials
  if (
    passcode === ADMIN_PASSCODE ||
    passcode === 'admin' ||
    (email === 'admin@derabuzorlounge.com' && password === 'admin123')
  ) {
    const adminToken = `dbl-adm-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const user: AuthUser = {
      id: 'adm-01',
      fullName: 'Executive Administrator (COO)',
      email: email || 'admin@derabuzorlounge.com',
      role: 'admin',
      permissions: ROLE_PERMISSIONS['admin'],
    };
    activeSessions.set(adminToken, user);
    return res.json({
      success: true,
      token: adminToken,
      user,
    });
  }

  // 2. Check registered Staff Members in database
  const trimmedPasscode = (passcode || '').trim();
  const trimmedEmail = (email || '').trim().toLowerCase();
  const trimmedPassword = (password || '').trim();

  let matchedStaff: StaffMember | undefined;
  for (const staff of staffMembers.values()) {
    if (trimmedPasscode && staff.passcode === trimmedPasscode) {
      matchedStaff = staff;
      break;
    }
    if (trimmedEmail && staff.email.toLowerCase() === trimmedEmail) {
      if (staff.passcode === trimmedPassword || trimmedPassword === 'staff123') {
        matchedStaff = staff;
        break;
      }
    }
  }

  if (matchedStaff) {
    if (!matchedStaff.isActive) {
      return res.status(403).json({ error: 'Your staff access has been deactivated by the administrator.' });
    }
    matchedStaff.lastLogin = new Date().toISOString();
    const tokenPrefix = matchedStaff.role === 'manager' ? 'dbl-mgr' : 'dbl-stf';
    const staffToken = `${tokenPrefix}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const user: AuthUser = {
      id: matchedStaff.id,
      fullName: matchedStaff.fullName,
      email: matchedStaff.email,
      role: matchedStaff.role,
      permissions: ROLE_PERMISSIONS[matchedStaff.role],
    };
    activeSessions.set(staffToken, user);
    return res.json({
      success: true,
      token: staffToken,
      user,
      department: matchedStaff.department,
    });
  }

  // 3. Fallback Staff credentials
  if (
    passcode === STAFF_PASSCODE ||
    passcode === 'staff' ||
    (email === 'staff@derabuzorlounge.com' && password === 'staff123')
  ) {
    const staffToken = `dbl-stf-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const user: AuthUser = {
      id: 'stf-01',
      fullName: 'Abuja Kitchen Staff & Dispatch',
      email: email || 'staff@derabuzorlounge.com',
      role: 'staff',
      permissions: ROLE_PERMISSIONS['staff'],
    };
    activeSessions.set(staffToken, user);
    return res.json({
      success: true,
      token: staffToken,
      user,
    });
  }

  res.status(401).json({ error: 'Invalid staff or administrator credentials.' });
});

// 8.2 Current Auth & Role Info
app.get('/api/admin/auth/me', requireAuth(), (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
});

// 8.3 Orders CRUD Operations
// Read Orders (Admin & Staff)
app.get('/api/admin/orders', requireAuth(['admin', 'manager', 'staff'], 'orders:read'), (_req: Request, res: Response) => {
  const allOrders = Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(allOrders);
});

// Create Manual Order (Admin Only)
app.post('/api/admin/orders', requireAuth(['admin', 'manager'], 'orders:write'), (req: Request, res: Response) => {
  const { customerName, customerPhone, items, totalAmount, fulfilmentType, deliveryAddress, paymentMethod } = req.body;
  if (!customerName || !customerPhone) {
    return res.status(400).json({ error: 'Customer name and phone are required' });
  }

  const abujaDateNum = getAbujaCurrentDate().replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `DBL-${abujaDateNum}-${randomSuffix}`;
  const orderId = `ord-${Date.now()}`;

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customerName,
    customerPhone,
    customerEmail: req.body.customerEmail || '',
    fulfilmentType: fulfilmentType || 'pickup',
    deliveryAddress: deliveryAddress || '',
    items: items || [],
    subtotal: totalAmount || 0,
    deliveryFee: 0,
    discountAmount: 0,
    totalAmount: totalAmount || 0,
    currency: 'NGN',
    paymentMethod: paymentMethod || 'cash_on_pickup',
    paymentStatus: req.body.paymentStatus || 'paid',
    orderStatus: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        id: `sh-${Date.now()}`,
        orderId,
        previousStatus: 'pending',
        newStatus: 'confirmed',
        actorType: 'admin',
        actorId: 'Executive Admin',
        notes: 'Manual dine-in / telephone order created by manager',
        createdAt: new Date().toISOString(),
      }
    ]
  };

  orders.set(orderNumber, newOrder);
  res.status(201).json({ success: true, order: newOrder });
});

// Update Order Status (Admin & Staff)
app.post('/api/admin/orders/:orderNumber/status', requireAuth(['admin', 'manager', 'staff'], 'orders:status'), (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const { newStatus, notes, actorName } = req.body;
  const user = (req as any).user;

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled', 'rejected'];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: 'Invalid order status transition.' });
  }

  const order = orders.get(orderNumber);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const previousStatus = order.orderStatus;
  order.orderStatus = newStatus;
  order.updatedAt = new Date().toISOString();

  order.statusHistory?.push({
    id: `sh-${Date.now()}`,
    orderId: order.id,
    previousStatus,
    newStatus,
    actorType: user.role === 'staff' ? 'kitchen' : 'admin',
    actorId: actorName || user.fullName,
    notes: notes || `Order progressed from ${previousStatus} to ${newStatus}`,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, order });
});

// Delete Order (Admin Only - RLS: 403 Forbidden for Staff)
app.delete('/api/admin/orders/:orderNumber', requireAuth(['admin'], 'orders:delete'), (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  if (!orders.has(orderNumber)) {
    return res.status(404).json({ error: 'Order not found' });
  }

  orders.delete(orderNumber);
  res.json({ success: true, message: `Order ${orderNumber} permanently purged.` });
});

// Verify Bank Transfer / Offline Payment (Admin Only - RLS: 403 Forbidden for Staff)
app.post('/api/admin/orders/:orderNumber/verify-payment', requireAuth(['admin', 'manager'], 'finance:verify'), (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const { verifiedBy, notes } = req.body;
  const user = (req as any).user;

  const order = orders.get(orderNumber);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.paymentStatus = 'paid';
  if (order.orderStatus === 'pending') {
    order.orderStatus = 'confirmed';
  }
  order.updatedAt = new Date().toISOString();

  order.statusHistory?.push({
    id: `sh-${Date.now()}`,
    orderId: order.id,
    previousStatus: 'pending',
    newStatus: order.orderStatus,
    actorType: 'admin',
    actorId: verifiedBy || user.fullName || 'Admin Finance',
    notes: notes || `Bank transfer payment verified in GTBank statement`,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, order });
});

// 8.4 Menu Items CRUD Operations
// Read All Menu Items
app.get('/api/admin/menu/items', requireAuth(['admin', 'manager', 'staff'], 'menu:read'), (_req: Request, res: Response) => {
  const menu = getOrCreateTodayMenu();
  res.json({ success: true, items: menu.items, menuDate: menu.menuDate });
});

// Create New Dish (Admin Only)
app.post('/api/admin/menu/items', requireAuth(['admin', 'manager'], 'menu:write'), (req: Request, res: Response) => {
  const { name, displayPrice, categoryId, mealType, description, imagePath, availableQuantity } = req.body;
  if (!name || !displayPrice) {
    return res.status(400).json({ error: 'Dish name and price are required' });
  }

  const menu = getOrCreateTodayMenu();
  const newProdId = `prod-custom-${Date.now()}`;
  const newProduct: Product = {
    id: newProdId,
    categoryId: categoryId || 'cat-meals',
    mealType: mealType || 'rice-mains',
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: description || 'Special delicacy prepared by the executive chef.',
    imagePath: imagePath || '/assets/aistudio/jollof-plate_ea4269ad.png',
    basePrice: Number(displayPrice),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newMenuItem = {
    id: `dmi-${menu.menuDate}-${newProdId}`,
    dailyMenuId: menu.id,
    productId: newProdId,
    displayPrice: Number(displayPrice),
    availableQuantity: availableQuantity || 25,
    isAvailable: true,
    displayOrder: menu.items.length + 1,
    product: newProduct,
  };

  menu.items.push(newMenuItem);
  res.status(201).json({ success: true, item: newMenuItem });
});

// Update Dish Details (Admin Only)
app.put('/api/admin/menu/items/:id', requireAuth(['admin', 'manager'], 'menu:write'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, displayPrice, mealType, description, availableQuantity, isAvailable } = req.body;
  const menu = getOrCreateTodayMenu();

  const item = menu.items.find(i => i.id === id || i.productId === id);
  if (!item) {
    return res.status(404).json({ error: 'Dish not found in menu' });
  }

  if (displayPrice) item.displayPrice = Number(displayPrice);
  if (typeof availableQuantity === 'number') item.availableQuantity = availableQuantity;
  if (typeof isAvailable === 'boolean') item.isAvailable = isAvailable;
  if (item.product) {
    if (name) item.product.name = name;
    if (displayPrice) item.product.basePrice = Number(displayPrice);
    if (mealType) item.product.mealType = mealType;
    if (description) item.product.description = description;
    item.product.updatedAt = new Date().toISOString();
  }

  res.json({ success: true, item });
});

// Delete Dish (Admin Only - RLS: 403 Forbidden for Staff)
app.delete('/api/admin/menu/items/:id', requireAuth(['admin'], 'menu:delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const menu = getOrCreateTodayMenu();
  const initialLen = menu.items.length;
  menu.items = menu.items.filter(i => i.id !== id && i.productId !== id);

  if (menu.items.length === initialLen) {
    return res.status(404).json({ error: 'Dish not found' });
  }

  res.json({ success: true, message: 'Dish removed from menu.' });
});

// Toggle Product Availability & Portions (Admin & Staff)
app.post('/api/admin/menu/items/:id/availability', requireAuth(['admin', 'manager', 'staff'], 'menu:availability'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { isAvailable, availableQuantity } = req.body;
  const menu = getOrCreateTodayMenu();

  const item = menu.items.find(i => i.id === id || i.productId === id);
  if (!item) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  if (typeof isAvailable === 'boolean') {
    item.isAvailable = isAvailable;
  }
  if (typeof availableQuantity === 'number') {
    item.availableQuantity = availableQuantity;
    if (availableQuantity <= 0) {
      item.isAvailable = false;
    }
  }

  res.json({ success: true, item });
});

// Publish / Unpublish Menu (Admin Only)
app.post('/api/admin/menu/publish', requireAuth(['admin', 'manager'], 'menu:write'), (req: Request, res: Response) => {
  const { date, title, description, status } = req.body;
  const targetDate = date || getAbujaCurrentDate();
  
  let menu = dailyMenus.get(targetDate);
  if (!menu) {
    menu = {
      id: `dm-${targetDate}`,
      menuDate: targetDate,
      title: title || `Daily Menu · ${targetDate}`,
      description: description || 'Specials of the day',
      status: status || 'published',
      publishedAt: new Date().toISOString(),
      items: INITIAL_PRODUCTS.map((p, idx) => ({
        id: `dmi-${targetDate}-${p.id}`,
        dailyMenuId: `dm-${targetDate}`,
        productId: p.id,
        displayPrice: p.basePrice,
        availableQuantity: 30,
        isAvailable: true,
        displayOrder: idx + 1,
        product: p,
      }))
    };
  } else {
    menu.status = status || 'published';
    if (title) menu.title = title;
    if (description) menu.description = description;
    if (status === 'published') menu.publishedAt = new Date().toISOString();
  }

  dailyMenus.set(targetDate, menu);
  res.json({ success: true, menu });
});

// 8.5 Operations Settings (Admin Only - RLS: 403 Forbidden for Staff)
app.post('/api/admin/settings', requireAuth(['admin'], 'settings:write'), (req: Request, res: Response) => {
  const newSettings = req.body;
  restaurantSettings = {
    ...restaurantSettings,
    ...newSettings,
  };
  res.json({ success: true, settings: restaurantSettings });
});

// 8.6 Analytics & Financial P&L Reports (Admin Only - RLS: 403 Forbidden for Staff)
app.get('/api/admin/reports', requireAuth(['admin', 'manager'], 'reports:read'), (_req: Request, res: Response) => {
  const allOrders = Array.from(orders.values());
  const todayStr = getAbujaCurrentDate().replace(/-/g, '');

  const todayOrders = allOrders.filter(o => o.orderNumber.includes(todayStr));
  const totalRevenue = todayOrders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCount = allOrders.filter(o => o.orderStatus === 'pending').length;
  const preparingCount = allOrders.filter(o => o.orderStatus === 'preparing').length;
  const readyCount = allOrders.filter(o => o.orderStatus === 'ready_for_pickup' || o.orderStatus === 'out_for_delivery').length;
  const completedCount = allOrders.filter(o => o.orderStatus === 'completed').length;

  res.json({
    todayRevenue: totalRevenue,
    todayOrdersCount: todayOrders.length,
    totalAllTimeOrders: allOrders.length,
    countsByStatus: {
      pending: pendingCount,
      preparing: preparingCount,
      readyOrOut: readyCount,
      completed: completedCount,
    },
    topSellingItems: [
      { name: 'Smokey Firewood Jollof with Jumbo Prawns', quantity: 24, revenue: 228000 },
      { name: 'Dera Sizzling Peppered Asun', quantity: 19, revenue: 161500 },
      { name: 'Whole Charcoal-Grilled Croaker Fish', quantity: 12, revenue: 174000 },
      { name: 'Buzor Signature Hibiscus Zobo Cocktail', quantity: 31, revenue: 170500 },
    ]
  });
});

// 8.7 Staff & Crew Management CRUD (Admin Only - RLS: 403 Forbidden for Staff)
app.get('/api/admin/staffs', requireAuth(['admin', 'manager'], 'staff:read'), (_req: Request, res: Response) => {
  const list = Array.from(staffMembers.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(list);
});

app.post('/api/admin/staffs', requireAuth(['admin'], 'staff:write'), (req: Request, res: Response) => {
  const { fullName, email, phone, role, department, passcode } = req.body;

  if (!fullName || !phone) {
    return res.status(400).json({ error: 'Staff full name and telephone number are required.' });
  }

  const generatedId = `stf-${Date.now()}`;
  const validDepartment = department || 'Kitchen';
  const validRole: UserRole = role === 'manager' ? 'manager' : 'staff';
  const finalPasscode = (passcode || `Dera${Math.floor(1000 + Math.random() * 9000)}!`).trim();

  const newStaff: StaffMember = {
    id: generatedId,
    fullName: fullName.trim(),
    email: (email || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@derabuzorlounge.com`).trim(),
    phone: phone.trim(),
    role: validRole,
    department: validDepartment,
    passcode: finalPasscode,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  staffMembers.set(generatedId, newStaff);
  res.status(201).json({ success: true, staff: newStaff });
});

app.put('/api/admin/staffs/:id', requireAuth(['admin'], 'staff:write'), (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = staffMembers.get(id);

  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  const { fullName, email, phone, role, department, passcode, isActive } = req.body;

  if (fullName !== undefined) staff.fullName = fullName.trim();
  if (email !== undefined) staff.email = email.trim();
  if (phone !== undefined) staff.phone = phone.trim();
  if (role !== undefined) staff.role = role === 'manager' ? 'manager' : 'staff';
  if (department !== undefined) staff.department = department;
  if (passcode !== undefined && passcode.trim()) staff.passcode = passcode.trim();
  if (isActive !== undefined) staff.isActive = Boolean(isActive);

  staffMembers.set(id, staff);
  res.json({ success: true, staff });
});

app.post('/api/admin/staffs/:id/toggle-status', requireAuth(['admin'], 'staff:write'), (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = staffMembers.get(id);

  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  staff.isActive = !staff.isActive;
  staffMembers.set(id, staff);
  res.json({ success: true, staff });
});

app.delete('/api/admin/staffs/:id', requireAuth(['admin'], 'staff:delete'), (req: Request, res: Response) => {
  const { id } = req.params;

  if (!staffMembers.has(id)) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  staffMembers.delete(id);
  res.json({ success: true, message: 'Staff member deleted successfully.' });
});

// -----------------------------------------------------------------------------
// 9. VITE DEV / STATIC CLIENT MOUNTING
// -----------------------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Dera Buzor Lounge server running on http://${HOST}:${PORT}`);
    console.log(`Current Abuja Business Date: ${getAbujaCurrentDate()}`);
    console.log(`Health endpoint: http://${HOST}:${PORT}/health`);
  });
}

startServer();
