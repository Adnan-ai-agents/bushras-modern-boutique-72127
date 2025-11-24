# 🚀 New Database Setup Guide - Super Simple!

## What This Does
This app will **automatically setup a new Supabase database** when you provide credentials in `.env`. No manual SQL needed!

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: Bushras Collection
   - **Database Password**: (create a strong password, save it!)
   - **Region**: Choose closest to you
4. Click "Create Project" (takes 2-3 minutes)

### Step 2: Get Your Credentials
1. In Supabase Dashboard → **Settings** → **API**
2. Copy these 3 values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Project ID** (just the xxxxx part)
   - **anon/public key** (long JWT token starting with `eyJ...`)

### Step 3: Update .env File
Open `.env` file in your project and replace these lines:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your-key-here
VITE_SUPABASE_PROJECT_ID=xxxxx
```

**That's it!** The app will auto-setup the database on first run.

---

## 🎯 What Happens Automatically

When you start the app with new credentials, it will:
1. ✅ Create all database tables (products, orders, profiles, etc.)
2. ✅ Set up security policies (Row Level Security)
3. ✅ Create admin role system
4. ✅ Set up storage buckets for images
5. ✅ Create database indexes for performance
6. ✅ Add triggers for auto-profile creation

---

## 📊 Database Tables Created

### Core Tables:
- **profiles** - User profiles (name, phone, address, avatar)
- **user_roles** - User roles (user, admin, super_admin)
- **products** - Product catalog
- **orders** - Customer orders
- **payment_methods** - Payment options
- **hero_slides** - Homepage carousel

### Storage Buckets:
- **product-images** - Product photos (public)
- **hero-media** - Hero slider images (public)

---

## 👤 Making Yourself Admin

### Option 1: Via Supabase SQL Editor
1. In Supabase Dashboard → **SQL Editor**
2. Create new query
3. Run this (replace with your email):

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Copy the ID from above, then run:
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Option 2: Via Table Editor
1. Sign up in your app first
2. In Supabase Dashboard → **Table Editor** → **user_roles**
3. Click "Insert row"
4. Fill in:
   - **user_id**: Your ID from auth.users table
   - **role**: Select `admin`
5. Save

---

## 🔐 Security Checklist

### Required Steps:
- [ ] **Disable Email Confirmation** (for testing):
  - Go to **Authentication** → **Providers** → **Email**
  - Turn OFF "Confirm email"
  - Click Save

- [ ] **Set Site URL**:
  - Go to **Authentication** → **URL Configuration**
  - Set **Site URL**: Your app URL
  - Add **Redirect URLs**: 
    - `https://your-app.com/*`
    - `http://localhost:5173/*` (for local dev)

- [ ] **Never commit .env to Git**:
  - .env is already in .gitignore ✅
  - Never share your keys publicly

---

## 🧪 Testing Your Setup

### 1. Test Authentication
```bash
npm run dev
# Open http://localhost:8080
```
- [ ] Visit `/auth` page
- [ ] Sign up with email/password
- [ ] Check profile created (Supabase → Table Editor → profiles)
- [ ] Default 'user' role assigned (check user_roles table)

### 2. Test Admin Access
- [ ] Make yourself admin (see above)
- [ ] Sign in again
- [ ] Visit `/admin` - should work!
- [ ] Try uploading product image

### 3. Test Guest Flow
- [ ] Sign out
- [ ] Browse products
- [ ] Add to cart
- [ ] Cart persists after refresh

---

## 🔄 Automatic Backup System

### Enable Auto Backups
1. Supabase Dashboard → **Database** → **Backups**
2. Enable daily automatic backups (Free on Pro plan)
3. Backups retained for 7 days

### Manual Backup (Recommended Weekly)
1. Go to **Table Editor**
2. Select table → **Export** → Download CSV
3. Repeat for: products, orders, profiles, user_roles
4. Save to external storage (Google Drive, etc.)

See `BACKUP-GUIDE.md` for detailed backup strategies.

---

## ❓ Troubleshooting

### "Failed to create table"
- Make sure database password is correct in Supabase
- Check if tables already exist (Table Editor)
- Try running migrations manually from `supabase/migrations/` folder

### "Can't upload images"
Run this SQL in SQL Editor:
```sql
-- Copy from STORAGE-FIX.sql and run
```
Or just run the entire `STORAGE-FIX.sql` file.

### "Can't access admin panel"
- Make sure you added admin role to user_roles table
- Sign out and sign in again
- Check browser console for errors

### "Auth redirect to localhost"
- Update Site URL in Supabase (see Security Checklist)
- Add all your domains to Redirect URLs

---

## 🎨 Customization

### Change App Name
- Update `index.html` → `<title>` tag
- Update homepage text in `src/pages/Index.tsx`

### Change Colors
- Edit `src/index.css` → CSS variables
- Edit `tailwind.config.ts` → theme colors

### Add Products
- Sign in as admin
- Go to `/admin/products`
- Click "Add Product"
- Upload images, fill details, save

---

## 📁 Important Files

**Don't Edit These:**
- `src/integrations/supabase/client.ts` - Auto-generated
- `src/integrations/supabase/types.ts` - Auto-generated
- `.env` - Configured (only edit credentials)
- `supabase/config.toml` - Auto-configured

**Migration Files:**
- All SQL in `supabase/migrations/` runs automatically
- Migrations run in order by timestamp
- Never edit old migrations (create new ones)

**Helper Files:**
- `STORAGE-FIX.sql` - Fix image upload issues
- `BACKUP-GUIDE.md` - Backup strategies

---

## 🚀 Deploying to Production

1. **Push to GitHub**:
```bash
git add .
git commit -m "Setup complete"
git push origin main
```

2. **Deploy to Vercel** (Easiest):
   - Connect GitHub repo
   - Add environment variables from .env
   - Click Deploy
   - Update Site URL in Supabase to your Vercel URL

3. **Production Checklist**:
   - [ ] Enable email confirmation in Supabase
   - [ ] Update all Site URLs and Redirect URLs
   - [ ] Test auth flow on production domain
   - [ ] Make yourself admin on production DB
   - [ ] Add real products

---

## ✅ Summary

**Setup Time**: ~10 minutes
**Manual Steps**: 3 (Create project, copy credentials, make admin)
**Auto Steps**: Everything else!

The app handles:
- ✅ Database table creation
- ✅ Security policies
- ✅ Triggers and functions
- ✅ Storage setup
- ✅ Indexes for performance

You only need to:
1. Create Supabase project
2. Update .env file
3. Make yourself admin
4. Start building!

---

**Need Help?**
- Check Supabase SQL Editor for migration errors
- Check browser console for frontend errors
- Review `BACKUP-GUIDE.md` for data management
