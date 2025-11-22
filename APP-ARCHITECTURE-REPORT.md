# Bushra's Collection - Complete Application Report

## Table of Contents
1. [Application Overview](#application-overview)
2. [Authentication Flow](#authentication-flow)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Database Schema](#database-schema)
5. [Application Features & Flows](#application-features--flows)
6. [Admin Features](#admin-features)
7. [Database Migration Guide](#database-migration-guide)

---

## Application Overview

**Bushra's Collection** is a full-stack e-commerce platform built with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Lovable Cloud (Supabase)
- **Authentication**: Email/Password + OAuth (Google, Facebook)
- **State Management**: Zustand
- **Routing**: React Router v6

---

## Authentication Flow

### 1. Sign Up Flow
```
User visits /auth → Fills sign up form → Submits
    ↓
Supabase creates auth.users entry
    ↓
Database trigger (handle_new_user) fires:
  - Creates profile in profiles table
  - Assigns default 'user' role in user_roles table
    ↓
User receives confirmation (auto-confirmed)
    ↓
User is authenticated → Redirected to homepage
    ↓
Navigation updates to show user profile
```

**Files involved:**
- `src/pages/Auth.tsx` - Sign up UI and logic
- `src/lib/auth.ts` - Authentication service
- `src/store/auth.ts` - Auth state management
- Database trigger: `handle_new_user()`

### 2. Sign In Flow
```
User visits /auth → Fills sign in form → Submits
    ↓
Supabase validates credentials
    ↓
Auth store fetches:
  - User session
  - User profile from profiles table
  - User roles from user_roles table
    ↓
User authenticated → Redirected based on role:
  - Admin/Super Admin → /admin
  - Regular user → Previous page or homepage
    ↓
Navigation updates with user info
```

**Files involved:**
- `src/pages/Auth.tsx` - Sign in UI and logic
- `src/lib/auth.ts` - Authentication service
- `src/store/auth.ts` - Auth state management
- `src/components/Navigation.tsx` - Nav updates

### 3. OAuth Flow (Google/Facebook)
```
User clicks OAuth button → Redirects to provider
    ↓
User authorizes → Provider redirects back
    ↓
Same flow as Sign Up (trigger creates profile + role)
    ↓
User authenticated and redirected
```

### 4. Sign Out Flow
```
User clicks Sign Out in navigation dropdown
    ↓
Supabase signs out user
    ↓
Auth store clears user and session
    ↓
User redirected to homepage
    ↓
Navigation shows "Sign In" button
```

---

## User Roles & Permissions

### Role Hierarchy

```
┌─────────────────┐
│  super_admin    │ ← Full system access
├─────────────────┤
│     admin       │ ← Manage products, orders, users
├─────────────────┤
│      user       │ ← Browse, shop, manage own profile
└─────────────────┘
```

### Role Storage
- **Table**: `user_roles`
- **Enum**: `app_role` (values: 'user', 'admin', 'super_admin')
- **Relationship**: One user can have multiple roles

### Security Functions
Located in database, used for RLS policies:

1. **`has_role(user_id, role)`**
   - Check if user has specific role
   - Returns boolean
   - Security definer (bypasses RLS)

2. **`is_admin(user_id)`**
   - Check if user is admin OR super_admin
   - Returns boolean
   - Used in admin panels

3. **`is_super_admin(user_id)`**
   - Check if user is super_admin only
   - Returns boolean
   - Used for critical operations

### Permission Matrix

| Feature | User | Admin | Super Admin |
|---------|------|-------|-------------|
| Browse Products | ✅ | ✅ | ✅ |
| Add to Cart | ✅ | ✅ | ✅ |
| Place Orders | ✅ | ✅ | ✅ |
| View Own Orders | ✅ | ✅ | ✅ |
| Update Own Profile | ✅ | ✅ | ✅ |
| Access Admin Dashboard | ❌ | ✅ | ✅ |
| Manage Products | ❌ | ✅ | ✅ |
| Manage Orders | ❌ | ✅ | ✅ |
| View All Users | ❌ | ✅ | ✅ |
| Manage Hero Slides | ❌ | ✅ | ✅ |
| Manage User Roles | ❌ | ❌ | ✅ |
| Manage Team Members | ❌ | ❌ | ✅ |

### Protected Routes Implementation

**File**: `src/components/ProtectedRoute.tsx`

Routes are protected using role checks:
- `requireAdmin={true}` - Requires admin or super_admin
- `requireSuperAdmin={true}` - Requires super_admin only

---

## Database Schema

### Tables

#### 1. **profiles**
User profile information
```sql
id                uuid (PK, FK to auth.users)
name              text
phone             text
avatar_url        text
address           jsonb
created_at        timestamp
updated_at        timestamp
```

**RLS Policies:**
- Users can view their own profile
- Users can update their own profile
- Admins can view all profiles

#### 2. **user_roles**
User role assignments
```sql
id                uuid (PK)
user_id           uuid (FK to auth.users)
role              app_role enum
created_at        timestamp

UNIQUE(user_id, role)
```

**RLS Policies:**
- Users can view their own roles
- Admins can view all roles
- Super admins can manage all roles

#### 3. **products**
Product catalog
```sql
id                uuid (PK)
name              text
description       text
price             numeric
category          text
stock             integer
image_url         text
is_featured       boolean
created_at        timestamp
updated_at        timestamp
```

**RLS Policies:**
- Anyone can view products
- Admins can manage products

#### 4. **orders**
Customer orders
```sql
id                uuid (PK)
user_id           uuid (FK to auth.users)
items             jsonb
total             numeric
status            text
shipping_address  jsonb
created_at        timestamp
updated_at        timestamp
```

**RLS Policies:**
- Users can create their own orders
- Users can view their own orders
- Admins can view all orders
- Admins can update order status

#### 5. **hero_slides**
Homepage hero carousel
```sql
id                uuid (PK)
title             text
subtitle          text
image_url         text
cta_text          text
cta_link          text
order_index       integer
is_active         boolean
created_at        timestamp
updated_at        timestamp
```

**RLS Policies:**
- Anyone can view active slides
- Admins can manage all slides

### Database Functions

1. **`handle_new_user()`**
   - Trigger function on user signup
   - Creates profile entry
   - Assigns default 'user' role

2. **`handle_updated_at()`**
   - Updates timestamp on record changes

### Storage Buckets

1. **product-images** (Public)
   - Product photos
   - Admin upload access

2. **hero-media** (Public)
   - Hero slider images
   - Admin upload access

---

## Application Features & Flows

### 1. Product Browsing Flow
```
Homepage → Featured Products displayed
    ↓
User clicks "Shop Now" → /products page
    ↓
Products loaded from database (with RLS filtering)
    ↓
User clicks product → /products/:id
    ↓
Product details, add to cart option
```

**Files:**
- `src/pages/Index.tsx` - Homepage
- `src/pages/Products.tsx` - Product listing
- `src/pages/ProductDetail.tsx` - Single product
- `src/components/ProductCard.tsx` - Product card UI
- `src/components/FeaturedProducts.tsx` - Featured section

### 2. Shopping Cart Flow
```
User adds product to cart → Zustand store updated
    ↓
Cart icon shows item count
    ↓
User clicks cart → CartDrawer opens
    ↓
Shows cart items, quantities, total
    ↓
User clicks "Checkout" → /checkout
```

**Files:**
- `src/store/cart.ts` - Cart state management
- `src/components/CartDrawer.tsx` - Cart UI
- `src/pages/Checkout.tsx` - Checkout page

### 3. Order Placement Flow
```
User at checkout → Fills shipping info
    ↓
Validates form data
    ↓
Creates order in database (orders table)
  - user_id: Current user
  - items: Cart items (jsonb)
  - total: Calculated total
  - shipping_address: Form data
  - status: 'pending'
    ↓
Cart cleared → Order confirmation
    ↓
User redirected to /orders
```

**Files:**
- `src/pages/Checkout.tsx` - Checkout form
- `src/pages/Orders.tsx` - Order history

### 4. Profile Management Flow
```
User clicks profile dropdown → "Profile Settings"
    ↓
Navigates to /profile
    ↓
Shows current profile data:
  - Name
  - Email
  - Phone
  - Address
  - Avatar
    ↓
User updates fields → Submits
    ↓
Updates profiles table
    ↓
Auth store refreshes profile data
    ↓
Navigation updates with new info
```

**Files:**
- `src/pages/Profile.tsx` - Profile page
- `src/lib/auth.ts` - `updateProfile()` function

### 5. Wishlist Flow
```
User clicks heart icon on product
    ↓
Product added to wishlist (localStorage)
    ↓
User navigates to /wishlist
    ↓
Shows saved products
    ↓
User can remove items or add to cart
```

**Files:**
- `src/pages/Wishlist.tsx` - Wishlist page

---

## Admin Features

### Admin Dashboard (`/admin`)
Central hub for admin operations

**Files:**
- `src/pages/admin/Dashboard.tsx`
- Protected with `requireAdmin={true}`

**Features:**
- Overview statistics
- Quick actions
- Recent orders
- Analytics preview

### Product Management (`/admin/products`)

**Flow:**
```
Admin navigates to Products → Lists all products
    ↓
Admin clicks "Add Product" → Form opens
    ↓
Admin fills:
  - Name
  - Description
  - Price
  - Category
  - Stock
  - Image (upload to storage)
  - Featured flag
    ↓
Submits → Product created in database
    ↓
List refreshes
```

**Edit/Delete:**
```
Admin clicks edit → Form pre-filled
    ↓
Updates fields → Submits → Product updated
    ↓
Admin clicks delete → Confirmation → Product deleted
```

**Files:**
- `src/pages/admin/Products.tsx`
- `src/components/admin/ImageUpload.tsx`

### Order Management (`/admin/orders`)

**Flow:**
```
Admin navigates to Orders → Lists all orders
    ↓
Shows for each order:
  - Order ID
  - Customer name
  - Items
  - Total
  - Status
  - Date
    ↓
Admin can update status:
  - pending
  - processing
  - shipped
  - delivered
  - cancelled
    ↓
Status updated in database
    ↓
Customer sees updated status in /orders
```

**Files:**
- `src/pages/admin/Orders.tsx`

### User Management (`/admin/users`)

**Flow:**
```
Admin navigates to Users → Lists all users
    ↓
Shows for each user:
  - Name
  - Email
  - Roles
  - Registration date
    ↓
Admin can view user details
Admin can view user's orders
```

**Files:**
- `src/pages/admin/Users.tsx`

### Team Management (`/admin/team`)
**Requires**: `super_admin` role

**Flow:**
```
Super admin navigates to Team → Lists all admins
    ↓
Super admin clicks "Add Admin"
    ↓
Selects user from dropdown
    ↓
Assigns role: admin or super_admin
    ↓
User_roles table updated
    ↓
User now has admin access
    ↓
Super admin can remove admin roles
```

**Files:**
- `src/pages/admin/TeamManagement.tsx`

### Permission Management (`/admin/permissions`)
**Requires**: `super_admin` role

**Flow:**
```
Super admin navigates to Permissions
    ↓
Views role-permission matrix
    ↓
Can grant/revoke permissions
    ↓
Updates user_roles table
```

**Files:**
- `src/pages/admin/PermissionManagement.tsx`

### Hero Slider Management (`/admin/hero-slider`)

**Flow:**
```
Admin navigates to Hero Slider → Lists all slides
    ↓
Admin clicks "Add Slide"
    ↓
Fills form:
  - Title
  - Subtitle
  - Image (upload)
  - CTA text
  - CTA link
  - Order index
  - Active toggle
    ↓
Submits → Slide created
    ↓
Appears on homepage carousel (if active)
    ↓
Admin can edit/delete/reorder slides
```

**Files:**
- `src/pages/admin/HeroSlider.tsx`

### Analytics (`/admin/analytics`)

**Flow:**
```
Admin navigates to Analytics
    ↓
Shows charts and metrics:
  - Total sales
  - Orders over time
  - Top products
  - User registrations
    ↓
Data fetched from orders table
    ↓
Visualized with Recharts
```

**Files:**
- `src/pages/admin/Analytics.tsx`

---

## Database Migration Guide

### Scenario: Moving to a New Database

#### Prerequisites
- New Lovable Cloud project OR Supabase project
- Database credentials ready
- Backup of current data

---

### Step 1: Export Current Data

**Export each table:**

```sql
-- Export profiles
COPY (SELECT * FROM profiles) TO '/tmp/profiles.csv' CSV HEADER;

-- Export user_roles
COPY (SELECT * FROM user_roles) TO '/tmp/user_roles.csv' CSV HEADER;

-- Export products
COPY (SELECT * FROM products) TO '/tmp/products.csv' CSV HEADER;

-- Export orders
COPY (SELECT * FROM orders) TO '/tmp/orders.csv' CSV HEADER;

-- Export hero_slides
COPY (SELECT * FROM hero_slides) TO '/tmp/hero_slides.csv' CSV HEADER;
```

**Or use Lovable Cloud UI:**
1. Open backend (Cloud tab)
2. Navigate to Database → Tables
3. Select each table
4. Click Export button
5. Download CSV

---

### Step 2: Set Up New Database Schema

**Run these migrations in order:**

#### 2.1: Create Enum
```sql
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');
```

#### 2.2: Create Tables

**profiles table:**
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**user_roles table:**
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

**products table:**
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**orders table:**
```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**hero_slides table:**
```sql
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 2.3: Create Functions

**Security functions:**
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;
```

**Utility functions:**
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;
```

#### 2.4: Create Triggers

```sql
-- Auto-update timestamps
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### 2.5: Enable RLS

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
```

#### 2.6: Create RLS Policies

**profiles policies:**
```sql
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin(auth.uid()));
```

**user_roles policies:**
```sql
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (is_super_admin(auth.uid()));
```

**products policies:**
```sql
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (is_admin(auth.uid()));
```

**orders policies:**
```sql
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (is_admin(auth.uid()));
```

**hero_slides policies:**
```sql
CREATE POLICY "Anyone can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  USING (is_admin(auth.uid()));
```

---

### Step 3: Create Storage Buckets

**Using Supabase Dashboard or SQL:**

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('hero-media', 'hero-media', true);

-- Create storage policies
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('product-images', 'hero-media'));

CREATE POLICY "Admins can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('product-images', 'hero-media')
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admins can update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('product-images', 'hero-media')
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('product-images', 'hero-media')
    AND is_admin(auth.uid())
  );
```

---

### Step 4: Migrate Users

**Important:** User migration requires special handling because `auth.users` is managed by Supabase.

**Option A: Users Re-register**
- Simplest approach
- Users create new accounts in new database
- Profiles auto-created via trigger
- **Drawback:** Loses existing user data

**Option B: Manual User Migration**
```sql
-- Export users from old database
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at
FROM auth.users;

-- In new database, insert into auth.users
-- (Requires admin access to auth schema)
```

**Option C: API Migration**
- Use Supabase Admin API to create users
- Requires service_role key
- Can preserve user IDs if needed

---

### Step 5: Import Data

**Import in this order to respect foreign keys:**

1. **Users** (if migrating manually)
2. **Profiles**
3. **User Roles**
4. **Products**
5. **Orders**
6. **Hero Slides**

**Using SQL:**
```sql
-- Import profiles
COPY profiles FROM '/tmp/profiles.csv' CSV HEADER;

-- Import user_roles
COPY user_roles FROM '/tmp/user_roles.csv' CSV HEADER;

-- Import products
COPY products FROM '/tmp/products.csv' CSV HEADER;

-- Import orders
COPY orders FROM '/tmp/orders.csv' CSV HEADER;

-- Import hero_slides
COPY hero_slides FROM '/tmp/hero_slides.csv' CSV HEADER;
```

---

### Step 6: Migrate Storage Files

**For each bucket:**

1. Download all files from old storage:
```bash
# Using Supabase CLI
supabase storage download product-images/* ./backup/product-images/
supabase storage download hero-media/* ./backup/hero-media/
```

2. Upload to new storage:
```bash
# Using Supabase CLI
supabase storage upload product-images ./backup/product-images/*
supabase storage upload hero-media ./backup/hero-media/*
```

**Or use storage API:**
```javascript
// Script to migrate files
const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

const files = await oldSupabase.storage.from('product-images').list();

for (const file of files) {
  const { data } = await oldSupabase.storage
    .from('product-images')
    .download(file.name);
  
  await newSupabase.storage
    .from('product-images')
    .upload(file.name, data);
}
```

---

### Step 7: Update Application Configuration

**If using Lovable Cloud:**
- Project automatically configured
- No code changes needed

**If using external Supabase:**

Update `.env` file (or create new one):
```env
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key
VITE_SUPABASE_PROJECT_ID=your-new-project-id
```

**Update `src/integrations/supabase/client.ts`:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

### Step 8: Assign Admin Roles

**Create initial super admin:**

```sql
-- Get user ID (replace email)
SELECT id FROM auth.users WHERE email = 'bushra@example.com';

-- Assign super_admin role
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'super_admin')
ON CONFLICT DO NOTHING;
```

---

### Step 9: Test Everything

**Testing Checklist:**

- [ ] User can sign up
- [ ] User can sign in
- [ ] Profile created automatically
- [ ] User role assigned automatically
- [ ] Navigation shows user info after login
- [ ] User can view products
- [ ] User can add to cart
- [ ] User can place order
- [ ] User can view their orders
- [ ] User can update profile
- [ ] Admin can access admin dashboard
- [ ] Admin can manage products
- [ ] Admin can manage orders
- [ ] Admin can view users
- [ ] Super admin can manage team
- [ ] Super admin can assign roles
- [ ] Hero slider displays correctly
- [ ] Image uploads work
- [ ] All RLS policies working correctly

---

### Step 10: Configure OAuth (if used)

**Google OAuth:**
1. Go to Google Cloud Console
2. Update authorized redirect URIs:
   - Add: `https://your-new-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Secret
4. In new Supabase project:
   - Authentication → Providers → Google
   - Enter Client ID and Secret
   - Enable Google provider

**Facebook OAuth:**
1. Go to Facebook Developers
2. Update OAuth redirect URIs:
   - Add: `https://your-new-project.supabase.co/auth/v1/callback`
3. Copy App ID and Secret
4. In new Supabase project:
   - Authentication → Providers → Facebook
   - Enter App ID and Secret
   - Enable Facebook provider

---

### Step 11: Configure Email Settings

**For production:**

1. In Supabase project settings
2. Authentication → Email Templates
3. Configure SMTP (or use Supabase default)
4. Update email templates
5. Enable email confirmations (or disable for testing)

---

## Quick Reference

### Common Queries

**Get user with roles:**
```sql
SELECT 
  u.id,
  u.email,
  p.name,
  p.phone,
  array_agg(ur.role) as roles
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.id = 'user-uuid'
GROUP BY u.id, u.email, p.name, p.phone;
```

**Get all orders with user info:**
```sql
SELECT 
  o.*,
  p.name as customer_name,
  p.phone as customer_phone
FROM orders o
JOIN profiles p ON p.id = o.user_id
ORDER BY o.created_at DESC;
```

**Get featured products:**
```sql
SELECT * FROM products
WHERE is_featured = true
ORDER BY created_at DESC;
```

### Important Files Reference

**Authentication:**
- `src/lib/auth.ts` - Auth service functions
- `src/store/auth.ts` - Auth state management
- `src/pages/Auth.tsx` - Login/signup UI
- `src/components/ProtectedRoute.tsx` - Route protection

**Admin:**
- `src/pages/admin/*.tsx` - All admin pages
- `src/components/admin/*.tsx` - Admin components

**E-commerce:**
- `src/store/cart.ts` - Shopping cart state
- `src/components/CartDrawer.tsx` - Cart UI
- `src/pages/Checkout.tsx` - Checkout process
- `src/pages/Orders.tsx` - Order history

**UI Components:**
- `src/components/*.tsx` - Main components
- `src/components/ui/*.tsx` - Shadcn UI components

---

## Support & Troubleshooting

### Common Issues

**1. "Row violates RLS policy" error**
- Check user is authenticated
- Verify user has required role
- Check RLS policy conditions

**2. User can't access admin pages**
- Check user_roles table for admin/super_admin role
- Verify `is_admin()` function working
- Check ProtectedRoute implementation

**3. Profile not created on signup**
- Check trigger `on_auth_user_created` exists
- Verify function `handle_new_user()` working
- Check profiles table constraints

**4. Images not uploading**
- Check storage bucket exists
- Verify storage policies
- Check admin role assigned

**5. OAuth not working**
- Verify redirect URIs match exactly
- Check provider credentials
- Enable provider in Supabase auth settings

---

## Maintenance Tasks

### Regular Tasks

**Daily:**
- Monitor error logs
- Check order statuses

**Weekly:**
- Review user signups
- Update product inventory
- Process completed orders

**Monthly:**
- Backup database
- Review storage usage
- Audit user roles
- Update hero slides
- Review analytics

### Database Maintenance

**Backup script:**
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
pg_dump $DATABASE_URL > backup_$DATE.sql
```

**Monitor table sizes:**
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## End of Report

**Document Version:** 1.0
**Last Updated:** 2025
**Project:** Bushra's Collection
**Stack:** React + TypeScript + Lovable Cloud (Supabase)
