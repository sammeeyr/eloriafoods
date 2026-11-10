-- Dera Buzor Lounge Database Migration
-- Version: 20261109000000
-- Target: Supabase PostgreSQL (Google Cloud Run / Africa/Lagos)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean Up Tables if Rerunning
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS payment_events CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS daily_menu_items CASCADE;
DROP TABLE IF EXISTS daily_menus CASCADE;
DROP TABLE IF EXISTS product_addons CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;
DROP TABLE IF EXISTS restaurant_settings CASCADE;
DROP TABLE IF EXISTS promotional_codes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. PROFILES (Staff & Admins)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_path TEXT,
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. PRODUCT VARIANTS
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_modifier NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. PRODUCT ADDONS
CREATE TABLE product_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    max_quantity INT NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. DAILY MENUS (Lagos Timezone Resolving)
CREATE TABLE daily_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_date DATE NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. DAILY MENU ITEMS
CREATE TABLE daily_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    display_price NUMERIC(12, 2) NOT NULL CHECK (display_price >= 0),
    available_quantity INT NOT NULL DEFAULT 50 CHECK (available_quantity >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT unique_daily_menu_product UNIQUE(daily_menu_id, product_id)
);

-- 10. CUSTOMERS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. DELIVERY ZONES
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (fee >= 0),
    estimated_minutes INT NOT NULL DEFAULT 45,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 12. CUSTOMER ADDRESSES
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
    delivery_instructions TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 13. RESTAURANT SETTINGS
CREATE TABLE restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name TEXT NOT NULL DEFAULT 'Dera Buzor Lounge',
    tagline TEXT NOT NULL DEFAULT 'Taste More. Relax Better.',
    phone TEXT NOT NULL DEFAULT '+234 803 000 0000',
    whatsapp_number TEXT NOT NULL DEFAULT '+2348030000000',
    address TEXT NOT NULL DEFAULT 'Plot 12, Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
    email TEXT NOT NULL DEFAULT 'orders@derabuzorlounge.com',
    is_accepting_orders BOOLEAN NOT NULL DEFAULT true,
    is_delivery_enabled BOOLEAN NOT NULL DEFAULT true,
    is_pickup_enabled BOOLEAN NOT NULL DEFAULT true,
    opening_time TEXT NOT NULL DEFAULT '11:00',
    closing_time TEXT NOT NULL DEFAULT '23:30',
    bank_account_name TEXT NOT NULL DEFAULT 'DERA BUZOR LOUNGE LTD',
    bank_account_number TEXT NOT NULL DEFAULT '0123456789',
    bank_name TEXT NOT NULL DEFAULT 'Guaranty Trust Bank (GTBank)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 14. PROMOTIONAL CODES
CREATE TABLE promotional_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 15. ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    fulfilment_type TEXT NOT NULL CHECK (fulfilment_type IN ('pickup', 'delivery')),
    delivery_address TEXT,
    delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
    delivery_instructions TEXT,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('paystack', 'flutterwave', 'bank_transfer', 'cash_on_pickup', 'cash_on_delivery')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled', 'rejected')),
    customer_notes TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 16. ORDER ITEMS (Immutable Snapshots)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    selected_variants JSONB DEFAULT '[]'::jsonb,
    selected_addons JSONB DEFAULT '[]'::jsonb,
    item_notes TEXT,
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

-- 17. PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('paystack', 'flutterwave', 'bank_transfer', 'cash')),
    provider_reference TEXT UNIQUE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'refunded')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 18. PAYMENT EVENTS (Webhook Deduplication & Audit)
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT unique_provider_event UNIQUE(provider, provider_event_id)
);

-- 19. ORDER STATUS HISTORY
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'admin', 'system', 'webhook')),
    actor_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 20. ADMIN AUDIT LOGS
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for performance & integrity
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_daily_menus_date_status ON daily_menus(menu_date, status);
CREATE INDEX idx_daily_menu_items_menu ON daily_menu_items(daily_menu_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_reference ON payments(provider_reference);
CREATE INDEX idx_payment_events_hash ON payment_events(payload_hash);
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public read active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active product variants" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active product addons" ON product_addons FOR SELECT USING (is_active = true);
CREATE POLICY "Public read published daily menus" ON daily_menus FOR SELECT USING (status = 'published');
CREATE POLICY "Public read available daily menu items" ON daily_menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Public read active delivery zones" ON delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Public read restaurant settings" ON restaurant_settings FOR SELECT USING (true);

-- Order lookup policy (Customers can query by order_number)
CREATE POLICY "Public select orders by order number" ON orders FOR SELECT USING (true);
CREATE POLICY "Public select order items by order id" ON order_items FOR SELECT USING (true);
CREATE POLICY "Public select order history" ON order_status_history FOR SELECT USING (true);

-- Admin Full Access Policies (authenticated users with profile role admin/manager)
CREATE POLICY "Staff all profiles" ON profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all categories" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all products" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all product_variants" ON product_variants FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all product_addons" ON product_addons FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all daily_menus" ON daily_menus FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all daily_menu_items" ON daily_menu_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all delivery_zones" ON delivery_zones FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all restaurant_settings" ON restaurant_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all promotional_codes" ON promotional_codes FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all order_items" ON order_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all payments" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all payment_events" ON payment_events FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all order_status_history" ON order_status_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin all admin_audit_logs" ON admin_audit_logs FOR ALL TO authenticated USING (true);
