# 🎓 EZ Swap — Campus Marketplace Platform

> **AIROST 2026 Internship**  
> **Team EZ**: Lim Pin Guan & Wong Ann Rick  
> Web & App-based secure campus peer-to-peer marketplace tailored specifically for Universiti Teknologi Malaysia (UTM) students.

---

## 📌 Table of Contents
1. [Overview & Problem Statement](#-overview--problem-statement)
2. [Key Features & 9-Step Transaction Lifecycle](#-key-features--9-step-transaction-lifecycle)
3. [System Architecture & Tech Stack](#-system-architecture--tech-stack)
4. [Database Models (10 Entities)](#-database-models-10-entities)
5. [API Routes Reference](#-api-routes-reference)
6. [Getting Started (Local Development)](#-getting-started-local-development)
7. [Default Demo Credentials](#-default-demo-credentials)
8. [Testing & Verification Suites](#-testing--verification-suites)
9. [Deployment Guide (Render + Atlas)](#-deployment-guide-vercel--render--atlas)

---

## 💡 Overview & Problem Statement

University students regularly buy and sell textbooks, electronics, dorm appliances, and student services. However, general platforms like Carousell or Mudah lack campus security, physical meetup safety, and student verification, leading to scams and ghosting.

**EZ Swap** solves this by establishing a trusted, closed-loop student ecosystem with:
- **UTM Official Email Verification** (`@graduate.utm.my`) with instant domain classification.
- **In-App Real-Time Chat & Price Negotiation** (Counter-offers & Accepted states).
- **Physical Campus Meetup Scheduling & Dual Handover Confirmation** (Seller confirms *Handed Over*, Buyer confirms *Received*).
- **Mutual Reputation & Rating System** (1–5 stars with transparent transaction history).
- **Administrator Moderation Portal** (Dispute resolution, report queues, and listing moderation).
- **AI Recommendation Engine** (Personalized recommendations based on student viewing behavior).

---

## 🔄 Key Features & 9-Step Transaction Lifecycle

EZ Swap implements a structured 9-step trade pipeline:

```
[1. Browse / Search] ➔ [2. View Item] ➔ [3. In-App Chat] ➔ [4. Make Offer / Counter]
         ➔ [5. Deal Agreed (Transaction ID)] ➔ [6. Schedule Campus Meetup]
         ➔ [7. Physical Handover (Dual Confirmation)] ➔ [8. Mutual Ratings (1–5 Stars)]
         ➔ [9. Admin Dispute Resolution (If Needed)]
```

- **1: Authentication & Tiered Validation**: UTM students get automatic verified status; external emails require approval.
- **2 Listing CRUD & Cloudinary**: Multi-image uploads, categorized ads, real-time status management (`active`, `reserved`, `sold`, `removed`).
- **3: Discovery & Search**: Keyword fuzzy search, category filtering (*Textbooks, Electronics, Dorm, Fashion, Services, Sports*), and price sorting.
- **4: Detail View & Wishlist**: Image carousel, view counter, seller badge, and persistent bookmarks.
- **5: Real-Time Messaging**: Socket.IO-powered conversations linked to listing items with unread badges.
- **6: Offer Negotiation Workflow**: Make offer with custom price and handover method (Meetup/Delivery); accept, reject, or counter-offer.
- **7: Handover Coordination**: Automatically generates unique Transaction ID upon acceptance; meetup scheduling modal with location & time.
- **8: Dual Handover Confirmation**: 2-party confirmation system to prevent theft and ghosting.
- **9: Mutual Reviews**: 1–5 star rating modal with comments, updating seller/buyer public reputation score.
- **10: Admin Moderation Portal**: Dedicated dashboard for user verification, listing moderation, report resolution, and dispute resolution.
- **11: AI Recommendation Engine**: Multi-factor candidate scoring based on student viewing history, category affinity, and tag similarity.

---

## 🛠️ System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                   EZ Swap Frontend                     │
│    React 19 • Tailwind CSS 4 • Vite • React Router 7    │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs & WebSockets
┌───────────────────────────▼────────────────────────────┐
│                    Express Backend                     │
│      Node.js • Socket.IO • JWT Session Cookies         │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼──────────────┐ ┌──────────▼──────────────┐
│       MongoDB Atlas        │ │     Cloudinary CDN      │
│   Cloud Database Cluster   │ │ Listing & Avatar Images │
└────────────────────────────┘ └─────────────────────────┘
```

- **Frontend**: React 19, Vite, Tailwind CSS 4, Lucide Icons, Socket.io-client.
- **Backend**: Node.js, Express 5, Socket.IO, Mongoose 9, JWT, Cookie-Parser, Multer, Cloudinary SDK.
- **Database**: MongoDB Atlas.

---

## 📦 Database Models (10 Entities)

1. **User**: Name, email, hashed password, role (`student` / `admin`), verification status (`verified`, `unverified`, `pending`), average rating.
2. **Listing**: Title, description, price, category, condition (`New` / `Used`), images array, status (`active`, `reserved`, `sold`, `removed`), tags.
3. **Order**: Buyer ID, seller ID, listing ID, offered price, counter price, status (`pending`, `accepted`, `rejected`, `countered`, `cancelled`), handover method.
4. **Transaction**: Transaction code, order ID, listing ID, buyer ID, seller ID, meetup details (location, time, notes), seller confirmation, buyer confirmation, status (`in_progress`, `completed`, `disputed`).
5. **Review**: Transaction ID, reviewer ID, reviewee ID, reviewer role (`buyer` / `seller`), star rating (1–5), comment.
6. **Report**: Reporter ID, target type (`listing` / `user` / `transaction`), reason, admin notes, status (`pending`, `reviewed`, `resolved`, `dismissed`).
7. **Bookmark**: User ID and listing ID compound index for student wishlists.
8. **Conversation**: Buyer ID, seller ID, and listing ID message thread.
9. **Message**: Conversation ID, sender ID, text content, read status.
10. **ViewHistory**: Subdocument tracking user views for AI recommendations.

---

## 🔌 API Routes Reference

### Authentication (`/api/auth`)
- `POST /login` — Authenticate user and issue JWT cookie
- `POST /register` — Register student account
- `GET /me` — Get current logged-in user
- `POST /logout` — Clear session cookie

### Listings (`/api/listings`)
- `GET /` — Browse and search listings (supports `keyword`, `category`, `minPrice`, `maxPrice`, `sort`)
- `GET /:id` — Get single listing details
- `POST /` — Create new listing (with image upload)
- `PUT /:id` — Update listing
- `DELETE /:id` — Remove listing
- `GET /recommendations` — Personalized AI recommendations (T17)

### Offers & Orders (`/api/orders`)
- `GET /` — Get user offers (buyer/seller role)
- `POST /` — Make offer on a listing
- `PATCH /:id/accept` — Accept offer (triggers transaction creation)
- `PATCH /:id/reject` — Reject offer
- `PATCH /:id/counter` — Submit counter-offer

### Transactions & Handover (`/api/transactions`)
- `GET /` — Get user transactions
- `PATCH /:id/schedule-meetup` — Set meetup location & time (T13)
- `PATCH /:id/confirm-handover` — Dual confirmation (T14)
- `POST /:id/dispute` — Raise dispute

### Reviews (`/api/reviews`)
- `POST /` — Submit 1–5 star rating & feedback (T15)
- `GET /user/:userId` — Get reviews for a profile
- `GET /check` — Check review submission status

### Bookmarks (`/api/bookmarks`)
- `GET /` — Get user's saved wishlist items (T10)
- `POST /toggle` — Toggle bookmark for a listing
- `GET /check/:listingId` — Check if an item is bookmarked

### Admin (`/api/admin`)
- `GET /stats` — Platform KPI stats & volume
- `GET /users` — Moderate users (verify, promote, revoke)
- `GET /listings` — Moderate listings (remove, reinstate)
- `GET /reports` — Resolve community reports
- `GET /disputes` — Settle handover disputes (seller vs buyer wins)

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- Node.js v18+ installed.
- MongoDB Atlas cluster URL.
- Cloudinary credentials (for image uploads).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/pglim06/EZ-SWAP.git
cd EZ-SWAP

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Variables
Create `.env` in the root folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Running the Application
```bash
# Run backend server (from EZ-SWAP folder)
node server.js
# Output: EZ Swap Server running on port 5000

# Run frontend client (in a new terminal, from EZ-SWAP/client)
npm run dev
# Output: Local: http://localhost:5173/
```

Open **`http://localhost:5173`** in your browser.

---

## 👤 Default Demo Credentials

| Role | Email | Password | Access Area |
|---|---|---|---|
| **Admin** | `admin@graduate.utm.my` | `Admin1234!` | Admin Moderation Portal (`/admin`) |
| **Student (Seller)** | `limpinguan@graduate.utm.my` | `123456789` | Full Marketplace & Post Ads |
| **Student (Buyer)** | `wongannrick@graduate.utm.my` | `123456` | Full Marketplace & Offers |
| **Test Student** | `seller@graduate.utm.my` | `Password123!` | Marketplace Ads |

---

## 🧪 Testing & Verification Suites

EZ-SWAP includes automated test scripts in the `scripts/` directory:
```bash
# Check database collections and live document counts:
npm run db:check

# Inspect registered accounts & verify credentials:
npm run users

# Test Authentication & UTM email validation:
npm run test:auth

# Test Order Negotiation:
npm run test:order

# Test Handover & Dispute resolution:
npm run test:transaction

# Test Mutual Rating system:
node scripts/testReviewOffline.js

# Test Admin Dashboard moderation actions:
node scripts/testAdminOffline.js

# Test AI Recommendation Engine:
npm run test:recommendation
```

---

## 🌐 Deployment Guide (Render + Atlas)

### Frontend & Backend Deployment (Render)
1. Push repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), create a **New Web Service**.
3. Link your repository `EZ-SWAP`.
4. Configure settings:
   - **Root Directory**: `.`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add Environment Variables from `.env` (`MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`).
6. Deploy and note your production URL (e.g., `https://ez-swap-api.onrender.com`).

