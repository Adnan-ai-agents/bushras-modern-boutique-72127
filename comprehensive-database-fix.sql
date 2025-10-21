-- =====================================================
-- COMPREHENSIVE DATABASE FIX FOR BUSHRA'S COLLECTION
-- Run this SQL in your Supabase SQL Editor
-- This fixes ALL RLS, realtime, and data issues
-- =====================================================

-- PART 1: ENUMS AND BASE TABLES
-- =====================================================

-- Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create admin_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_key text NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission_key)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- PART 2: SECURITY DEFINER FUNCTIONS
-- =====================================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  )
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_permissions WHERE user_id = _user_id AND permission_key = _permission
  ) OR public.is_super_admin(_user_id)
$$;

-- PART 3: DROP ALL EXISTING POLICIES
-- =====================================================

-- Products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active published products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins with permission can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins with permission can update products" ON public.products;
DROP POLICY IF EXISTS "Admins with permission can delete products" ON public.products;

-- Hero slides policies  
DROP POLICY IF EXISTS "Anyone can view active hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admins with permission can manage hero slides" ON public.hero_slides;

-- Orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins with permission can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins with permission can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

-- Order items policies
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

-- Admin permissions policies
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.admin_permissions;
DROP POLICY IF EXISTS "Super admins can manage all permissions" ON public.admin_permissions;

-- Wishlist policies (if table exists)
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlist;

-- Reviews policies (if table exists)
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;

-- PART 4: CREATE COMPREHENSIVE RLS POLICIES
-- =====================================================

-- ========== PRODUCTS TABLE ==========
CREATE POLICY "Public can view published products" ON public.products
  FOR SELECT USING (is_active = true AND is_published = true);

CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ========== HERO SLIDES TABLE ==========
CREATE POLICY "Public can view active hero slides" ON public.hero_slides
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all hero slides" ON public.hero_slides
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert hero slides" ON public.hero_slides
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update hero slides" ON public.hero_slides
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete hero slides" ON public.hero_slides
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ========== ORDERS TABLE ==========
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ========== ORDER ITEMS TABLE ==========
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update order items" ON public.order_items
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete order items" ON public.order_items
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ========== PROFILES TABLE ==========
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ========== USER ROLES TABLE ==========
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.is_super_admin(auth.uid()));

-- ========== ADMIN PERMISSIONS TABLE ==========
CREATE POLICY "Users can view their own permissions" ON public.admin_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions" ON public.admin_permissions
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can insert permissions" ON public.admin_permissions
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update permissions" ON public.admin_permissions
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete permissions" ON public.admin_permissions
  FOR DELETE USING (public.is_super_admin(auth.uid()));

-- ========== WISHLIST TABLE (if exists) ==========
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlist') THEN
    EXECUTE 'CREATE POLICY "Users can view own wishlist" ON public.wishlist
      FOR SELECT USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users can insert own wishlist" ON public.wishlist
      FOR INSERT WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users can delete own wishlist" ON public.wishlist
      FOR DELETE USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Admins can view all wishlist" ON public.wishlist
      FOR SELECT USING (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- ========== REVIEWS TABLE (if exists) ==========
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    EXECUTE 'CREATE POLICY "Public can view approved reviews" ON public.reviews
      FOR SELECT USING (is_approved = true)';
    
    EXECUTE 'CREATE POLICY "Admins can view all reviews" ON public.reviews
      FOR SELECT USING (public.is_admin(auth.uid()))';
    
    EXECUTE 'CREATE POLICY "Users can insert reviews" ON public.reviews
      FOR INSERT WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users can update own reviews" ON public.reviews
      FOR UPDATE USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Admins can update all reviews" ON public.reviews
      FOR UPDATE USING (public.is_admin(auth.uid()))';
    
    EXECUTE 'CREATE POLICY "Admins can delete reviews" ON public.reviews
      FOR DELETE USING (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- PART 5: ENABLE REALTIME ON CRITICAL TABLES
-- =====================================================

-- Set replica identity for realtime
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.hero_slides REPLICA IDENTITY FULL;

-- Add tables to realtime publication (create publication if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add tables to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_slides;

-- PART 6: FIX PRODUCT FLAGS
-- =====================================================

-- Ensure all products are active and published (for testing)
UPDATE public.products 
SET is_active = true, is_published = true 
WHERE is_active IS NULL OR is_published IS NULL;

-- PART 7: HELPER FUNCTIONS
-- =====================================================

-- Function to grant all admin permissions to a user
CREATE OR REPLACE FUNCTION public.grant_admin_permissions(_user_id uuid, _granted_by uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_permissions (user_id, permission_key, granted_by)
  VALUES 
    (_user_id, 'HERO_MANAGEMENT', _granted_by),
    (_user_id, 'PRODUCT_MANAGEMENT', _granted_by),
    (_user_id, 'ORDER_MANAGEMENT', _granted_by),
    (_user_id, 'USER_MANAGEMENT', _granted_by),
    (_user_id, 'TEAM_MANAGEMENT', _granted_by),
    (_user_id, 'REVIEW_MANAGEMENT', _granted_by)
  ON CONFLICT (user_id, permission_key) DO NOTHING;
END;
$$;

-- PART 8: VERIFICATION QUERIES
-- =====================================================

-- Run these to verify everything is set up correctly:

-- Check if your user has admin role (replace YOUR_USER_ID)
-- SELECT * FROM public.user_roles WHERE user_id = 'YOUR_USER_ID';

-- Check all products
-- SELECT id, name, is_active, is_published FROM public.products;

-- Check all orders
-- SELECT id, user_id, total_amount, status FROM public.orders;

-- Check all profiles
-- SELECT id, email, name FROM public.profiles;

-- Check realtime publication
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- =====================================================
-- SETUP INSTRUCTIONS AFTER RUNNING THIS SQL:
-- =====================================================

-- 1. Make yourself an admin by running:
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('YOUR_USER_ID', 'admin')
--    ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Get your user ID by running:
--    SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- 3. Verify admin access by running:
--    SELECT public.is_admin('YOUR_USER_ID');
--    (Should return true)

-- =====================================================
-- COMPLETED SUCCESSFULLY
-- =====================================================
