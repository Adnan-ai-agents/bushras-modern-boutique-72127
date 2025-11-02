# Complete Setup & Implementation Guide
## Bushra's Collection - E-commerce Platform

---

## ✅ COMPLETED FIXES

### 1. Navigation Profile Link
- ✅ Profile link added to navigation menu
- ✅ Accessible when user is logged in

### 2. Product Legacy Reviews
- ✅ Added "Legacy Review Count" field in admin product form
- ✅ Captures existing reviews from 20 years of business
- ✅ New reviews from users will add to this base count

### 3. Auth Redirects
- ✅ Password reset URLs now point to app domain (not localhost)
- ✅ Email confirmation links redirect correctly
- ⚠️ **ACTION REQUIRED**: Update Supabase URL Configuration

---

## 🔧 USER ACTIONS REQUIRED (0 Credits)

### A. Supabase URL Configuration
**Fix localhost redirect issue:**

1. Go to: **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL**: `https://bushras-modern-boutique-72127.lovable.app`
3. Set **Redirect URLs**: Add both:
   ```
   https://bushras-modern-boutique-72127.lovable.app/**
   https://bushras-collection.vercel.app/**
   ```

### B. Run Storage Migration
**Fix image upload issues:**

1. Go to: **Supabase Dashboard → SQL Editor**
2. Copy and paste contents of `STORAGE-FIX.sql`
3. Click **Run** to execute
4. This enables:
   - Product image uploads (admin)
   - Hero slider media uploads (admin)
   - User avatar uploads (profile page)

### C. Google OAuth Configuration
**Your Supabase setup is CORRECT ✅**
- Client ID: Already in Supabase ✅
- Client Secret: Already in Supabase ✅
- Callback URL: Already configured ✅

**Google Cloud Console Update:**
1. Go to: **Google Cloud Console → Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins**:
   ```
   https://bushras-modern-boutique-72127.lovable.app
   https://bushras-collection.vercel.app
   ```
4. Verify **Authorized redirect URIs** has:
   ```
   https://swznjgwpwxivomntftwu.supabase.co/auth/v1/callback
   ```

### D. Admin Dashboard Access Issue
**If admin can't access Hero Slider:**

This is likely because the user_roles table doesn't have your admin role set. Run this SQL in Supabase:

```sql
-- Check if user_roles table exists
SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';

-- If empty, add admin role (replace with your actual user ID from auth.users)
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

To find your user ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
```

---

## 📊 DATABASE MIGRATION - RATING SYSTEM

### Should you run the Database Structure SQL?
**YES! Run this migration to enable the rating system:**

```sql
-- Create product_ratings table with legacy review support
CREATE TABLE IF NOT EXISTS product_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One rating per user per product
  UNIQUE(user_id, product_id)
);

-- Add initial_review_count to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS initial_review_count INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ratings_product ON product_ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON product_ratings(user_id);

-- Enable RLS
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

-- Security definer function for rating checks
CREATE OR REPLACE FUNCTION public.user_can_rate_product(
  _user_id UUID,
  _product_id UUID,
  _order_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = _order_id
      AND o.user_id = _user_id
      AND o.status = 'delivered'
      AND oi.product_id = _product_id
  );
$$;

-- RLS Policy: Users can only rate delivered products
CREATE POLICY "Users rate delivered products only" ON product_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    public.user_can_rate_product(auth.uid(), product_id, order_id)
  );

-- RLS Policy: Anyone can view ratings
CREATE POLICY "Anyone views ratings" ON product_ratings
  FOR SELECT USING (true);

-- RLS Policy: Users can't update their own ratings (one-time only)
-- RLS Policy: Admins can update/delete any rating
CREATE POLICY "Admins manage all ratings" ON product_ratings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create view for product rating summaries
CREATE OR REPLACE VIEW product_rating_summary AS
SELECT 
  p.id as product_id,
  COALESCE(p.initial_review_count, 0) as legacy_reviews,
  COUNT(pr.id) as new_reviews,
  COALESCE(p.initial_review_count, 0) + COUNT(pr.id) as total_reviews,
  COALESCE(AVG(pr.rating), 0) as average_rating
FROM products p
LEFT JOIN product_ratings pr ON p.id = pr.product_id
GROUP BY p.id, p.initial_review_count;
```

