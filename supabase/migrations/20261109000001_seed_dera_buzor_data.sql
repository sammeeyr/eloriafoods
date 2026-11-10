-- Dera Buzor Lounge Initial Seed Data
-- Version: 20261109000001
-- Timezone: Africa/Lagos

-- 1. Restaurant Settings
INSERT INTO restaurant_settings (
    id, restaurant_name, tagline, phone, whatsapp_number, address, email,
    is_accepting_orders, is_delivery_enabled, is_pickup_enabled, opening_time, closing_time,
    bank_account_name, bank_account_number, bank_name
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Dera Buzor Lounge',
    'Taste More. Relax Better.',
    '+234 814 555 0192',
    '+2348145550192',
    'Plot 14B Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
    'chef@derabuzorlounge.com',
    true, true, true,
    '11:30', '23:30',
    'DERA BUZOR LOUNGE & SUITES LTD',
    '0129845721',
    'Guaranty Trust Bank (GTBank)'
) ON CONFLICT (id) DO NOTHING;

-- 2. Delivery Zones (Lagos Metro)
INSERT INTO delivery_zones (id, name, fee, estimated_minutes, is_active, display_order) VALUES
('b0000000-0000-0000-0000-000000000001', 'Lekki Phase 1 (Core)', 1500.00, 30, true, 1),
('b0000000-0000-0000-0000-000000000002', 'Ikoyi & Banana Island', 2500.00, 40, true, 2),
('b0000000-0000-0000-0000-000000000003', 'Victoria Island & Oniru', 2200.00, 35, true, 3),
('b0000000-0000-0000-0000-000000000004', 'Lekki Phase 2, Agungi & Osapa', 2500.00, 45, true, 4),
('b0000000-0000-0000-0000-000000000005', 'Chevron, Orchid & Ikate', 3000.00, 50, true, 5),
('b0000000-0000-0000-0000-000000000006', 'Ikeja GRA & Maryland', 4500.00, 70, true, 6),
('b0000000-0000-0000-0000-000000000007', 'Surulere & Yaba', 4000.00, 60, true, 7)
ON CONFLICT (id) DO NOTHING;

-- 3. Categories
INSERT INTO categories (id, name, slug, description, display_order, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'Lounge Starters & Small Chops', 'starters', 'Crispy, spicy bite-sized Lagos lounge classics', 1, true),
('c0000000-0000-0000-0000-000000000002', 'Firewood Jollof & Charcoal Grills', 'grills-jollof', 'Signature smokey firewood jollof and flame-grilled proteins', 2, true),
('c0000000-0000-0000-0000-000000000003', 'Soups & Traditional Swallows', 'soups-swallows', 'Rich artisanal native soups prepared with prime assorted meats', 3, true),
('c0000000-0000-0000-0000-000000000004', 'Lounge Chef Specials', 'chef-specials', 'Curated house delicacies and sharing platters', 4, true),
('c0000000-0000-0000-0000-000000000005', 'Artisan Cocktails & Drinks', 'cocktails-drinks', 'Handcrafted tropical infusions, mocktails, and chillers', 5, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Products
INSERT INTO products (id, category_id, name, slug, description, image_path, base_price, is_active) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Smokey Firewood Jollof Rice with Jumbo Tiger Prawns',
    'firewood-jollof-tiger-prawns',
    'Authentic party-style firewood jollof rice simmered in rich plum tomato broth, served with flame-kissed jumbo tiger prawns, golden fried plantain (dodo), and fresh garden garnish.',
    '/src/assets/images/food_jollof_deluxe_1794247404252.jpg',
    9500.00,
    true
),
(
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'Dera Sizzling Peppered Asun Goat Meat',
    'sizzling-peppered-asun',
    'Tender slow-smoked goat meat chunks tossed in fiery habanero relish, bell peppers, sliced sweet red onions, and indigenous spices.',
    '/src/assets/images/food_peppered_goat_1794247404469.jpg',
    8200.00,
    true
),
(
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'Whole Charcoal-Grilled Croaker Fish Platter',
    'grilled-croaker-fish-platter',
    'Freshly caught whole croaker marinated in spicy scotch bonnet marinade, grilled to perfection over red-hot coals, paired with roasted ripe plantain (boli) and fresh herb chili dip.',
    '/src/assets/images/food_grilled_croaker_1794247406560.jpg',
    14500.00,
    true
),
(
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000005',
    'Buzor Signature Hibiscus Zobo Craft Cocktail',
    'buzor-signature-hibiscus-zobo',
    'Slow-infused organic Sudanese hibiscus leaves, spiced ginger, fresh garden mint, dehydrated citrus wheel, served over crystal hand-cut ice.',
    '/src/assets/images/drinks_cocktail_special_1794247405359.jpg',
    5500.00,
    true
),
(
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000003',
    'Fisherman Soup with Fresh Catfish & Sea Snails',
    'fisherman-soup-fresh-catfish',
    'Rich traditional Niger Delta broth packed with tender river catfish, periwinkles, sea snails, and crab claws. Served with your choice of pounded yam or wheat.',
    '/src/assets/images/food_peppered_goat_1794247404469.jpg',
    16000.00,
    true
),
(
    'd0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000001',
    'Crispy Gourmet Lagos Small Chops Platter',
    'crispy-gourmet-small-chops',
    'Handmade beef samosas, crispy spring rolls, seasoned puff-puff, and peppered gizzard skewers, served with sweet chili dip.',
    '/src/assets/images/food_peppered_goat_1794247404469.jpg',
    6500.00,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 5. Product Variants
INSERT INTO product_variants (id, product_id, name, price_modifier, is_default, is_active) VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Standard Portion (1 Person)', 0.00, true, true),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Lounge Sharing Platter (2-3 Persons)', 7500.00, false, true),
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Medium Croaker (approx 800g)', 0.00, true, true),
('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'Jumbo Croaker (approx 1.2kg)', 4500.00, false, true),
('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'Mocktail (Non-Alcoholic)', 0.00, true, true),
('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', 'Cocktail (Spiced Dark Rum Infused)', 2000.00, false, true)
ON CONFLICT (id) DO NOTHING;

-- 6. Product Addons
INSERT INTO product_addons (id, product_id, name, price, max_quantity, is_active) VALUES
('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Extra Fried Sweet Plantain (Dodo)', 1200.00, 3, true),
('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Extra Peppered Fried Beef', 2500.00, 3, true),
('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Extra Roasted Boli (Plantain)', 1500.00, 2, true),
('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'Extra Fiery Pepper Sauce Dip', 800.00, 3, true)
ON CONFLICT (id) DO NOTHING;

-- 7. Promotional Codes
INSERT INTO promotional_codes (id, code, discount_type, discount_value, min_order_amount, is_active, usage_limit, usage_count) VALUES
('a1000000-0000-0000-0000-000000000001', 'RELAX10', 'percentage', 10.00, 10000.00, true, 500, 12),
('a1000000-0000-0000-0000-000000000002', 'BUZOR2000', 'fixed', 2000.00, 15000.00, true, 200, 5)
ON CONFLICT (id) DO NOTHING;
