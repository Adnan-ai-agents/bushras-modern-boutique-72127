# 🚀 Deployment Guide - Bushra's Collection

Complete guide to deploy this e-commerce platform to production.

---

## 📋 Deployment Options

This app can be deployed to:
1. **Vercel** (Recommended - Easiest)
2. **Netlify** (Great alternative)
3. **Lovable.app** (Already configured)
4. **Traditional hosting** (VPS, shared hosting)

We'll cover Vercel in detail as it's the simplest option.

---

## 🎯 Option 1: Deploy to Vercel (Recommended)

### Prerequisites:
- GitHub account
- Vercel account (free tier works)
- Code pushed to GitHub repository

### Step-by-Step:

#### 1. Push Code to GitHub

If not already done:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### 2. Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your repositories

#### 3. Import Project

1. Click "Add New Project"
2. Select your GitHub repository
3. Vercel will auto-detect it's a Vite project
4. Click "Import"

#### 4. Configure Build Settings

Vercel should auto-detect these, but verify:

```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Development Command: npm run dev
```

#### 5. Add Environment Variables

Click "Environment Variables" and add these:

```
VITE_SUPABASE_URL=https://htywmazgmcqwwwjvcigw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
VITE_SUPABASE_PROJECT_ID=htywmazgmcqwwwjvcigw
VITE_PRODUCTION_DOMAIN=https://your-domain.vercel.app
```

**Important:** 
- Use your actual Supabase project credentials
- Update `VITE_PRODUCTION_DOMAIN` after first deployment

#### 6. Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

#### 7. Configure Custom Domain (Optional)

1. Go to project settings → Domains
2. Add your custom domain
3. Update DNS records as shown
4. Wait for DNS propagation (5-60 minutes)

---

## 🎯 Option 2: Deploy to Netlify

### Prerequisites:
- GitHub account
- Netlify account (free tier works)
- Code pushed to GitHub

### Step-by-Step:

#### 1. Sign Up for Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Sign Up"
3. Choose "GitHub"
4. Authorize Netlify

#### 2. Import Project

1. Click "Add new site" → "Import an existing project"
2. Choose "Deploy with GitHub"
3. Select your repository
4. Click "Deploy site"

#### 3. Configure Build Settings

```
Build command: npm run build
Publish directory: dist
```

#### 4. Add Environment Variables

Go to Site settings → Environment variables:

```
VITE_SUPABASE_URL=https://htywmazgmcqwwwjvcigw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
VITE_SUPABASE_PROJECT_ID=htywmazgmcqwwwjvcigw
VITE_PRODUCTION_DOMAIN=https://your-site-name.netlify.app
```

#### 5. Configure Redirects

Create `public/_redirects` file:

```
/*    /index.html   200
```

This ensures React Router works correctly.

#### 6. Deploy

Netlify will auto-deploy. Your site will be live at:
`https://your-site-name.netlify.app`

---

## 🗄️ Database Setup for Production

### Supabase Configuration:

#### 1. Disable Email Confirmation (Optional, for testing)

1. Go to Supabase dashboard
2. Authentication → Providers → Email
3. Toggle off "Confirm email"
4. Save

**Production:** Keep email confirmation ON for security.

#### 2. Configure Auth Redirect URLs

1. Go to Authentication → URL Configuration
2. Add your production domain to "Site URL"
3. Add redirect URLs:
```
https://your-domain.com/*
https://your-domain.com/auth
```

#### 3. Configure Storage CORS

If using custom domain:

1. Go to Storage → Configuration
2. Add CORS policy:
```json
[
  {
    "origin": ["https://your-domain.com"],
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"]
  }
]
```

#### 4. Review RLS Policies

Ensure all tables have proper Row Level Security:

```sql
-- Check enabled RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All should show 'true' for rowsecurity
```

#### 5. Backup Database

Before going live:
```bash
# From Supabase dashboard → Database → Backups
# Enable automatic daily backups
```

---

