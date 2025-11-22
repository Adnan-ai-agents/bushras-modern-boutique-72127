# 🚀 Development Setup Guide - Bushra's Collection

Complete guide to set up and run this e-commerce platform locally.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **bun** package manager
- **Git** - [Download](https://git-scm.com/)
- A **Supabase account** (free tier works) - [Sign up](https://supabase.com/)
- A code editor like **VS Code** - [Download](https://code.visualstudio.com/)

---

## 🛠️ Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd <project-folder>
```

---

## 📦 Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Using bun (faster):
```bash
bun install
```

This will install all required packages including:
- React 18.3
- Vite
- TypeScript
- Tailwind CSS
- Supabase Client
- Zustand (state management)
- React Router DOM
- Zod (validation)
- React Hook Form
- Tanstack React Query
- js-cookie
- And 50+ other dependencies

---

## 🔐 Step 3: Set Up Environment Variables

The project uses a `.env` file for configuration. This file is **already provided** in the repository with the following structure:

```env
# Supabase Configuration (Lovable Cloud - Pre-configured)
VITE_SUPABASE_URL=https://htywmazgmcqwwwjvcigw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=htywmazgmcqwwwjvcigw

# OAuth Configuration (Optional)
VITE_FACEBOOK_APP_ID=
VITE_GOOGLE_CLIENT_ID=315568922199-lvvbjdgpfc20nvk0fm5tmqe3u2u80f17.apps.googleusercontent.com

# Domain Configuration
VITE_LOCALHOST=http://localhost:5173
VITE_PRODUCTION_DOMAIN=https://bushras-collection.vercel.app
VITE_SUBDOMAIN=https://bushras-modern-boutique-72127.lovable.app
```

**⚠️ Important Notes:**
- The `.env` file is **pre-configured** with Lovable Cloud credentials
- **DO NOT** edit the Supabase credentials unless migrating to your own Supabase project
- The project uses **Lovable Cloud** (Supabase backend without needing a separate account)
- If you want to use your own Supabase project, replace the values with your project's credentials

---

## 🗄️ Step 4: Understanding the Database

The project uses **Supabase** as the backend (PostgreSQL database). The database is already set up with the following tables:

### Core Tables:

1. **products**
   - `id` (uuid, primary key)
   - `name` (text)
   - `description` (text)
   - `price` (numeric)
   - `list_price` (numeric)
   - `category` (text)
   - `brand` (text)
   - `stock_quantity` (integer)
   - `is_published` (boolean)
   - `is_featured` (boolean)
   - `images` (jsonb - array of image URLs)
   - `created_at`, `updated_at` (timestamps)

2. **orders**
   - `id` (uuid, primary key)
   - `user_id` (uuid, references auth.users)
   - `items` (jsonb - cart items)
   - `total` (numeric)
   - `shipping_address` (jsonb)
   - `status` (text: 'pending', 'processing', 'shipped', 'delivered', 'cancelled')
   - `payment_status` (text: 'pending_payment', 'paid', 'pending_verification', 'failed')
   - `payment_method_id` (uuid, references payment_methods)
   - `transaction_id` (text, nullable)
   - `created_at`, `updated_at` (timestamps)

3. **profiles**
   - `id` (uuid, primary key, references auth.users)
   - `name` (text)
   - `phone` (text)
   - `address` (jsonb)
   - `avatar_url` (text)
   - `created_at`, `updated_at` (timestamps)

4. **user_roles**
   - `id` (uuid, primary key)
   - `user_id` (uuid, references auth.users)
   - `role` (enum: 'user', 'admin', 'super_admin', 'moderator')
   - `created_at` (timestamp)

5. **payment_methods**
   - `id` (uuid, primary key)
   - `name` (text)
   - `type` (enum: 'manual', 'gateway', 'offline')
   - `logo_url` (text, nullable)
   - `is_active` (boolean)
   - `config` (jsonb - stores gateway credentials)
   - `instructions` (text - for manual payment instructions)
   - `display_order` (integer)
   - `created_at`, `updated_at` (timestamps)

6. **hero_slides**
   - `id` (uuid, primary key)
   - `title` (text)
   - `subtitle` (text, nullable)
   - `image_url` (text)
   - `cta_text` (text, nullable)
   - `cta_link` (text, nullable)
   - `order_index` (integer)
   - `is_active` (boolean)
   - `created_at`, `updated_at` (timestamps)

### Database Functions:

The database includes these helper functions:

- `is_admin(user_id)` - Check if user has admin or super_admin role
- `is_super_admin(user_id)` - Check if user has super_admin role
- `has_role(user_id, role)` - Check if user has a specific role
- `handle_new_user()` - Trigger that creates profile and assigns 'user' role on signup
- `handle_updated_at()` - Trigger that updates the `updated_at` field

### Storage Buckets:

- **product-images** (Public) - Stores product images
- **hero-media** (Public) - Stores hero slider images

### Row-Level Security (RLS):

All tables have RLS enabled with policies:
- Users can only view/edit their own data
- Admins can view/manage all data
- Public can view published products and active payment methods
- Authentication is required for orders and profiles

---

## 🏗️ Step 5: Project Structure

Understanding the codebase:

```
src/
├── assets/              # Static images (hero, product placeholders)
├── components/          # Reusable React components
│   ├── admin/          # Admin-specific components (ImageUpload)
│   ├── skeletons/      # Loading skeleton components
│   ├── ui/             # Shadcn UI components (Button, Card, etc.)
│   ├── Navigation.tsx  # Main navigation bar
│   ├── Footer.tsx      # Footer component
│   ├── CartDrawer.tsx  # Shopping cart drawer
│   └── ...
├── hooks/              # Custom React hooks (use-toast, use-mobile)
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client and types (auto-generated)
├── lib/                # Utility libraries
│   ├── auth.ts         # Authentication service
│   ├── domain.ts       # Domain/URL utilities
│   ├── queryClient.ts  # React Query configuration
│   └── utils.ts        # General utilities (cn, etc.)
├── pages/              # Route pages
│   ├── admin/          # Admin dashboard pages
│   │   ├── Products.tsx
│   │   ├── Orders.tsx
│   │   ├── PaymentMethods.tsx
│   │   └── ...
│   ├── Index.tsx       # Homepage
│   ├── Products.tsx    # Product listing
│   ├── ProductDetail.tsx
│   ├── Checkout.tsx
│   ├── Orders.tsx
│   ├── Auth.tsx        # Login/Signup
│   └── ...
├── schemas/            # Zod validation schemas
│   ├── authSchema.ts
│   ├── productSchema.ts
│   ├── checkoutSchema.ts
│   └── profileSchema.ts
├── services/           # API service layer (NEW)
│   ├── productsService.ts
│   ├── ordersService.ts
│   ├── profileService.ts
│   └── paymentService.ts
├── store/              # Zustand state stores
│   ├── auth.ts         # Auth state
│   └── cart.ts         # Shopping cart state (uses cookies)
├── utils/              # Utility functions
│   ├── cookies.ts      # Cookie management
│   └── errors.ts       # Error handling utilities
├── App.tsx             # Root component with routing
├── main.tsx            # App entry point
└── index.css           # Global styles + Tailwind

supabase/
├── config.toml         # Supabase project configuration
└── migrations/         # Database migration files
```

---

## ▶️ Step 6: Run the Development Server

Start the development server:

```bash
npm run dev
```

Or with bun:
```bash
bun run dev
```

The app will be available at: **http://localhost:8080**

**Note:** The project uses port **8080**, not 5173 (configured in `vite.config.ts`)

---

## 🎨 Step 7: Understanding the Tech Stack

### Frontend:
- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (fast HMR)
- **Tailwind CSS** - Utility-first CSS
- **Shadcn UI** - Component library
- **React Router DOM** - Client-side routing
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Tanstack React Query** - Server state caching
- **js-cookie** - Cookie management

### Backend (Lovable Cloud/Supabase):
- **PostgreSQL** - Database
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage
- **Row Level Security** - Database access control
- **Edge Functions** - Serverless functions (if needed)

### Key Libraries:
- **@supabase/supabase-js** - Supabase client
- **lucide-react** - Icon library
- **sonner** - Toast notifications
- **date-fns** - Date utilities
- **class-variance-authority** - Component variants

---

## 🔑 Step 8: Authentication Flow

The app uses **Supabase Auth** with the following flow:

1. **Sign Up** (`/auth`):
   - User enters email, password, and name
   - Supabase creates account in `auth.users`
   - Database trigger creates profile in `profiles` table
   - Default role 'user' assigned in `user_roles` table
   - Email confirmation required (can be disabled in Supabase dashboard)

2. **Sign In** (`/auth`):
   - User enters email and password
   - Supabase validates credentials
   - Session stored in localStorage
   - User redirected to homepage

3. **Session Management**:
   - Session persists across page refreshes
   - Auto-refresh tokens enabled
   - Session expires after 7 days (default)
   - `useAuthStore` (Zustand) manages auth state globally

4. **Protected Routes**:
   - `/checkout`, `/orders`, `/profile` require authentication
   - Admin routes (`/admin/*`) require admin role
   - `ProtectedRoute` component handles redirects

5. **Role-Based Access**:
   - Roles stored in `user_roles` table
   - Database functions check permissions
   - Admin features hidden for non-admin users

**Important Files:**
- `src/lib/auth.ts` - Auth service functions
- `src/store/auth.ts` - Auth state management
- `src/pages/Auth.tsx` - Login/Signup UI
- `src/components/ProtectedRoute.tsx` - Route protection

---

## 🛒 Step 9: Shopping Cart Flow

The cart system uses **cookies** for persistence:

1. **Guest Users**:
   - Can browse products without login
   - Can add items to cart (stored in cookies)
   - Cart persists for **30 days**
   - Cart data survives browser close

2. **Cart Storage**:
   - Cookie name: `cart_items`
   - Format: JSON array of `{id, name, price, quantity, image}`
   - Managed by `src/store/cart.ts` (Zustand)
   - Uses `js-cookie` library

3. **Cart Operations**:
   - `addItem()` - Add product to cart
   - `removeItem()` - Remove by product ID
   - `updateQuantity()` - Change quantity
   - `clearCart()` - Empty cart (after order)
   - `getTotalItems()` - Count items
   - `getTotalPrice()` - Calculate total

4. **Checkout Flow**:
   - Guest clicks "Checkout" → Redirected to `/auth`
   - After login → Redirected back to `/checkout`
   - Cart data persists through authentication
   - Order placed → Cart cleared

**Important Files:**
- `src/store/cart.ts` - Cart state + cookie logic
- `src/utils/cookies.ts` - Cookie utilities
- `src/components/CartDrawer.tsx` - Cart UI
- `src/pages/Checkout.tsx` - Checkout page

---

## 💳 Step 10: Payment System

The app uses a **flexible payment method system**:

1. **Payment Methods Table**:
   - Admins can add/edit payment methods in `/admin/payment-methods`
   - Each method has type: `manual`, `gateway`, or `offline`
   - Active methods shown at checkout

2. **Payment Flow**:
   - User selects payment method at checkout
   - Order created with `payment_method_id`
   - Payment status: `pending_payment`, `paid`, `pending_verification`
   - Manual methods (e.g., "Contact Payment") show instructions

3. **Default Method**:
   - Pre-seeded: "Contact Payment" (manual type)
   - Instructions: "Please contact us to arrange payment"
   - No gateway integration by default (easily extendable)

4. **Future Gateway Support**:
   - Architecture supports Stripe, PayPal, etc.
   - Gateway configs stored in `config` JSONB field
   - Service adapter pattern in `src/services/paymentService.ts`

**Important Files:**
- `src/services/paymentService.ts` - Payment logic
- `src/pages/admin/PaymentMethods.tsx` - Admin management
- `src/pages/Checkout.tsx` - Payment selection

---

## 🎯 Step 11: Admin Features

Admin users have access to:

1. **Admin Dashboard** (`/admin`):
   - Overview cards (products, orders, users)
   - Quick stats
   - Navigation to admin features

2. **Product Management** (`/admin/products`):
   - View all products
   - Add/edit/delete products
   - Upload multiple images
   - CSV bulk import (via Edge Function)
   - Publish/unpublish products

3. **Order Management** (`/admin/orders`):
   - View all orders
   - Update order status
   - Update payment status
   - View customer details

4. **Payment Methods** (`/admin/payment-methods`):
   - Add/edit payment methods
   - Toggle active/inactive
   - Reorder methods
   - Configure gateway credentials

5. **User Management** (`/admin/users`):
   - View all users
   - Manage user roles
   - View user profiles

**Important:**
- Only users with 'admin' or 'super_admin' role can access admin routes
- First user needs to be made admin manually in database
- Use Supabase dashboard SQL editor to assign admin role

---

## 🐛 Step 12: Common Issues & Solutions

### Issue: App doesn't start
**Solution:** 
```bash
rm -rf node_modules
npm install
npm run dev
```

### Issue: "Supabase client error"
**Solution:** Check `.env` file has correct Supabase credentials

### Issue: Can't login
**Solution:** 
- Check email confirmation setting in Supabase dashboard
- Go to Authentication → Settings → Email Auth → Disable "Confirm email"

### Issue: Admin routes show 404
**Solution:** Make sure your user has admin role in `user_roles` table

### Issue: Images not loading
**Solution:** 
- Check storage bucket exists: `product-images`, `hero-media`
- Check bucket is public
- Check RLS policies allow SELECT

### Issue: Cart not persisting
**Solution:** 
- Check browser allows cookies
- Check `cart_items` cookie exists in DevTools

### Issue: TypeScript errors
**Solution:** 
```bash
npm run build
```
This regenerates types from Supabase

---

## 📚 Step 13: Key Scripts

Available npm scripts in `package.json`:

```json
{
  "dev": "vite",                    // Start dev server
  "build": "tsc -b && vite build",  // Build for production
  "lint": "eslint .",               // Lint code
  "preview": "vite preview"         // Preview production build
}
```

---

## 🔧 Step 14: Development Workflow

### Adding a New Feature:

1. **Database Changes** (if needed):
   - Create migration in Supabase dashboard
   - Update RLS policies
   - Regenerate types: `npm run build`

2. **Service Layer**:
   - Add functions to appropriate service file in `src/services/`

3. **React Query Integration**:
   - Add query key to `src/lib/queryClient.ts`
   - Use `useQuery` or `useMutation` in components

4. **UI Components**:
   - Create component in `src/components/` or `src/pages/`
   - Use Shadcn UI components from `src/components/ui/`
   - Follow Tailwind CSS design system

5. **Form Validation**:
   - Create Zod schema in `src/schemas/`
   - Use with React Hook Form

6. **Error Handling**:
   - Use `getErrorMessage()` from `src/utils/errors.ts`
   - Show toast notifications

7. **State Management**:
   - Global state → Zustand store in `src/store/`
   - Server state → React Query
   - Local state → useState

### Testing Your Changes:

1. Test as guest user (not logged in)
2. Test as logged-in user
3. Test as admin user
4. Test on mobile (responsive design)
5. Check console for errors
6. Test error scenarios

---

## 🎓 Step 15: Next Steps & Learning Resources

### Recommended Learning Path:

1. **React Fundamentals**:
   - [React Official Docs](https://react.dev/)
   - [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

2. **Supabase**:
   - [Supabase Docs](https://supabase.com/docs)
   - [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
   - [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

3. **Tailwind CSS**:
   - [Tailwind Docs](https://tailwindcss.com/docs)
   - [Shadcn UI](https://ui.shadcn.com/)

4. **State Management**:
   - [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
   - [React Query Docs](https://tanstack.com/query/latest)

5. **Form Validation**:
   - [React Hook Form Docs](https://react-hook-form.com/)
   - [Zod Docs](https://zod.dev/)

### Extending the Project:

Ideas for additional features:
- Product reviews and ratings
- Wishlist functionality
- Order tracking page
- Email notifications
- Push notifications
- Advanced search and filters
- Product recommendations
- Inventory management
- Sales analytics dashboard
- Multi-language support
- Dark mode toggle
- Payment gateway integration (Stripe, PayPal)

---

## 🆘 Getting Help

- Check the code comments in files
- Read related documentation files in the project root
- Search for similar issues in the codebase
- Check Supabase dashboard for database insights
- Use browser DevTools for debugging

---

## ✅ Checklist for First Setup

- [ ] Node.js installed (v18+)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file exists with correct values
- [ ] Dev server running (`npm run dev`)
- [ ] App opens at http://localhost:8080
- [ ] Can create an account
- [ ] Can browse products
- [ ] Can add items to cart
- [ ] Cart persists after browser refresh
- [ ] Admin role assigned (if testing admin features)

---

**Congratulations! 🎉** You now have a fully functional e-commerce platform running locally. Happy coding!
