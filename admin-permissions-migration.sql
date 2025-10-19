-- =====================================================
-- COMPREHENSIVE ADMIN PERMISSIONS SYSTEM
-- Run this SQL in your Supabase SQL Editor
-- This fixes RLS security issues and adds granular permissions
-- =====================================================

-- 1. Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create admin_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_key text NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission_key)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer functions
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

-- 5. Products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Anyone can view active published products" ON public.products
  FOR SELECT USING (is_active = true AND is_published = true);

CREATE POLICY "Admins with permission can insert products" ON public.products
  FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'PRODUCT_MANAGEMENT'));

CREATE POLICY "Admins with permission can update products" ON public.products
  FOR UPDATE USING (public.has_permission(auth.uid(), 'PRODUCT_MANAGEMENT'));

CREATE POLICY "Admins with permission can delete products" ON public.products
  FOR DELETE USING (public.has_permission(auth.uid(), 'PRODUCT_MANAGEMENT'));

-- 6. Hero slides policies  
DROP POLICY IF EXISTS "Anyone can view active hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.hero_slides;

CREATE POLICY "Anyone can view active hero slides" ON public.hero_slides
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins with permission can manage hero slides" ON public.hero_slides
  FOR ALL USING (public.has_permission(auth.uid(), 'HERO_MANAGEMENT'));

-- 7. Orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins with permission can view all orders" ON public.orders
  FOR SELECT USING (public.has_permission(auth.uid(), 'ORDER_MANAGEMENT'));

CREATE POLICY "Admins with permission can update orders" ON public.orders
  FOR UPDATE USING (public.has_permission(auth.uid(), 'ORDER_MANAGEMENT'));

-- 8. User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- 9. Admin permissions policies
CREATE POLICY "Users can view their own permissions" ON public.admin_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all permissions" ON public.admin_permissions
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- 10. Grant permissions function
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