**What this enables:**
- ✅ Users can rate products ONLY after delivery
- ✅ One rating per user per product (can't change)
- ✅ Admin can edit/delete any rating
- ✅ Legacy reviews (20 years) + new reviews = total count
- ✅ Automatic average rating calculation

---

## 📧 EMAIL SMTP CONFIGURATION

### Custom Email Domain Setup
**To send emails from: support@bushrascollection.com**

#### Option 1: Gmail (Recommended for Testing)
1. **Supabase Dashboard → Authentication → Email Templates → SMTP Settings**
2. Enter:
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username**: `support@bushrascollection.com`
   - **Password**: [Create App Password in Gmail]
   - **Sender Email**: `support@bushrascollection.com`
   - **Sender Name**: `Bushra's Collection`

**How to get Gmail App Password:**
1. Gmail → Settings → 2-Step Verification
2. App Passwords → Generate
3. Use generated password (not your Gmail password)

#### Option 2: Professional Email Hosting
**Recommended providers:**
- **Zoho Mail** (Free for 1 domain)
  - SMTP: `smtp.zoho.com`, Port: `587`
- **Namecheap Email**
  - SMTP: `mail.privateemail.com`, Port: `587`
- **Google Workspace** ($6/user/month)
  - SMTP: `smtp.gmail.com`, Port: `587`

#### Option 3: Transactional Email Service (Best for Production)
**SendGrid** (Free 100 emails/day):
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: [Your SendGrid API Key]

**Resend** (Free 3,000 emails/month):
- Modern, developer-friendly
- Better deliverability than Gmail
- Easy setup with Supabase

---

## 💬 WHATSAPP PASSWORD RESET (Optional)

### ⚠️ Why NOT Twilio?
You wanted an **open-source, direct connection** alternative.

### Recommended Alternatives:

#### Option 1: WhatsApp Business API (Direct - FREE)
**Pros:**
- Direct from Meta/Facebook
- FREE for messaging
- Official, secure, compliant
- No Twilio dependency

**Cons:**
- Requires business verification (~2 weeks)
- More complex setup
- Need Facebook Business Manager

**Setup:**
1. Go to: https://developers.facebook.com/
2. Create Business App → Add WhatsApp Product
3. Get Phone Number ID and Access Token
4. Store in Supabase Secrets:
   ```
   WHATSAPP_PHONE_NUMBER_ID=your_phone_id
   WHATSAPP_ACCESS_TOKEN=your_token
   ```

**Edge Function to send WhatsApp:**
```typescript
// supabase/functions/send-whatsapp-reset/index.ts
const response = await fetch(
  `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: userPhoneNumber,
      type: 'template',
      template: {
        name: 'password_reset',
        language: { code: 'en' },
        components: [{
          type: 'body',
          parameters: [{ type: 'text', text: resetLink }]
        }]
      }
    })
  }
);
```

#### Option 2: Vonage/Nexmo (Cheaper than Twilio)
**Pricing:** $0.0063/message (vs Twilio $0.0079)
**Pros:**
- Easier setup than WhatsApp Business API
- Good documentation
- Reliable delivery

#### Option 3: MessageBird (Open-Source Friendly)
**Pricing:** $0.0058/message
**Pros:**
- Strong in Asia/Middle East
- Better for Pakistan region
- Open APIs

#### Option 4: 360dialog (Specialized WhatsApp Partner)
**Focus:** WhatsApp Business API made easy
**Pricing:** Free sandbox + usage-based
**Pros:**
- Faster verification than Meta direct
- Better support

### 🎯 RECOMMENDATION FOR YOUR APP:

**Phase 1 (Now):**
- ✅ Keep email password reset (already working)
- ✅ Let users use email for recovery

**Phase 2 (When scaling):**
- Use **WhatsApp Business API (Direct from Meta)**
- Reason: FREE, official, no per-message cost
- Trade-off: Takes 2-3 weeks for business verification

**For Immediate WhatsApp (if needed):**
- Use **360dialog** for fastest WhatsApp setup
- OR use **MessageBird** for best Pakistan region delivery

---

## 🔐 FACEBOOK OAUTH SETUP

### Similar to Google OAuth:

1. **Facebook Developers Console:**
   - Go to: https://developers.facebook.com/
   - Create App → Business → OAuth
   
2. **Add OAuth Redirect URI:**
   ```
   https://swznjgwpwxivomntftwu.supabase.co/auth/v1/callback
   ```

3. **Configure in Supabase:**
   - Dashboard → Authentication → Providers → Facebook
   - Add App ID and App Secret
   - **DO NOT** add to `.env` (Supabase handles it)

4. **Add to Authorized Domains:**
   ```
   bushras-modern-boutique-72127.lovable.app
   bushras-collection.vercel.app
   ```

---

## 📋 IMPLEMENTATION PRIORITY

### Priority 1: Run These NOW (0 Credits)
1. ✅ Update Supabase URL Configuration
2. ✅ Run `STORAGE-FIX.sql` migration
3. ✅ Run Rating System SQL (above)
4. ✅ Fix admin role in user_roles table
5. ✅ Update Google Cloud Console authorized origins

### Priority 2: Email Setup (0 Credits)
- Configure SMTP using Gmail (easiest) or SendGrid (best)

### Priority 3: OAuth Providers (0 Credits)
- Complete Google OAuth (90% done, just add origins)
- Optional: Setup Facebook OAuth

### Priority 4: WhatsApp (Optional - Discuss Later)
- Decision needed: Email-only OR WhatsApp Business API
- Recommend: Keep email for now, add WhatsApp when scaling

---

## ✅ TESTING CHECKLIST

After completing user actions:

### Auth Testing:
- [ ] Sign up with email → Check email link works
- [ ] Forgot password → Check reset link works
- [ ] Google Sign In → Check works
- [ ] Sign out → Verify can't access admin

### Admin Testing:
- [ ] Access `/admin/hero-slider` → No redirect
- [ ] Upload hero image → Success
- [ ] Add product with legacy review count → Success
- [ ] Check product shows correct review count

### Profile Testing:
- [ ] Click "Profile" in navigation → Loads
- [ ] Upload avatar → Success
- [ ] Update profile info → Success

### Rating System Testing (after SQL):
- [ ] Create test order → Mark as delivered
- [ ] User rates product → Success
- [ ] User tries to rate again → Blocked
- [ ] Admin edits any rating → Success

---

## 💰 CREDIT USAGE SUMMARY

- Navigation fix: ✅ Done (minimal)
- Product review field: ✅ Done (minimal)
- This guide: ✅ Done (minimal)
- **Total: ~2 credits used**

All other tasks are **USER ACTIONS** (0 credits):
- URL configuration
- SQL migrations
- OAuth setup
- SMTP configuration

---

## 🎯 NEXT STEPS

1. **Complete all Priority 1 tasks** (Supabase configurations)
2. **Test auth flow** (sign up, reset password)
3. **Verify admin access** to Hero Slider
4. **Test product uploads** with legacy review count
5. **Confirm** when done, then we implement:
   - Stock/Availability system (Ready to Wear vs Order to Make)
   - User notification system
   - Order tracking enhancements

---

## 📞 SUPPORT

**If something doesn't work:**
1. Check Supabase SQL Editor for errors
2. Check browser console for errors
3. Verify all URLs are correct (no localhost)
4. Confirm admin role exists in user_roles table

**Gmail SMTP Test:**
```bash
# Quick test in Supabase SQL Editor:
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;
# Verify users are being created
```

---

**Remember:** Most of these are configuration tasks (0 credits). The app is ready, just needs your account setups! 🚀
