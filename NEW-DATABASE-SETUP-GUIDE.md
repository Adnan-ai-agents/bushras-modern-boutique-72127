# New Database Setup Guide for Beginners

## 🎯 Overview
This guide helps you migrate from the current Lovable Cloud database to your own Supabase project.

---

## 📋 Step 1: Create Your Own Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: `bushras-collection` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup to complete

---

## 🔑 Step 2: Get Your Database Credentials

After project is created, go to **Project Settings** → **API**

You'll need these 3 values:
```
1. Project URL (looks like: https://xxxxx.supabase.co)
2. Anon/Public Key (long string starting with eyJ...)
3. Service Role Key (long string starting with eyJ... - keep this secret!)
```

**⚠️ NEVER commit these to GitHub or share publicly!**

---

## 🗄️ Step 3: Set Up Database Tables

### Option A: Using SQL Editor (Recommended)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and run these migrations **in order**:

#### First: Run this migration
```sql
-- From: CLEAN-DATABASE-RESET.sql
-- Copy the entire contents of that file and run it
```

#### Second: Run admin permissions
```sql
-- From: admin-permissions-migration.sql
-- Copy the entire contents of that file and run it
```

#### Third: Run complete setup
```sql
-- From: database-complete-setup.sql
-- Copy the entire contents of that file and run it
```

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

---

## 📁 Step 4: Set Up Storage Buckets

In Supabase Dashboard, go to **Storage**

### Create These Buckets:

1. **product-images**
   - Click **"New bucket"**
   - Name: `product-images`
   - Public bucket: ✅ YES
   - Click **"Create bucket"**

2. **hero-media**
   - Click **"New bucket"**
   - Name: `hero-media`
   - Public bucket: ✅ YES
   - Click **"Create bucket"**

---

## 🔐 Step 5: Configure Authentication

In Supabase Dashboard, go to **Authentication** → **Settings**

### Email Auth Settings:
- ✅ Enable email provider
- ✅ Enable "Confirm email" (turn OFF for development)
- ✅ Enable "Auto-confirm email" (turn ON for development)

### Site URL:
- Development: `http://localhost:5173`
- Production: Your deployed URL

### Redirect URLs (Add all of these):
```
http://localhost:5173/**
http://localhost:8080/**
https://your-app.lovable.app/**
https://your-custom-domain.com/** (if you have one)
```

---

## 🛠️ Step 6: Update Your Code (Remove Hardcoded Values)

### ⚠️ CRITICAL: Files to Update

#### 1. Update `.env` file
**Location**: Root directory

**Current (hardcoded - BAD ❌):**
```env
VITE_SUPABASE_URL="https://htywmazgmcqwwwjvcigw.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
```

**New (your values - GOOD ✅):**
```env
VITE_SUPABASE_URL="https://YOUR-PROJECT-ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR-ANON-KEY-HERE"
VITE_SUPABASE_PROJECT_ID="YOUR-PROJECT-ID"
```

#### 2. Update Supabase Client
**Location**: `src/integrations/supabase/client.ts`

**Current (hardcoded - BAD ❌):**
```typescript
const SUPABASE_URL = "https://htywmazgmcqwwwjvcigw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGc...";
```

