-- ============================================
-- BUSHRAS COLLECTION - COMPLETE DATABASE SCHEMA
-- Single consolidated migration for fresh database setup
-- ============================================

-- ============================================
-- 1. CREATE CUSTOM TYPES
-- ============================================

CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin', 'moderator');
CREATE TYPE public.payment_method_type AS ENUM ('manual', 'gateway', 'offline');

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  address JSONB,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (CRITICAL: Separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL,
  items JSONB NOT NULL,
  shipping_address JSONB,
  payment_method_id UUID,
  payment_status TEXT DEFAULT 'pending_payment',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type payment_method_type NOT NULL DEFAULT 'manual',
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  instructions TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hero slides table
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. ADD FOREIGN KEYS (after all tables created)
-- ============================================

ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_method_id_fkey 
FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);

-- ============================================
-- 4. CREATE FUNCTIONS
-- ============================================

-- Security definer function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is admin (admin or super_admin)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'super_admin')
  )
$$;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Auto-create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Triggers to auto-update updated_at columns
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Products policies
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin(auth.uid()));

-- Orders policies
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Hero slides policies
CREATE POLICY "Anyone can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all hero slides"
  ON public.hero_slides FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  USING (public.is_admin(auth.uid()));

-- Payment methods policies
CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all payment methods"
  ON public.payment_methods FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Products indexes
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_products_price ON public.products(price);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);

-- Payment methods indexes
CREATE INDEX idx_payment_methods_active ON public.payment_methods(is_active) WHERE is_active = true;
CREATE INDEX idx_payment_methods_display_order ON public.payment_methods(display_order);

-- Hero slides indexes
CREATE INDEX idx_hero_slides_active ON public.hero_slides(is_active, order_index) WHERE is_active = true;

-- ============================================
-- 9. CREATE STORAGE BUCKETS
-- ============================================

-- Product images bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true, 
  5242880, 
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Hero media bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-media', 
  'hero-media', 
  true, 
  10485760, 
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 10. CREATE STORAGE POLICIES
-- ============================================

-- Product images policies
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

-- Hero media policies
CREATE POLICY "Anyone can view hero media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'hero-media');

CREATE POLICY "Admins can upload hero media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hero-media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update hero media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hero-media' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'hero-media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete hero media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'hero-media' AND public.is_admin(auth.uid()));

-- ============================================
-- 11. INSERT DEFAULT DATA
-- ============================================

-- Default payment method
INSERT INTO public.payment_methods (name, type, instructions, is_active, display_order)
VALUES (
  'Contact Payment',
  'manual',
  'Please contact us at your convenience to complete payment and confirm delivery details. We will reach out to you shortly.',
  true,
  1
)
ON CONFLICT DO NOTHING;

-- Sample products (optional - for demo)
INSERT INTO public.products (name, description, price, category, stock, is_featured, image_url)
VALUES
  ('Elegant Summer Dress', 'Beautiful floral print dress perfect for summer occasions', 89.99, 'Dresses', 15, true, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'),
  ('Classic Denim Jacket', 'Timeless denim jacket that goes with everything', 129.99, 'Outerwear', 20, true, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'),
  ('Silk Blouse', 'Luxurious silk blouse for office or evening wear', 79.99, 'Tops', 12, true, 'https://images.unsplash.com/photo-1564257577871-9eb2d501b22f?w=800')
ON CONFLICT DO NOTHING;

-- Sample hero slides (optional - for demo)
INSERT INTO public.hero_slides (title, subtitle, image_url, cta_text, cta_link, order_index, is_active)
VALUES
  ('New Spring Collection', 'Discover the latest trends in fashion', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920', 'Shop Now', '/products', 1, true),
  ('Summer Sale', 'Up to 50% off on selected items', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920', 'View Deals', '/products', 2, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- SETUP COMPLETE ✓
-- ============================================