## 🔒 Security Checklist

### Before Production Deployment:

- [ ] All RLS policies enabled and tested
- [ ] Email confirmation enabled (unless intentionally disabled)
- [ ] Strong password policy enforced
- [ ] Rate limiting configured
- [ ] HTTPS enforced (automatic on Vercel/Netlify)
- [ ] Environment variables not committed to Git
- [ ] Admin users properly assigned in database
- [ ] Storage buckets have correct RLS policies
- [ ] CORS configured for production domain
- [ ] Error messages don't expose sensitive data
- [ ] Input validation on all forms (Zod schemas)
- [ ] SQL injection prevention (using Supabase client)
- [ ] XSS prevention (React auto-escapes)

### Additional Security Measures:

1. **Content Security Policy** (Add to Vercel/Netlify headers):
```
Content-Security-Policy: default-src 'self'; img-src 'self' https://htywmazgmcqwwwjvcigw.supabase.co data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

2. **Security Headers** (Create `vercel.json` or `netlify.toml`):

For Vercel (`vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

For Netlify (`netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

---

## 📊 Performance Optimization

### Pre-Deployment Optimizations:

#### 1. Image Optimization

All product images should be:
- Compressed (use [TinyPNG](https://tinypng.com/))
- WebP format preferred
- Maximum 1MB each
- Stored in Supabase Storage

#### 2. Code Splitting

Already configured in Vite, but verify:
```typescript
// Lazy load admin routes
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
```

#### 3. Bundle Analysis

Check bundle size before deploying:
```bash
npm run build
```

Check `dist/` folder size. Should be under 2MB.

#### 4. Database Indexes

Ensure indexes are created (already in migration):
- Products: category, is_published, created_at
- Orders: user_id, created_at
- See `DEVELOPMENT_SETUP_GUIDE.md` for full list

#### 5. Caching Strategy

React Query is configured for optimal caching:
- Products: 10 minutes
- Orders: 1 minute
- Profile: 15 minutes
- Categories: 24 hours

---

## 🚨 Post-Deployment Checklist

After your first deployment:

### Immediate Testing:

- [ ] Site loads on desktop
- [ ] Site loads on mobile
- [ ] Can create new account
- [ ] Can login
- [ ] Email verification works (if enabled)
- [ ] Can browse products
- [ ] Can add to cart
- [ ] Cart persists after refresh
- [ ] Can complete checkout
- [ ] Order appears in database
- [ ] Admin can login
- [ ] Admin can add products
- [ ] Images upload successfully
- [ ] Payment method selection works

### Browser Testing:

Test on:
- [ ] Chrome (desktop + mobile)
- [ ] Firefox
- [ ] Safari (desktop + iOS)
- [ ] Edge

### Performance Testing:

1. Run Lighthouse audit:
   - Open Chrome DevTools
   - Go to "Lighthouse" tab
   - Run audit for Mobile + Desktop
   - Target: 90+ score

2. Check load times:
   - Homepage: < 2 seconds
   - Product page: < 2 seconds
   - Checkout: < 3 seconds

### SEO Setup:

Update `index.html`:
```html
<title>Bushra's Collection - Premium Fashion Store</title>
<meta name="description" content="Shop premium clothing, jewelry, and accessories at Bushra's Collection. Quality craftsmanship and elegant designs.">
<meta property="og:title" content="Bushra's Collection">
<meta property="og:description" content="Premium Fashion Store">
<meta property="og:image" content="https://your-domain.com/og-image.jpg">
<meta property="og:url" content="https://your-domain.com">
```

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

Both Vercel and Netlify auto-deploy when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel/Netlify will auto-deploy in 2-3 minutes
```

### Deploy Branches

- `main` branch → Production
- `develop` branch → Preview deployment (optional)

To set up preview:
1. Create `develop` branch
2. Vercel/Netlify auto-creates preview URL
3. Test features before merging to main

---

## 📈 Monitoring & Analytics

### 1. Set Up Error Tracking (Optional)

Install Sentry for error monitoring:

```bash
npm install @sentry/react
```

Configure in `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

### 2. Set Up Analytics (Optional)

Add Google Analytics in `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. Database Monitoring

Supabase provides built-in monitoring:
- Go to Supabase dashboard → Reports
- Monitor:
  - Query performance
  - Database size
  - API usage
  - Auth events

---

## 🔧 Common Deployment Issues

### Issue: Build fails with TypeScript errors

**Solution:**
```bash
# Locally
npm run build
# Fix all TypeScript errors
# Then push
```

### Issue: Environment variables not working

**Solution:**
- Ensure variables start with `VITE_`
- Redeploy after adding variables
- Clear cache if still not working

### Issue: 404 on page refresh

**Solution:**
- Add redirects file (see Netlify section)
- Vercel handles this automatically

### Issue: Images not loading

**Solution:**
- Check Supabase Storage CORS
- Verify bucket is public
- Check RLS policies

### Issue: Authentication not working

**Solution:**
- Update Supabase redirect URLs
- Check CORS settings
- Verify environment variables

### Issue: Slow page loads

**Solution:**
- Enable React Query caching
- Compress images
- Add database indexes
- Enable CDN

---

## 🎯 Advanced: Custom Domain Setup

### For Vercel:

1. Go to project → Settings → Domains
2. Add your domain (e.g., `yourstore.com`)
3. Vercel provides DNS records:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```
4. Add records to your domain registrar (GoDaddy, Namecheap, etc.)
5. Wait 5-60 minutes for DNS propagation
6. Vercel auto-issues SSL certificate

### For Netlify:

1. Go to Domain settings → Add custom domain
2. Netlify provides:
```
NETLIFY_DNS_SERVERS:
- dns1.p03.nsone.net
- dns2.p03.nsone.net
```
3. Update nameservers at your registrar
4. Wait for DNS propagation

---

## 📱 Mobile App (Future)

To convert to mobile app later:

1. **React Native** (requires rewrite):
   - Use React Native with same backend
   - Supabase works natively with React Native

2. **Capacitor** (wraps web app):
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npx cap add ios
   npx cap add android
   ```

3. **PWA** (simplest):
   - Already configured in `vite.config.ts`
   - Add service worker
   - Users can "Add to Home Screen"

---

## 🎓 Post-Launch Recommendations

### Week 1:
- [ ] Monitor error logs daily
- [ ] Check analytics for traffic patterns
- [ ] Test all features thoroughly
- [ ] Fix any critical bugs
- [ ] Gather user feedback

### Month 1:
- [ ] Review database performance
- [ ] Optimize slow queries
- [ ] Add missing features based on feedback
- [ ] Set up automated backups
- [ ] Plan next feature updates

### Ongoing:
- [ ] Regular security updates (`npm audit`)
- [ ] Database backups (automated)
- [ ] Performance monitoring
- [ ] User support
- [ ] Feature enhancements

---

## 🆘 Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Supabase Docs:** https://supabase.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html

---

## ✅ Final Pre-Launch Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel/Netlify
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (HTTPS)
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Email auth configured
- [ ] Storage CORS configured
- [ ] Admin user created
- [ ] Test accounts created
- [ ] All features tested on production
- [ ] Mobile responsive tested
- [ ] Performance score > 90
- [ ] Error tracking set up
- [ ] Analytics installed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Support email configured

---

**🎉 Congratulations!** Your e-commerce platform is now live and ready for customers!

**Next Steps:**
- Share the URL with your customers
- Promote on social media
- Set up marketing campaigns
- Monitor and optimize based on usage
- Plan feature updates based on feedback

---

**Questions or Issues?**
- Check deployment logs in Vercel/Netlify
- Review Supabase logs for backend issues
- Use browser DevTools for frontend debugging
- Refer back to `DEVELOPMENT_SETUP_GUIDE.md` for code understanding
