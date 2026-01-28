
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    city TEXT,
    role TEXT NOT NULL DEFAULT 'customer',
    pin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    discount_price NUMERIC,
    image TEXT,
    unit TEXT NOT NULL DEFAULT 'KG',
    organic BOOLEAN DEFAULT FALSE,
    description_en TEXT,
    description_ar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_phone TEXT NOT NULL,
    customer_city TEXT NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    delivery_fee NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENROLLMENTS TABLE (WhatsApp Promotions)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) FOR USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can create profiles" ON public.users;
CREATE POLICY "Public can create profiles" ON public.users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can read/update own profiles" ON public.users;
CREATE POLICY "Users can read/update own profiles" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full control" ON public.users;
CREATE POLICY "Admin full control" ON public.users FOR ALL USING (true);

-- RLS FOR PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin CRUD products" ON public.products;
CREATE POLICY "Admin CRUD products" ON public.products FOR ALL USING (true);

-- RLS FOR ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Read own orders or admin" ON public.orders;
CREATE POLICY "Read own orders or admin" ON public.orders FOR SELECT USING (true);

-- RLS FOR ENROLLMENTS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert enrollments" ON public.enrollments;
CREATE POLICY "Public insert enrollments" ON public.enrollments FOR INSERT WITH CHECK (true);

