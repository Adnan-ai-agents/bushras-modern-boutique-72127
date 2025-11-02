# Implementation Plan - Pending Tasks

## ✅ COMPLETED (0 Credits)

### 1. Auth Fixes
- ✅ Password reset redirect fixed (URL configuration in Supabase required)
- ✅ Google OAuth configured (Client ID/Secret in Supabase, not .env)
- ✅ Email confirmation flow working

### 2. Storage Fixes
- ✅ `STORAGE-FIX.sql` created for avatar and product image uploads
- ⚠️ **USER ACTION REQUIRED**: Run `STORAGE-FIX.sql` in Supabase SQL Editor

### 3. Profile Page
- ✅ Complete UI exists at `/profile` route
- ✅ Avatar upload functionality implemented
- ⚠️ **USER ACTION REQUIRED**: Run storage migration to enable uploads

---

## 🔧 FIXES APPLIED (Minimal Credits)

### 1. SignOut Bug Fixed
**Problem**: User state persists after signout, admin dashboard still accessible
**Solution**: 
- Updated `Navigation.tsx` to clear auth store on signout
- Added redirect to home page
- Clears user session properly

### 2. Product Card Rating Display
**Problem**: Hardcoded "(24)" showing on all products
**Solution**: 
- Will now display actual review counts from database
- Shows "No reviews" when none exist
- Updates dynamically when reviews are added

---

## 📋 NEW FEATURES TO IMPLEMENT

### 1. Stock/Availability System ⭐
**Requirements**:
- Two product types:
  1. **Ready to Wear** - "In Stock" badge, shows stock quantity
  2. **Made to Order** - "Order to Make" badge, no stock limit

**Database Changes**:
```sql
-- Add availability_type column to products table
ALTER TABLE products ADD COLUMN availability_type TEXT DEFAULT 'ready_to_wear' CHECK (availability_type IN ('ready_to_wear', 'made_to_order'));

-- Add index for filtering
CREATE INDEX idx_products_availability ON products(availability_type);
```

**UI Changes**:
- Admin product form: Radio buttons to select type
- Product cards: Show appropriate badge
- Product detail: Display stock for "ready_to_wear" or "Order to Make" message

**Implementation Files**:
- `src/pages/admin/Products.tsx` - Add availability type selector
- `src/components/ProductCard.tsx` - Show badges based on type
- `src/pages/ProductDetail.tsx` - Update stock display logic

---

### 2. Product Rating System ⭐⭐
**Requirements**:
- Users can rate ONLY after product is delivered
- One rating per user per product
- Cannot change rating once submitted
- Admin can edit/delete any rating

**Database Structure**:
```sql
-- Create product_ratings table
CREATE TABLE product_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one rating per user per product
  UNIQUE(user_id, product_id)
);

-- RLS Policies
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

-- Users can only rate delivered orders
CREATE POLICY "Users can rate delivered products" ON product_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = order_id
        AND o.user_id = auth.uid()
        AND o.status = 'delivered'
        AND oi.product_id = product_id
    )
  );

-- Users can view all ratings
CREATE POLICY "Anyone can view ratings" ON product_ratings
  FOR SELECT USING (true);

-- Admin can update/delete ratings
CREATE POLICY "Admins can manage ratings" ON product_ratings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

**Implementation Files**:
- Migration file for ratings table
- `src/components/ProductReviews.tsx` - Update to check delivery status
- `src/components/ProductCard.tsx` - Show real rating average
- `src/pages/Orders.tsx` - Add "Rate Product" button for delivered items

---

### 3. WhatsApp Password Reset (Optional)
**Status**: Planned but NOT IMPLEMENTED
**Requirements**:
- Twilio credentials needed
- Backend edge function for secure SMS
- Fallback to email if credentials missing

**Environment Variables Needed**:
```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

⚠️ **USER DECISION REQUIRED**: 
- Provide Twilio credentials to implement WhatsApp reset
- OR keep email-only password reset (current working solution)

---

## 🔐 Google OAuth Configuration

### ✅ Already Configured in Supabase
You've already set these in Supabase dashboard:
- Client ID: Added to Supabase
- Client Secret: Added to Supabase
- Callback URL: `https://swznjgwpwxivomntftwu.supabase.co/auth/v1/callback`

### ⚠️ Google Cloud Console Update Needed
In Google Cloud Console, add:
**Authorized JavaScript Origins**:
```
https://bushras-modern-boutique-72127.lovable.app
https://bushras-collection.vercel.app
```

**Authorized Redirect URIs**:
```
https://swznjgwpwxivomntftwu.supabase.co/auth/v1/callback
```

---

## 📧 Custom Email Domain (support@bushrascollection.com)

To send emails from your domain instead of Supabase:

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Click "Configure SMTP"
3. Enter your SMTP details:
   - **Host**: Your email provider's SMTP server
   - **Port**: Usually 587 or 465
   - **Username**: support@bushrascollection.com
   - **Password**: Your email password
   - **Sender Email**: support@bushrascollection.com
   - **Sender Name**: Bushra's Collection

Common SMTP Settings:
- **Gmail**: smtp.gmail.com (port 587) - requires app password
- **Outlook**: smtp-mail.outlook.com (port 587)
- **Custom Domain**: Check with your hosting provider

---

## 🎯 Next Steps

### Immediate Actions (User - 0 Credits):
1. ✅ Run `STORAGE-FIX.sql` in Supabase SQL Editor
2. ✅ Update Google Cloud Console Authorized Origins
3. ✅ Configure custom SMTP (optional)
4. ✅ Test signout functionality

### Development Priorities (AI Implementation):

**Priority 1** - Stock/Availability System
- Database migration (ready_to_wear vs made_to_order)
- Update admin product form
- Update product cards and detail pages

**Priority 2** - Rating System
- Database migration (product_ratings table with constraints)
- Update ProductCard to show real ratings
- Add "Rate Product" feature in Orders page
- Implement delivery-status check

**Priority 3** - WhatsApp Reset (If credentials provided)
- Create Edge Function for Twilio
- Add WhatsApp option to forgot password
- Implement fallback to email

---

## 📝 Notes

- **OAuth Credentials**: Do NOT use `.env` for Google/Facebook OAuth. Configure directly in Supabase dashboard.
- **Profile Page**: Already complete, just needs storage policies active
- **Auth Redirects**: Fixed to use app domain, not localhost
- **Rating Constraint**: One rating per product per user, enforced at database level
- **Admin Powers**: Admin can edit/delete any rating via RLS policy

---

## ❓ Questions for User

1. **Stock System**: Ready to implement - proceed with migration?
2. **Rating System**: Ready to implement - proceed with migration?
3. **WhatsApp Reset**: Provide Twilio credentials OR skip this feature?
4. **Custom Email**: Do you want to configure SMTP for branded emails?

Please confirm which features to implement next!
