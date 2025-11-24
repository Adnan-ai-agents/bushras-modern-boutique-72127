# ⚡ Quick Start - 3 Commands Only!

## 🎯 Goal
Set up fresh Supabase database with **ONE migration file** and automated backups.

---

## 📋 Prerequisites
1. ✅ Supabase account created
2. ✅ New project created in Supabase
3. ✅ Credentials copied to `.env`:
   - Go to: Project Settings → API
   - Copy: `URL`, `anon/public key`, `service_role key`
   - Add to `.env` file

---

## 🚀 Setup (Choose One Method)

### Method 1: Supabase CLI (Recommended)
```bash
# 1. Install CLI (one-time)
npm install -g supabase

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref YOUR_PROJECT_ID

# 4. Push migration
supabase db push
```

**Done!** Database is ready. ✓

---

### Method 2: SQL Editor (Manual)
```bash
# 1. Copy this file content:
cat SINGLE_INIT.sql

# 2. Open Supabase Dashboard → SQL Editor
# 3. Paste content and click "Run"
```

**Done!** Database is ready. ✓

---

## 👤 Make Yourself Admin

```sql
-- In SQL Editor, run:

-- 1. Sign up in your app first

-- 2. Find your user ID
SELECT id, email FROM auth.users;

-- 3. Add admin role (replace YOUR_USER_ID)
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
```

**Done!** You're now admin. ✓

---

## 🔄 Setup Automated Backups

```bash
# Test backup
npm run backup

# Setup daily backup (Linux/Mac)
crontab -e
# Add this line:
0 2 * * * cd /path/to/project && npm run backup
```

**Done!** Backups automated. ✓

---

## ✅ Verify Setup

1. **Test Auth:**
   - Visit `/auth` page
   - Sign up with email
   - Should create profile automatically

2. **Test Admin:**
   - Visit `/admin`
   - Should see admin dashboard

3. **Test Products:**
   - Add a product
   - Upload image
   - Should work without errors

**All working?** Setup complete! 🎉

---

## 📁 What Was Created

**Single Migration File:**
- `SINGLE_INIT.sql` (432 lines)
- Replaces 19 separate migrations
- Complete schema in one place

**Automated Scripts:**
- `scripts/setup.js` - Setup helper
- `scripts/backup.js` - Auto backups

**Documentation:**
- `SETUP-GUIDE.md` - Detailed guide
- `AUTO-SETUP-CHECKLIST.md` - Step-by-step
- `BACKUP-GUIDE.md` - Backup strategies
- `scripts/README.md` - Script docs

---

## 🆘 Having Issues?

**Migration fails:**
- Check if tables already exist
- Drop existing tables first
- Or start with fresh database

**Can't access admin panel:**
- Did you add admin role?
- Sign out and sign in again
- Check browser console for errors

**Backup script fails:**
- Run: `npm install dotenv`
- Check .env has correct credentials
- Ensure `backups/` folder exists

**More help:**
- See `SETUP-GUIDE.md` for details
- Check `scripts/README.md` for script help

---

## 🎓 Next Steps

1. ✅ **Customize products**
   - Go to `/admin/products`
   - Add your actual products

2. ✅ **Configure payment**
   - Go to `/admin/payment-methods`
   - Update contact info

3. ✅ **Update hero slides**
   - Go to `/admin/hero-slider`
   - Add your images/videos

4. ✅ **Deploy to production**
   - See `SETUP-GUIDE.md` → Production section

---

**Total Time:** ~5 minutes  
**Files Changed:** 1 (SINGLE_INIT.sql)  
**Manual Steps:** 3 (credentials, migration, admin role)  
**Automated:** Everything else!
