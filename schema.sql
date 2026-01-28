
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

-- ROW LEVEL SECURITY (RLS)
-- We drop policies first if they exist to prevent "already exists" errors on re-runs

-- Products Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Admin CRUD products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin CRUD products" ON public.products FOR ALL USING (true);

-- Orders Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Read own orders or admin" ON public.orders;
DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Read own orders or admin" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE USING (true);

-- Enrollments Policies
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admin read enrollments" ON public.enrollments;
CREATE POLICY "Public insert enrollments" ON public.enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read enrollments" ON public.enrollments FOR SELECT USING (true);

-- Users Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User management" ON public.users;
CREATE POLICY "User management" ON public.users FOR ALL USING (true);

-- SEED INITIAL PRODUCTS
INSERT INTO public.products (id, name_en, name_ar, category, price, discount_price, image, unit, organic)
VALUES 
('v1', 'Local Baladi Tomatoes', 'بندورة بلدية', 'vegetables', 0.85, 0.65, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500', 'KG', false),
('f1', 'Valencia Oranges', 'برتقال فالنسيا', 'fruits', 1.10, 0.85, 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=500', 'KG', false),
('o1', 'Medjool Dates Premium', 'تمر مجهول نخب أول', 'other', 7.00, 5.50, 'https://images.unsplash.com/photo-1589135091720-6d09323565e3?w=500', 'KG', false),
('v2', 'Fresh Cucumbers', 'خيار بلدي طازج', 'vegetables', 0.75, null, 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500', 'KG', false),
('v6', 'Yellow Potatoes', 'بطاطا', 'vegetables', 0.50, null, 'https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?w=500', 'KG', false),
('f3', 'Red Gala Apples', 'تفاح أحمر جالا', 'fruits', 1.35, null, 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500', 'KG', false),
('o2', 'Local Mountain Honey', 'عسل جبلي بلدي', 'other', 12.00, null, 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500', 'Jar', true),
('o3', 'Extra Virgin Olive Oil', 'زيت زيتون بكر', 'other', 9.50, null, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500', 'Liter', true)
ON CONFLICT (id) DO NOTHING;
