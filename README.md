# Utoorat e Azami — Luxury Artisanal Fragrance E-Commerce & Admin Platform

A high-performance e-commerce platform and administrative control center for **Utoorat e Azami**, specializing in pure, non-alcoholic concentrated perfume oils, artisanal attars, and luxury fragrances.

---

## 🌟 Key Features

### 🛍️ Storefront (Customer Experience)
* **Dynamic Fragrance Showcase**: Real-time product browsing, category filtering, and instant search modal.
* **Variant & Stock Management**:
  * Multi-size variant support (`3ml`, `6ml`, `12ml`, `25ml`, `50ml`, `100ml`).
  * Real-time variant-level pricing and regular price comparison.
  * Smart stock detection: Auto-selects available in-stock variants, disables out-of-stock sizes with informative notices, and blocks out-of-stock items from the cart.
* **Streamlined Cart & Checkout**:
  * Slide-over cart drawer with live subtotal, promo code application, and free nationwide delivery progress bar.
  * Cash on Delivery (COD) 1-step checkout with instant order generation.
* **Customer Inquiries**: Dedicated Contact page saving customer messages directly to the Admin Dashboard.
* **Mobile First Design**: Fully responsive luxury aesthetic with touch-friendly interactions and lightbox image zoom.

### 🛡️ Admin Dashboard (`/admin`)
* **Secure Session Auth**: Protected routes via Next.js Proxy/Middleware with cookie sessions.
* **Real-time Business Analytics**: Total revenue, orders volume, active inventory count, customer database, and status breakdowns.
* **Order Management**: View customer delivery details, item breakdowns, update order statuses (Confirmed, Shipped, Delivered, Cancelled).
* **Product Catalog**: Add, edit, and delete fragrances with multi-image Cloudinary CDN uploads, variant pricing matrices, and in-stock toggles.
* **Categories Management**: Manage collection classifications dynamically without rigid subcategories.
* **Coupons & Promotions**: Create, toggle, and manage percentage-based discount codes.
* **Customer Messages**: Review contact inquiries, update message statuses (Unread, Read, Responded), and manage customer support notes.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack) & [React 19](https://react.dev/)
* **Database**: [PostgreSQL](https://www.postgresql.org/) via `pg` connection pool
* **Media & Assets**: [Cloudinary](https://cloudinary.com/) CDN
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS luxury typography
* **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js 18+ or 20+
* PostgreSQL server running locally or hosted (Supabase, Neon, RDS, etc.)

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Configuration parameters:
```env
# PostgreSQL Database Connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/utoorateazami

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_password
ADMIN_SESSION_SECRET=your_super_secret_session_key

# Cloudinary CDN Image Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Database Initialization
The database schema and initial seed data are automatically initialized on startup by `lib/db.js`.
To manually run the category seed or database migrations:

```bash
node scripts/seed-main-categories.js
node scripts/migrate-many-to-many.js
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

### 5. Building for Production

```bash
npm run build
npm run start
```

---

## 📁 Repository Structure

```
├── app/                  # Next.js App Router (Storefront, Admin, API routes)
│   ├── [category]/       # Category routing
│   ├── admin/            # Admin control center pages
│   ├── api/              # Secure REST APIs (admin, products, orders, contact)
│   ├── checkout/         # Standalone checkout page
│   ├── contact/          # Customer inquiry page
│   ├── product/[id]/     # Dynamic product detail pages
│   └── shop/             # Product catalog & filter grid
├── components/           # Reusable UI components (ProductCard, CartDrawer, etc.)
│   └── admin/            # Admin UI components (ImageUpload, etc.)
├── context/              # Cart & Global State Providers
├── data/                 # Store data fallbacks & configuration
├── lib/                  # Database connection (pg), Cloudinary, & Auth
├── public/               # Static assets & brand imagery
├── scripts/              # Database migration & seeding utilities
└── utils/                # Order storage & helper functions
```

---

## 📄 License
Private & Proprietary — All rights reserved by **Utoorat e Azami**.
