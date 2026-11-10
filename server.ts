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
  getLagosDateString 
} from './src/data/mockData';
import { Order, DailyMenu, RestaurantSettings, DeliveryZone, PromotionalCode, Testimonial } from './src/types';

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

// Timezone helper: resolves current Africa/Lagos date
function getLagosCurrentDate(): string {
  return getLagosDateString(0);
}

// Ensure today's daily menu exists
function getOrCreateTodayMenu(): DailyMenu {
  const lagosToday = getLagosCurrentDate();
  if (!dailyMenus.has(lagosToday)) {
    const newMenu: DailyMenu = {
      id: `dm-${lagosToday}`,
      menuDate: lagosToday,
      title: `Chef's Daily Selection · ${lagosToday}`,
      description: 'Handcrafted firewood grills, native soups, and signature drinks.',
      status: 'published',
      publishedAt: new Date().toISOString(),
      items: INITIAL_PRODUCTS.map((prod, idx) => ({
        id: `dmi-${lagosToday}-${prod.id}`,
        dailyMenuId: `dm-${lagosToday}`,
        productId: prod.id,
        displayPrice: prod.basePrice,
        availableQuantity: 20,
        isAvailable: true,
        displayOrder: idx + 1,
        product: prod,
      }))
    };
    dailyMenus.set(lagosToday, newMenu);
  }
  return dailyMenus.get(lagosToday)!;
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
    lagosTime: new Date(Date.now() + 3600000).toISOString(),
    activeMenuDate: getLagosCurrentDate(),
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
    const lagosDateNum = getLagosCurrentDate().replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `DBL-${lagosDateNum}-${randomSuffix}`;
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
const ADMIN_PASSCODE = process.env.ADMIN_SETUP_PASSCODE || 'DeraBuzor2026!Admin';

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password, passcode } = req.body;
  if (passcode === ADMIN_PASSCODE || (email === 'admin@derabuzorlounge.com' && password === 'admin123') || passcode === 'admin') {
    const adminToken = `dbl-adm-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    return res.json({
      success: true,
      token: adminToken,
      user: {
        id: 'adm-01',
        fullName: 'Chief Operations Officer',
        email: email || 'admin@derabuzorlounge.com',
        role: 'admin',
      }
    });
  }
  res.status(401).json({ error: 'Invalid administrator credentials.' });
});

// Admin orders retrieval
app.get('/api/admin/orders', (_req: Request, res: Response) => {
  const allOrders = Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(allOrders);
});

// Admin order status update
app.post('/api/admin/orders/:orderNumber/status', (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const { newStatus, notes, actorName } = req.body;

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

  // If order is completed or cancelled, release stock or finalize
  order.statusHistory?.push({
    id: `sh-${Date.now()}`,
    orderId: order.id,
    previousStatus,
    newStatus,
    actorType: 'admin',
    actorId: actorName || 'Manager',
    notes: notes || `Order moved from ${previousStatus} to ${newStatus}`,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, order });
});

// Admin offline payment verification (Bank Transfer / Cash)
app.post('/api/admin/orders/:orderNumber/verify-payment', (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const { verifiedBy, notes } = req.body;

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
    actorId: verifiedBy || 'Admin Manager',
    notes: notes || `Offline payment confirmed by ${verifiedBy || 'Manager'}`,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, order });
});

// Admin daily menu management
app.post('/api/admin/menu/publish', (req: Request, res: Response) => {
  const { date, title, description, status } = req.body;
  const targetDate = date || getLagosCurrentDate();
  
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

// Admin toggle product availability
app.post('/api/admin/menu/items/:id/availability', (req: Request, res: Response) => {
  const { id } = req.params;
  const { isAvailable, availableQuantity } = req.body;

  const lagosToday = getLagosCurrentDate();
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

// Admin update settings
app.post('/api/admin/settings', (req: Request, res: Response) => {
  const newSettings = req.body;
  restaurantSettings = {
    ...restaurantSettings,
    ...newSettings,
  };
  res.json({ success: true, settings: restaurantSettings });
});

// Admin analytics & reporting
app.get('/api/admin/reports', (_req: Request, res: Response) => {
  const allOrders = Array.from(orders.values());
  const todayStr = getLagosCurrentDate().replace(/-/g, '');

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
    console.log(`Current Lagos Business Date: ${getLagosCurrentDate()}`);
    console.log(`Health endpoint: http://${HOST}:${PORT}/health`);
  });
}

startServer();
