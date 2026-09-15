# ƯƠM. Archive (UOM Archive) 🌿

[![Next.js](https://img.shields.io/badge/Next.js-14.1-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-ea2845?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-yellow.svg)](#)

> **ƯƠM. Archive** is an e-commerce, artisan catalog, and editorial journaling platform crafted for bespoke handmade crafts, ceramics, and jewelry. Built with high performance, elegant typography, minimalist aesthetics, and comprehensive SEO automation.

---

## 🌟 Key Features

### 🛍️ Client Storefront & Customer Experience

- **Minimalist Aesthetic & Brand Identity:** Premium typography (Playfair Display / Inter), smooth micro-animations powered by Framer Motion, and mobile-first responsive design.
- **Multilingual Support (i18n):** Native internationalization via `next-intl` supporting Vietnamese (`vi`, default) and English (`en`).
- **Instant Search & Autocomplete:** Real-time search with Vietnamese diacritic removal normalization, trending keywords, recent search history, and keyboard navigation.
- **Interactive Product Showcase:** High-resolution galleries with full-screen lightbox zoom/pan, multi-currency conversion (VND/USD), real-time stock statuses, and inquiry forms.
- **Editorial Journal & Stories:** Curated articles with Tiptap rich-text rendering, reading time calculation, and related product tagging.

### ⚙️ Comprehensive Admin Portal (`/[locale]/admin`)

- **Dashboard & Analytics:** Overview metrics, recent activities, and stock indicators.
- **Product & Category Management:** Complete CRUD with multi-image Cloudinary / R2 drag-and-drop upload, status toggles, and soft-delete Trash system.
- **Story / Journal Publisher:** Full-featured rich text editor with image embedding, custom slugs, and instant indexing triggers.
- **Brand & Content Customization:** Dynamic configuration for brand banners, announcements, trending search terms, exchange rates, and social channels.

### 🚀 Performance & SEO Engine

- **Search Engine Optimization:** Dynamic OpenGraph (1200x630) social cards, Twitter cards, and Schema.org JSON-LD structured data for products and articles.
- **Automated Sitemap & Indexing:** Dynamic multi-sitemap generation with automated IndexNow and Google Indexing API pinging on content updates.
- **Next.js Standalone Optimization:** Built with Next.js Standalone mode for ultra-lightweight deployments with minimal memory footprint.

---

## 🛠️ Tech Stack

| Layer                 | Technology                                                                                                                                                                                                                                                                                          |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**          | [Next.js 14](https://nextjs.org/) (App Router), React 18, [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Radix UI](https://www.radix-ui.com/), [TanStack Query v5](https://tanstack.com/query/latest), [next-intl](https://next-intl-docs.vercel.app/) |
| **Backend**           | [NestJS 10](https://nestjs.com/), TypeScript, [Prisma ORM](https://www.prisma.io/), [Passport JWT](http://www.passportjs.org/), Argon2, Helmet, Throttler                                                                                                                                           |
| **Databases & Cache** | MariaDB / MySQL or PostgreSQL, Redis                                                                                                                                                                                                                                                                |
| **Storage & Media**   | Cloudinary, Cloudflare R2 / S3-compatible, Sharp image optimization                                                                                                                                                                                                                                 |
| **Deployment**        | Docker Compose, Plesk / LiteSpeed with Phusion Passenger standalone                                                                                                                                                                                                                                 |

---

## 📁 Repository Structure

```text
FSell-uom-archive/
├── backend/                   # NestJS REST API Application
│   ├── prisma/                # Prisma schema, migrations, and seed scripts
│   ├── src/                   # NestJS modules (auth, products, categories, stories, settings, etc.)
│   ├── scripts/               # DB provider switches (mariadb/mysql/postgres) & build utilities
│   └── passenger-backend.js   # Production Phusion Passenger / LiteSpeed entry point
│
├── frontend/                  # Next.js 14 Storefront & Admin Application
│   ├── app/                   # Next.js App Router ([locale]/...)
│   ├── components/            # UI components (Header, Footer, Lightbox, Forms, Dialogs)
│   ├── hooks/                 # React Query & custom React hooks
│   ├── lib/                   # Currency, SEO, API client, search normalization utils
│   ├── messages/              # i18n translation dictionaries (vi.json, en.json)
│   └── passenger-frontend.js  # Production Passenger entry point
│
├── release/                   # Production deployment zip/tar.gz archives
├── scripts/                   # Automated build & release packaging scripts
├── docker-compose.yml         # Development Docker configuration
├── docker-compose.prod.yml    # Production Docker configuration
├── deploy-plesk.js            # Plesk automated build & Passenger restart script
├── DEPLOY-PLESK.md            # Comprehensive deployment documentation
└── package.json               # Root workspace script definitions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.x` or `v20.x` or `v24.x`
- **Package Manager**: `npm` (`v9+` or `v10+`)
- **Database**: MariaDB 10.6+, MySQL 8.0+, or PostgreSQL 14+
- **Docker** _(Optional for local database & services)_

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/TanFuc/FSell-uom-archive.git
cd FSell-uom-archive

# Install root, backend, and frontend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Environment Configuration

#### Backend Configuration (`backend/.env`):

```env
PORT=8000
NODE_ENV=development
DATABASE_URL="mysql://uom_user:uom_password@localhost:3306/uom_archive"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
FRONTEND_URL="http://localhost:3000"
ADMIN_EMAIL="admin@uomarchive.com"
ADMIN_PASSWORD="YourSecurePassword123!"

# Optional Media & Storage
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

#### Frontend Configuration (`frontend/.env`):

```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
REVALIDATE_SECRET="your-cache-revalidation-secret"
```

### 3. Database Initialization

```bash
# Generate Prisma Client
npm --prefix backend run prisma:generate

# Push schema to database
npm --prefix backend run prisma:push

# (Optional) Seed database with demo products, categories, and settings
npm --prefix backend run db:seed
```

### 4. Run Development Servers

```bash
# Terminal 1: Run Backend API (default: http://localhost:8000)
cd backend && npm run start:dev

# Terminal 2: Run Frontend Web App (default: http://localhost:3000)
cd frontend && npm run dev
```

---

## 📦 Production Build & Deployment

### Option A: Plesk / LiteSpeed (Phusion Passenger)

The project includes specialized Passenger startup scripts (`passenger-frontend.js`, `passenger-backend.js`) and `.htaccess` rewrites:

```bash
# 1. Run full build and asset preparation
npm run deploy:plesk

# 2. Or package deployment ZIPs directly into release/ directory:
node scripts/package-plesk-zip.js
```

_For detailed Plesk Node.js app setup and Document Root mappings, refer to [DEPLOY-PLESK.md](DEPLOY-PLESK.md)._

### Option B: Docker Compose

```bash
# Build and run entire production stack (MariaDB, Redis, Backend, Frontend)
npm run docker:prod:up

# View logs
npm run docker:prod:logs

# Tear down containers
npm run docker:prod:down
```

---

## 🧪 Testing & Code Quality

```bash
# Run TypeScript typechecks
npm run check:type

# Run code format checks
npm run format:check

# Run linters
npm run check:lint

# Pre-commit verification gate
npm run check:precommit
```

---

## 📄 License

This repository is private property of **ƯƠM. Archive**. All rights reserved.
