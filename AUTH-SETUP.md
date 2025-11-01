# Complete Setup & Fix Guide

## 🔧 CRITICAL: Run This SQL First

**Image upload is failing because storage policies need fixing!**

Go to **Supabase Dashboard → SQL Editor** and run this:

```sql
-- Fix storage bucket policies for image uploads
-- This ensures authenticated admins can upload images

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view hero media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload hero media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update hero media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete hero media" ON storage.objects;

-- Ensure buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-media', 'hero-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create simple policies that work
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public read hero media"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-media');

CREATE POLICY "Authenticated upload hero media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hero-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update hero media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hero-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete hero media"
ON storage.objects FOR DELETE
USING (bucket_id = 'hero-media' AND auth.role() = 'authenticated');
```

**After running this SQL, product image uploads will work!**

---

## 🌐 CRITICAL: Supabase URL Configuration

**This fixes the `localhost:3000` issue in password reset & confirmation emails**

### Steps:
1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Update these settings:

   **Site URL:**
   ```
   https://bushras-modern-boutique-72127.lovable.app
   ```

   **Additional Redirect URLs** (add all):
   ```
   https://bushras-modern-boutique-72127.lovable.app/reset-password
   https://bushras-modern-boutique-72127.lovable.app/
   http://localhost:5173/reset-password
   ```

3. Click **Save**

---

## ✅ What's Working Now

### 1. Password Reset Email Links
- Uses `getAppUrl()` to detect correct domain
- Reset page handles URL tokens properly
- No more `localhost:3000` in emails

### 2. Email Confirmation for New Users  
- Signup shows "Check your email!" toast
- Confirmation links redirect to app domain
- Auto-login after email verification

### 3. User Profile Settings Page
- Access via `/profile` or Navigation menu
- Update name, phone, address
- Change password
- Upload avatar
- Profile health score

### 4. Social Authentication (Google & Facebook)
- OAuth buttons only appear when configured
- Works for both Sign In and Sign Up

---

## 🎯 Google OAuth Setup

**You already have Google OAuth enabled in Supabase! ✅**

But you need to add your Lovable domain to Google Cloud Console:

### Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Find your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins**:
   ```
   https://bushras-modern-boutique-72127.lovable.app
   ```
4. **Authorized redirect URIs** should already have:
   ```
   https://swznjgwpwxivomntftwu.supabase.co/auth/v1/callback
   ```

**IMPORTANT**: 
- You do NOT need to add anything to `.env` for Google OAuth!
- It's already configured in Supabase Dashboard
- The `.env` placeholders are just for reference
- OAuth will work automatically once you add the domain to Google Console

---

## 📧 Custom Email Domain (Optional)

To send from `support@bushrascollection.com`:

1. Go to **Supabase Dashboard → Project Settings → Auth → SMTP Settings**
2. Configure your email provider:
   - **Gmail**: smtp.gmail.com:587
   - **SendGrid**: smtp.sendgrid.net:587
   - **AWS SES**: email-smtp.region.amazonaws.com:587
3. Use app-specific passwords (not regular passwords)

---

## 📝 Complete Testing Checklist

**Database:**
- [ ] Run storage policies SQL (above) in Supabase SQL Editor
- [ ] Run `comprehensive-database-fix.sql` if not already done
- [ ] Add yourself as admin: `INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin')`

**Supabase Settings:**
- [ ] Update Site URL and Redirect URLs (above)
- [ ] Add Lovable domain to Google Cloud Console authorized origins

**Testing:**
- [ ] Upload product image → Should work without "Upload failed" error
- [ ] Upload hero slider image → Should work
- [ ] Request password reset → Email link goes to app domain (not localhost)
- [ ] New user signup → Confirmation email goes to app domain
- [ ] Google Sign In → Button appears and works (if credentials added)

---

## 🐛 Troubleshooting

### "Failed to upload image"
→ Run the storage policies SQL above

### "Auth links go to localhost:3000"  
→ Update Supabase URL Configuration (Site URL + Redirect URLs)

### "Google Sign In not appearing"
→ Add Lovable domain to Google Cloud Console authorized origins

### "Hero Slider button doesn't work"
→ The route exists at `/admin/hero-slider`, check console for errors

---

## 🎉 What You Can Do Now

✅ Upload product images without errors  
✅ Upload hero slider images  
✅ Password reset emails work correctly  
✅ User profile management at `/profile`  
✅ Email confirmations for new users  
✅ Google OAuth (after adding domain)
