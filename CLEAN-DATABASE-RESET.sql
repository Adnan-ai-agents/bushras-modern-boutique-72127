-- ========================================
-- CLEAN DATABASE RESET SCRIPT
-- Run this ONCE in Supabase SQL Editor
-- ========================================
-- This will clean all duplications and set up fresh schema

-- ========================================
-- STEP 1: DROP ALL CONFLICTING OBJECTS
-- ========================================

-- Drop all policies first (to avoid dependency issues)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Drop all functions (to avoid conflicts)
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.has_permission(uuid, text);
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
DROP FUNCTION IF EXISTS public.grant_admin_permissions(uuid, uuid);

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Drop trigger functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- ========================================
-- STEP 2: RECREATE CLEAN SCHEMA
-- ========================================

-- Create enum for roles (idempotent)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure user_roles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT user_roles_user_id_role_key UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  phone text,
  address jsonb,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE SECURITY FUNCTIONS
-- ========================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  )
$$;

-- Function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- ========================================
-- STEP 4: CREATE AUTO-PROFILE TRIGGER
-- ========================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 5: CREATE RLS POLICIES
-- ========================================

-- Profiles policies
CREATE POLICY "Users can view own profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Products policies (if products table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view published products" ON public.products';
    EXECUTE 'CREATE POLICY "Public can view published products" ON public.products FOR SELECT USING (is_published = true OR public.is_admin(auth.uid()))';
    
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage products" ON public.products';
    EXECUTE 'CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- Orders policies (if orders table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own orders" ON public.orders';
    EXECUTE 'CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()))';
    
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders';
    EXECUTE 'CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- ========================================
-- STEP 6: ASSIGN ADMIN ROLES
-- ========================================

-- Assign super_admin role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::public.app_role
FROM auth.users u
WHERE u.email = '26bushrascollection@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE u.email = '26adnanansari@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ========================================
-- STEP 7: CREATE PROFILES FOR EXISTING USERS
-- ========================================

-- Ensure all users have profiles
INSERT INTO public.profiles (id, name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Ensure all users have at least 'user' role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  'user'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ========================================
-- STEP 8: VERIFICATION
-- ========================================

-- Show all user roles
SELECT 
  u.email,
  u.id,
  ARRAY_AGG(ur.role ORDER BY ur.role) as roles,
  p.name as profile_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.id = u.id
GROUP BY u.email, u.id, p.name
ORDER BY u.email;