-- SEED INITIAL PRODUCTS (Full 70+ List)
INSERT INTO public.products (id, name_en, name_ar, category, price, discount_price, image, unit, organic)
VALUES 
-- Deals
('v1', 'Local Baladi Tomatoes', 'بندورة بلدية', 'vegetables', 0.85, 0.65, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500', 'KG', false),
('f1', 'Valencia Oranges', 'برتقال فالنسيا', 'fruits', 1.10, 0.85, 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=500', 'KG', false),
('o1', 'Medjool Dates Premium', 'تمر مجهول نخب أول', 'other', 7.00, 5.50, 'https://images.unsplash.com/photo-1589135091720-6d09323565e3?w=500', 'KG', false),
-- Vegetables
('v2', 'Fresh Cucumbers', 'خيار بلدي', 'vegetables', 0.75, null, 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500', 'KG', false),
('v3', 'Yellow Potatoes', 'بطاطا صفراء', 'vegetables', 0.55, null, 'https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?w=500', 'KG', false),
('v4', 'Red Onions', 'بصل أحمر', 'vegetables', 0.65, null, 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500', 'KG', false),
('v5', 'White Onions', 'بصل أبيض', 'vegetables', 0.70, null, 'https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?w=500', 'KG', false),
('v6', 'Sweet Carrots', 'جزر', 'vegetables', 0.80, null, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500', 'KG', false),
('v7', 'Green Bell Pepper', 'فلفل حلو أخضر', 'vegetables', 1.10, null, 'https://images.unsplash.com/photo-1566248677293-f9a8a6237841?w=500', 'KG', false),
('v8', 'Red Bell Pepper', 'فلفل حلو أحمر', 'vegetables', 1.50, null, 'https://images.unsplash.com/photo-1588611919725-772418a07106?w=500', 'KG', false),
('v9', 'Yellow Bell Pepper', 'فلفل حلو أصفر', 'vegetables', 1.50, null, 'https://images.unsplash.com/photo-1566847438217-76e82d383f84?w=500', 'KG', false),
('v10', 'Local Eggplant', 'باذنجان عجمي', 'vegetables', 0.70, null, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', 'KG', false),
('v11', 'Zucchini', 'كوسا', 'vegetables', 1.25, null, 'https://images.unsplash.com/photo-1557844352-761f2565b576?w=500', 'KG', false),
('v12', 'Cauliflower', 'زهرة', 'vegetables', 0.95, null, 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500', 'KG', false),
('v13', 'Broccoli', 'بروكلي', 'vegetables', 2.20, null, 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500', 'KG', false),
('v14', 'Garlic (Local)', 'ثوم بلدي', 'vegetables', 3.50, null, 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500', 'KG', false),
('v15', 'Ginger Root', 'زنجبيل أخضر', 'vegetables', 4.00, null, 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500', 'KG', false),
('v16', 'Spinach (Fresh)', 'سبانخ', 'vegetables', 0.60, null, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500', 'Bundle', false),
('v17', 'Parsley', 'بقدونس', 'vegetables', 0.25, null, 'https://images.unsplash.com/photo-1519623286359-e9f3cbef015b?w=500', 'Bundle', false),
('v18', 'Mint', 'نعنع', 'vegetables', 0.25, null, 'https://images.unsplash.com/photo-1589133496078-43673523537e?w=500', 'Bundle', false),
('v19', 'Coriander', 'كزبرة', 'vegetables', 0.25, null, 'https://images.unsplash.com/photo-1512429234300-006236313882?w=500', 'Bundle', false),
('v20', 'Hot Green Chili', 'فلفل حار أخضر', 'vegetables', 1.40, null, 'https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?w=500', 'KG', false),
('v21', 'Hot Red Chili', 'فلفل حار أحمر', 'vegetables', 1.60, null, 'https://images.unsplash.com/photo-1564669049400-308561f7480a?w=500', 'KG', false),
('v22', 'Radish', 'فجل', 'vegetables', 0.40, null, 'https://images.unsplash.com/photo-1594315513237-331006900f3f?w=500', 'Bundle', false),
('v23', 'Lettuce (Romaine)', 'خس بلدي', 'vegetables', 0.50, null, 'https://images.unsplash.com/photo-1556801712-76c822c67b0d?w=500', 'Head', false),
('v24', 'Iceberg Lettuce', 'خس آيسبرغ', 'vegetables', 1.20, null, 'https://images.unsplash.com/photo-1622206140733-4f9019d08605?w=500', 'Head', false),
('v25', 'Red Cabbage', 'ملفوف أحمر', 'vegetables', 0.75, null, 'https://images.unsplash.com/photo-1550147723-535308693892?w=500', 'KG', false),
('v26', 'White Cabbage', 'ملفوف أبيض', 'vegetables', 0.45, null, 'https://images.unsplash.com/photo-1611105637889-3df7df361093?w=500', 'KG', false),
('v27', 'Green Beans', 'فاصولياء خضراء', 'vegetables', 2.10, null, 'https://images.unsplash.com/photo-1567375639073-63720853844a?w=500', 'KG', false),
('v28', 'Okra (Baladi)', 'بامية بلدية', 'vegetables', 3.50, null, 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=500', 'KG', false),
('v29', 'Peas (Green)', 'بازيلاء خضراء', 'vegetables', 2.50, null, 'https://images.unsplash.com/photo-1515471209610-dae1c92d8777?w=500', 'KG', false),
('v30', 'Sweet Corn', 'ذرة حلوة', 'vegetables', 0.60, null, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500', 'Ear', false),
('v31', 'Pumpkin', 'يقطين', 'vegetables', 0.90, null, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500', 'KG', false),
('v32', 'Beetroot', 'شمندر', 'vegetables', 0.85, null, 'https://images.unsplash.com/photo-1528137858128-da533bc134cd?w=500', 'KG', false),
('v33', 'Celery', 'كرفس', 'vegetables', 1.50, null, 'https://images.unsplash.com/photo-1597362920556-3475bb5f3f7f?w=500', 'Bundle', false),
('v34', 'Artichoke', 'خرشوف', 'vegetables', 1.00, null, 'https://images.unsplash.com/photo-1518562144211-9f20b3f5879a?w=500', 'Piece', false),
('v35', 'Mushrooms (White)', 'فطر أبيض', 'vegetables', 1.80, null, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500', 'Box', false),
-- Fruits
('f2', 'Local Bananas', 'موز بلدي', 'fruits', 1.20, null, 'https://images.unsplash.com/photo-1571771894821-ad996211fdf4?w=500', 'KG', false),
('f3', 'Red Gala Apples', 'تفاح أحمر', 'fruits', 1.35, null, 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500', 'KG', false),
('f4', 'Green Smith Apples', 'تفاح أخضر', 'fruits', 1.50, null, 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500', 'KG', false),
('f5', 'Golden Apples', 'تفاح أصفر', 'fruits', 1.30, null, 'https://images.unsplash.com/photo-1615484477201-9f4953340fab?w=500', 'KG', false),
('f6', 'Seedless Grapes', 'عنب', 'fruits', 1.75, null, 'https://images.unsplash.com/photo-1537640538966-79f369b41e8f?w=500', 'KG', false),
('f7', 'Black Grapes', 'عنب أسود', 'fruits', 2.00, null, 'https://images.unsplash.com/photo-1423483641154-5411ec9c0ddf?w=500', 'KG', false),
('f8', 'Pears', 'إجاص', 'fruits', 1.45, null, 'https://images.unsplash.com/photo-1514756331096-242f3900f811?w=500', 'KG', false),
('f9', 'Peaches', 'دراق', 'fruits', 2.50, null, 'https://images.unsplash.com/photo-1521245353112-98c422896677?w=500', 'KG', false),
('f10', 'Nectarines', 'نكتارين', 'fruits', 2.60, null, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500', 'KG', false),
('f11', 'Apricots', 'مشمش', 'fruits', 3.00, null, 'https://images.unsplash.com/photo-1501199532029-4586261c4e18?w=500', 'KG', false),
('f12', 'Plums', 'خوخ', 'fruits', 2.20, null, 'https://images.unsplash.com/photo-1542614397-9092496734c8?w=500', 'KG', false),
('f13', 'Local Strawberries', 'فراولة', 'fruits', 2.50, null, 'https://images.unsplash.com/photo-1543528176-61b2395143a4?w=500', 'Box', false),
('f14', 'Blueberries', 'توت أزرق', 'fruits', 3.50, null, 'https://images.unsplash.com/photo-1497534446932-c946e7316a3c?w=500', 'Box', false),
('f15', 'Raspberries', 'توت أحمر', 'fruits', 3.80, null, 'https://images.unsplash.com/photo-1534062319207-6f01df222d64?w=500', 'Box', false),
('f16', 'Watermelon', 'بطيخ', 'fruits', 0.35, null, 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=500', 'KG', false),
('f17', 'Sweet Melon', 'شمام', 'fruits', 0.65, null, 'https://images.unsplash.com/photo-1621535266898-7253503c5d6c?w=500', 'KG', false),
('f18', 'Kiwi', 'كيوي', 'fruits', 1.80, null, 'https://images.unsplash.com/photo-1585059895312-70c982997368?w=500', 'KG', false),
('f19', 'Mango', 'مانجا', 'fruits', 2.80, null, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500', 'KG', false),
('f20', 'Pineapple', 'أناناس', 'fruits', 3.50, null, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500', 'Piece', false),
('f21', 'Pomegranate', 'رمان', 'fruits', 1.60, null, 'https://images.unsplash.com/photo-1541344999736-83eca882894e?w=500', 'KG', false),
('f22', 'Figs', 'تين', 'fruits', 3.20, null, 'https://images.unsplash.com/photo-1533590916375-37662b246b75?w=500', 'KG', false),
('f23', 'Guava', 'جوافة', 'fruits', 2.40, null, 'https://images.unsplash.com/photo-1536657235019-030712608101?w=500', 'KG', false),
('f24', 'Avocado', 'أفوكادو', 'fruits', 3.50, null, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500', 'KG', false),
('f25', 'Lemons', 'ليمون', 'fruits', 0.90, null, 'https://images.unsplash.com/photo-1590502593747-42a996132182?w=500', 'KG', false),
-- Organic
('org1', 'Organic Spinach', 'سبانخ عضوي', 'organic', 2.00, null, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500', 'Bundle', true),
('org2', 'Organic Carrots', 'جزر عضوي', 'organic', 1.80, null, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500', 'KG', true),
('org3', 'Organic Kale', 'كالي عضوي', 'organic', 3.50, null, 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=500', 'Bundle', true),
('org4', 'Organic Tomatoes', 'بندورة عضوية', 'organic', 2.50, null, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500', 'KG', true),
('org5', 'Organic Arugula', 'جرجير عضوي', 'organic', 1.50, null, 'https://images.unsplash.com/photo-1591850053970-845984f236cd?w=500', 'Bundle', true),
('org6', 'Organic Beetroot', 'شمندر عضوي', 'organic', 2.20, null, 'https://images.unsplash.com/photo-1528137858128-da533bc134cd?w=500', 'KG', true),
('org7', 'Organic Apples', 'تفاح عضوي', 'organic', 3.50, null, 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500', 'KG', true),
('org8', 'Organic Ginger', 'زنجبيل عضوي', 'organic', 6.00, null, 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500', 'KG', true),
('org9', 'Organic Turmeric', 'كركم عضوي', 'organic', 8.00, null, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500', 'KG', true),
('org10', 'Organic Basil', 'ريحان عضوي', 'organic', 2.00, null, 'https://images.unsplash.com/photo-1618375604116-2ac0b9ec1444?w=500', 'Bundle', true),
-- Other
('o2', 'Local Mountain Honey', 'عسل جبلي', 'other', 12.00, null, 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500', 'Jar', true),
('o3', 'Extra Virgin Olive Oil', 'زيت زيتون بكر', 'other', 9.50, null, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500', 'Liter', true),
('o4', 'Baladi Eggs (30 pcs)', 'بيض بلدي', 'other', 4.50, null, 'https://images.unsplash.com/photo-1569254994521-ddb40316ec3b?w=500', 'Plate', false),
('o5', 'Apple Cider Vinegar', 'خل تفاح طبيعي', 'other', 3.50, null, 'https://images.unsplash.com/photo-1621535266898-7253503c5d6c?w=500', 'Bottle', true),
('o6', 'Pickled Olives', 'زيتون مخلل', 'other', 5.00, null, 'https://images.unsplash.com/photo-1568284566212-0544f1c1f43a?w=500', 'KG', false),
('o7', 'Dried Apricots', 'مشمش مجفف', 'other', 6.50, null, 'https://images.unsplash.com/photo-1501199532029-4586261c4e18?w=500', 'Box', false),
('o8', 'Raw Walnuts', 'جوز قلب', 'other', 10.00, null, 'https://images.unsplash.com/photo-1552392816-3a8c5eb32402?w=500', 'KG', false),
('o9', 'Pistachios', 'فستق حلبي', 'other', 15.00, null, 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500', 'KG', false),
('o10', 'Zaatar (Premium)', 'زعتر ملكي', 'other', 4.50, null, 'https://images.unsplash.com/photo-1512429234300-006236313882?w=500', 'KG', false)
ON CONFLICT (id) DO UPDATE SET 
    name_en = EXCLUDED.name_en, 
    name_ar = EXCLUDED.name_ar, 
    category = EXCLUDED.category, 
    price = EXCLUDED.price, 
    discount_price = EXCLUDED.discount_price, 
    image = EXCLUDED.image, 
    unit = EXCLUDED.unit, 
    organic = EXCLUDED.organic;