**New (use env vars - GOOD ✅):**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}
```

#### 3. Update Config (if using Edge Functions)
**Location**: `supabase/config.toml`

**Update project_id:**
```toml
project_id = "YOUR-NEW-PROJECT-ID"
```

---

## 👥 Step 7: Assign Admin Role to Yourself

### Option A: Using SQL Editor

1. First, sign up in your app to create your account
2. Go to **Authentication** → **Users** in Supabase Dashboard
3. Copy your **User ID** (UUID)
4. Go to **SQL Editor** and run:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Option B: Using Table Editor

1. Go to **Table Editor** → **user_roles**
2. Click **"Insert row"**
3. Fill in:
   - `user_id`: Your user UUID from Authentication page
   - `role`: `super_admin`
4. Click **"Save"**
5. Repeat for `admin` role

---

## 🧪 Step 8: Test Everything

### ✅ Checklist:

1. **Authentication**
   - [ ] Sign up new user
   - [ ] Sign in existing user
   - [ ] Sign out
   - [ ] Password reset

2. **User Features**
   - [ ] Browse products
   - [ ] Add to cart
   - [ ] Checkout
   - [ ] View orders
   - [ ] Update profile

3. **Admin Features** (after assigning admin role)
   - [ ] Access admin dashboard
   - [ ] Create product
   - [ ] Upload product image
   - [ ] View all orders
   - [ ] Update order status
   - [ ] Manage payment methods

4. **Database**
   - [ ] Products load correctly
   - [ ] Orders save correctly
   - [ ] Images upload to storage
   - [ ] User profiles work

---

## 🚨 Security Checklist

### ❌ NEVER Do This:

1. **Never hardcode credentials in code files:**
   ```typescript
   // BAD - Never do this!
   const API_KEY = "sk_live_123456789";
   const DATABASE_URL = "https://mydb.supabase.co";
   ```

2. **Never commit `.env` to Git:**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates

3. **Never share Service Role Key:**
   - Only use server-side (Edge Functions)
   - Never in frontend code

4. **Never store passwords in plain text**

5. **Never expose user emails publicly**

### ✅ ALWAYS Do This:

1. **Use environment variables:**
   ```typescript
   // GOOD
   const API_KEY = import.meta.env.VITE_API_KEY;
   ```

2. **Use Row Level Security (RLS):**
   - All tables have RLS enabled
   - Policies control data access

3. **Validate input:**
   - Use Zod schemas for validation
   - Sanitize user input

4. **Use proper authentication:**
   - Check auth state server-side
   - Don't trust client-side checks

---

## 📦 Step 9: Deploy Your App

### For Vercel:

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```
3. Deploy!

### For Netlify:

1. Connect GitHub repo to Netlify
2. Add environment variables in Netlify dashboard
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy!

---

## 🔄 Migration Checklist

When migrating from old DB to new DB:

- [ ] Export data from old database
- [ ] Set up new Supabase project
- [ ] Run all migrations in order
- [ ] Create storage buckets
- [ ] Configure authentication
- [ ] Update `.env` file
- [ ] Update `client.ts` file
- [ ] Import data to new database
- [ ] Assign admin roles
- [ ] Test all features
- [ ] Update production environment variables
- [ ] Deploy to production

---

## 🆘 Common Issues & Solutions

### Issue: "Invalid API key"
**Solution**: Check that your anon key is correct in `.env` file

### Issue: "Row Level Security policy violation"
**Solution**: 
1. Make sure you're signed in
2. Check RLS policies in Supabase Dashboard
3. Verify admin role is assigned

### Issue: "Cannot read properties of null"
**Solution**: Authentication might not be initialized yet, add loading states

### Issue: Images not loading
**Solution**: 
1. Check storage bucket is public
2. Verify images uploaded to correct bucket
3. Check image URLs are correct

### Issue: Can't access admin pages
**Solution**:
1. Verify you're logged in
2. Check user_roles table has your admin role
3. Clear browser cache and try again

---

## 📚 Files Reference

**Files You MUST Update:**
- `.env` - Environment variables
- `src/integrations/supabase/client.ts` - Supabase client config
- `supabase/config.toml` - Supabase project config

**Migration Files (Run in Order):**
1. `CLEAN-DATABASE-RESET.sql`
2. `admin-permissions-migration.sql`
3. `database-complete-setup.sql`

**Security Files to Review:**
- `src/components/ProtectedRoute.tsx` - Route protection
- `src/store/auth.ts` - Auth state management
- `src/lib/auth.ts` - Auth service

---

## 🎓 Key Security Principles for Beginners

1. **Environment Variables** = Configuration that changes per environment
   - Development: localhost URLs
   - Production: real domain URLs

2. **Never trust the client** = Always validate on server
   - Use RLS policies
   - Use Supabase Auth
   - Validate with Zod schemas

3. **Secrets stay secret** = Never expose in code
   - API keys go in `.env`
   - Add `.env` to `.gitignore`
   - Use different keys for dev/prod

4. **Least privilege** = Give minimum permissions needed
   - Regular users can only see their data
   - Admins can manage products/orders
   - Super admins can manage users

---

## ✅ You're Done!

Your database is now properly configured with:
- ✅ Secure environment variables (no hardcoded values)
- ✅ Proper authentication
- ✅ Row Level Security policies
- ✅ Admin role system
- ✅ Storage buckets
- ✅ All necessary tables

**Next Steps:**
1. Test everything thoroughly
2. Add your own products
3. Configure payment methods
4. Deploy to production
5. Monitor for errors

**Need Help?**
- Check Supabase docs: [docs.supabase.com](https://supabase.com/docs)
- Review error messages in browser console
- Check Supabase Dashboard logs
