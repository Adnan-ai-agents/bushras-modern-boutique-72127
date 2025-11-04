-- =====================================================
-- COMPLETE DATABASE SETUP & VERIFICATION
-- Run this AFTER admin-permissions-migration.sql
-- =====================================================

-- 1. CREATE AUTO-PROFILE TRIGGER
-- This automatically creates a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with data from auth metadata
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = EXCLUDED.email;

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. ADD PROFILES TABLE RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 3. ASSIGN ADMIN ROLES
-- Get user IDs by email and assign roles
DO $$
DECLARE
  super_admin_id uuid;
  admin_id uuid;
BEGIN
  -- Get super_admin user ID
  SELECT id INTO super_admin_id 
  FROM auth.users 
  WHERE email = '26bushrascollection@gmail.com';
  
  -- Get admin user ID
  SELECT id INTO admin_id 
  FROM auth.users 
  WHERE email = '26adnanansari@gmail.com';

  -- Assign super_admin role
  IF super_admin_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (super_admin_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Grant all permissions to super_admin
    PERFORM public.grant_admin_permissions(super_admin_id, super_admin_id);
    
    RAISE NOTICE 'Super admin role assigned to 26bushrascollection@gmail.com';
  ELSE
    RAISE NOTICE 'User 26bushrascollection@gmail.com not found - they need to sign up first';
  END IF;

  -- Assign admin role
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Grant all permissions to admin
    PERFORM public.grant_admin_permissions(admin_id, super_admin_id);
    
    RAISE NOTICE 'Admin role assigned to 26adnanansari@gmail.com';
  ELSE
    RAISE NOTICE 'User 26adnanansari@gmail.com not found - they need to sign up first';
  END IF;
END $$;

-- 4. CREATE MISSING PROFILES FOR EXISTING USERS
-- This handles users who signed up before the trigger was created
INSERT INTO public.profiles (id, full_name, email)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', u.email),
  u.email
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 5. VERIFICATION QUERIES
-- Run these to verify everything is set up correctly

-- Check enum values
SELECT 
  'Enum Check' as check_type,
  enumlabel as value 
FROM pg_enum 
WHERE enumtypid = 'public.app_role'::regtype
ORDER BY enumsortorder;

-- Check if trigger exists
SELECT 
  'Trigger Check' as check_type,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check RLS policies on user_roles
SELECT 
  'RLS Policies Check' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('user_roles', 'profiles', 'admin_permissions')
ORDER BY tablename, policyname;

-- Check admin role assignments
SELECT 
  'Admin Roles Check' as check_type,
  u.email,
  ur.role,
  COUNT(ap.permission_key) as permission_count
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.admin_permissions ap ON u.id = ap.user_id
WHERE ur.role IN ('admin', 'super_admin')
GROUP BY u.email, ur.role
ORDER BY ur.role DESC;

-- Check all users and their roles
SELECT 
  'All Users Check' as check_type,
  u.email,
  ARRAY_AGG(DISTINCT ur.role) as roles,
  p.full_name,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
GROUP BY u.email, p.full_name, u.created_at
ORDER BY u.created_at DESC;
