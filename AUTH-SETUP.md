# Authentication Setup Guide

## ✅ What's Been Fixed

### 1. Password Reset Email Links
- **Fixed**: Email links now properly redirect to your production domain
- **How it works**: All auth functions now use `getAppUrl()` which automatically uses the correct domain from `.env`
- The reset password page now properly handles the URL hash tokens and establishes a session before showing the form

### 2. Email Confirmation for New Users
- **Fixed**: Signup confirmation emails also redirect to the correct domain
- **Added**: Clear toast message telling users to check their email after signup
- Confirmation links automatically log users in and redirect to home page

### 3. Social Authentication (Google & Facebook)
- **Added**: OAuth buttons for Google and Facebook signin
- **Smart**: Buttons only appear when credentials are configured in `.env`
- **Seamless**: Works for both Sign In and Sign Up flows

## 🔧 Setup Instructions

### Step 1: Supabase URL Configuration (CRITICAL)
Go to your Supabase Dashboard:
1. Navigate to: **Authentication → URL Configuration**
2. Set **Site URL** to: `https://bushras-modern-boutique-72127.lovable.app`
3. Add **Redirect URLs**:
   - `https://bushras-modern-boutique-72127.lovable.app/reset-password`
   - `https://bushras-modern-boutique-72127.lovable.app/`
   - `http://localhost:5173/reset-password` (for development)

### Step 2: Configure Social Auth Providers (Optional)

#### For Google Authentication:
1. Go to: **Supabase Dashboard → Authentication → Providers → Google**
2. Enable Google provider
3. Copy the **Client ID** 
4. Paste it in `.env`: `VITE_GOOGLE_CLIENT_ID="your-client-id-here"`

#### For Facebook Authentication:
1. Go to: **Supabase Dashboard → Authentication → Providers → Facebook**
2. Enable Facebook provider
3. Copy the **App ID**
4. Paste it in `.env`: `VITE_FACEBOOK_APP_ID="your-app-id-here"`

**Note**: If you leave these empty, the social login buttons won't appear - only email/password will be shown.

### Step 3: Custom Email Domain (Optional)
To use `support@bushrasCollection.com` instead of the default Supabase emails:

1. Go to: **Supabase Dashboard → Project Settings → Auth**
2. Scroll to **SMTP Settings**
3. Configure your custom SMTP server (e.g., SendGrid, Mailgun, AWS SES)
4. Update email templates to use your domain

## 🎯 What Happens Now

### Password Reset Flow:
1. User clicks "Forgot Password" → Enters email
2. Receives email with link: `https://bushras-modern-boutique-72127.lovable.app/reset-password#access_token=...`
3. Link automatically establishes session and shows password reset form
4. User sets new password and is redirected to login

### Signup Flow:
1. User fills signup form → Clicks "Create Account"
2. Sees toast: "Check your email! We've sent a confirmation link to..."
3. Opens email, clicks confirmation link
4. Link redirects to app, automatically logs them in, shows "Email verified!" toast
5. Redirects to home page

### Social Auth Flow:
1. User clicks Google/Facebook button
2. Redirected to OAuth provider
3. After approval, redirected back to home page, fully authenticated

## 📝 Testing Checklist
- [ ] Run the database migration: `comprehensive-database-fix.sql`
- [ ] Add yourself as admin in `user_roles` table
- [ ] Update Supabase URL Configuration (Step 1 above)
- [ ] Test password reset with email
- [ ] Test new user signup and email confirmation
- [ ] (Optional) Configure and test Google/Facebook login

## 🚫 No More `localhost:3000` Issues
All auth redirects now use the domain configuration system:
- Production: Uses `VITE_PRODUCTION_DOMAIN` if set
- Staging: Uses `VITE_SUBDOMAIN` (your lovable.app URL)
- Development: Uses `VITE_LOCALHOST`

The correct domain is automatically selected based on your environment!
