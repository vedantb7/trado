<div align="center">

# 🛡️ Trado - IITGN Campus Marketplace

**A full-stack, real-time peer-to-peer trading platform built exclusively for the IIT Gandhinagar community.**

[![Live App](https://img.shields.io/badge/Live%20App-trado--j935.onrender.com-4f46e5?style=for-the-badge&logo=vercel)](https://trado-j935.onrender.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Replica%20Set-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Feature Set](#-feature-set)
- [Data Model](#-data-model)
- [Tech Stack](#-tech-stack)
- [Local Setup (New Device)](#-local-setup-new-device)
- [Environment Variables](#-environment-variables)
- [Running & Building](#-running--building)
- [Admin Access](#-granting-admin-access)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Deployment](#-deployment)

---

## 🔭 Overview

Trado is a **premium, real-time campus marketplace** designed from the ground up for the **IIT Gandhinagar** student community. It solves the problem of informal, trust-deficient secondhand trading (WhatsApp groups, notice boards) by providing a structured, verified, and feature-rich platform.

**Key design goals:**
- **Zero-friction trust** — Every user is a verified `@iitgn.ac.in` account. No strangers, no spam.
- **Real-time negotiation** — Offers, counter-offers, and chat happen live via WebSockets.
- **Reputation system** — A multi-factor Karma score incentivizes fair, honest trading.
- **Safe handshake** — Every completed deal uses a unique code verified by both parties, preventing ghosting.
- **Admin moderation** — A dedicated control panel lets admins manage flags, orders, and user trust.

---

## 🏗️ Architecture

Trado uses a **hybrid Next.js + Express** architecture to work around the App Router's lack of persistent WebSocket support.

```
┌─────────────────────────────────────────────────────────────┐
│                         server.js                           │
│   Custom Node.js Entry Point (Express + Socket.io bridge)   │
│                                                             │
│  ┌──────────────┐          ┌───────────────────────────┐   │
│  │  Socket.io   │          │      Next.js App Router    │   │
│  │  WebSocket   │◄────────►│  (Pages, API Routes, SSR)  │   │
│  │  Server      │          └────────────┬──────────────┘   │
│  └──────────────┘                       │                   │
│                                         ▼                   │
│                              ┌──────────────────┐           │
│                              │   Prisma ORM     │           │
│                              └────────┬─────────┘           │
│                                       │                     │
│                              ┌────────▼─────────┐           │
│                              │  MongoDB Replica  │           │
│                              │      Set (rs0)    │           │
│                              └──────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

**Why a custom server?**
Next.js 14 App Router runs on the edge/serverless runtime, which does not support persistent TCP connections. `server.js` wraps Next.js inside a standard Node.js HTTP server, attaching `Socket.io` to the same port. The `io` instance is stored on `global._io` so any Next.js API Route can emit real-time events without a separate WebSocket service.

**Why MongoDB Replica Set?**
Prisma requires a **MongoDB Replica Set** to support multi-document ACID transactions (used in offer acceptance, handshake completion, and Karma recalculation). A single-node replica set (`rs0`) is sufficient for local development.

---

## ✨ Feature Set

### 🔐 Authentication & Trust
| Feature | Details |
|---|---|
| **Google OAuth** | Via NextAuth.js; restricted exclusively to `@iitgn.ac.in` emails |
| **Account-switch support** | `prompt: select_account` lets users switch between Google accounts |
| **JWT sessions** | Session tokens carry `id`, `roles[]`, and `karmaScore` — no extra DB round-trips per request |
| **Account suspension** | Admins can suspend users with a reason; suspended users are blocked from trading |

### 🛒 Listings & Marketplace
| Feature | Details |
|---|---|
| **Post listings** | Title, description, category, price, photos (via Cloudinary), hostel location, urgent flag |
| **Categories** | Electronics, Books, Cycles, Hostel Gear |
| **Search & Filter** | By category, price range, hostel, urgency |
| **Dynamic Watchlist** | Bookmarked items display a **"Price Drop"** badge when the seller lowers the price |

### 💬 Real-time Negotiation
| Feature | Details |
|---|---|
| **Make an Offer** | Buyers propose a price on any listing |
| **Counter-offer** | Sellers can counter; the cycle repeats until both sides agree |
| **Offer Chat** | Every offer has a dedicated Socket.io chat room; messages are persisted to MongoDB |
| **Typing Indicators** | Real-time `user_typing` events broadcast to the room |
| **Auto-lock** | Chat for `Completed` or `Declined` offers is blocked at the server level |

### 🤝 Secure Handshake
When an offer is `Accepted`, a **unique alphanumeric code** is generated and shared with both parties (buyer and seller). Both must confirm the code in-person to mark the deal as `Completed`. This prevents:
- Buyer claiming they paid without handing over money
- Seller marking a deal done before the physical exchange

### ⭐ Karma Reputation System

Karma is a dynamic floating-point score that is **recalculated** after every completed deal or peer review.

```
Karma = 10 (base)
      + min(20, (days_active / 30) × 2)          ← Account Age (max +20)
      + (completed_deals × 5)                     ← Trade History
      + (avg_rating - 3) × min(review_count, 20) × 1.5  ← Peer Reviews (±60)
```

- A **new user** starts at ~10.
- A single 5-star review moves the needle slightly; **consistent 5-stars from 20+ reviews** can add up to +60.
- Consistent 1-stars can subtract up to 60 points, signalling an untrustworthy trader.

### 🚩 Moderation & Admin Panel
| Feature | Details |
|---|---|
| **Flag system** | Any user can flag a listing or another user with a reason |
| **Flag review** | Admins see all `Pending` flags and can mark them `Resolved` or `Dismissed` |
| **Order management** | Admins can view all platform orders (offers) |
| **User suspension** | Admins can suspend/unsuspend accounts with a reason |
| **Role management** | Roles are stored as an array (`Buyer`, `Seller`, `Admin`) for fine-grained access |

### 📱 Progressive Web App (PWA)
Trado is configured as a PWA via `next-pwa`. On supported browsers, users can install it to their home screen for a native-app-like experience.

---

## 🗄️ Data Model

The Prisma schema defines the following core entities:

```
User ──────────────┬── Listing (1:N, as Seller)
     │             ├── Offer   (1:N, as Buyer)
     │             ├── Review  (1:N, given & received)
     │             ├── Bookmark (1:N)
     │             └── Flag    (1:N, as Reporter)

Listing ───────────┬── Offer   (1:N)
                   └── Bookmark (1:N)

Offer ─────────────┬── ChatRoom (1:1)
                   └── Review   (via offerId)

ChatRoom ──────────── Message  (1:N)
```

**Key design choices:**
- `Offer.handshakeCode` is generated server-side on acceptance and stored hashed.
- `Bookmark.priceAtBookmark` captures the listing price at the time of bookmarking — enabling the Price Drop badge.
- `Message.isSystem` distinguishes user chat messages from system-generated events (e.g., "Offer Accepted").
- `User.roles` is a **string array** so a single account can hold multiple roles (e.g., `["Seller", "Admin"]`).

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework, SSR, API Routes |
| **Language** | TypeScript 5 | Type safety across frontend & backend |
| **Runtime** | Node.js + Express (`server.js`) | Custom server for Socket.io integration |
| **Real-time** | Socket.io 4 | Bidirectional WebSocket events |
| **Database** | MongoDB (Replica Set) | Document store with ACID transaction support |
| **ORM** | Prisma 6 | Type-safe database client & schema management |
| **Authentication** | NextAuth.js 4 | Google OAuth, JWT sessions |
| **Image Hosting** | Cloudinary | CDN-backed image upload & transformation |
| **Styling** | Vanilla CSS (Global Design System) | Glassmorphic UI, CSS custom properties |
| **PWA** | next-pwa | Service worker, offline support, installability |

---

## 💻 Local Setup (New Device)

Follow these steps **in order** to get Trado fully running on any new machine.

### Prerequisites

Ensure the following are installed:
- **Node.js** ≥ 18.x — [nodejs.org](https://nodejs.org/)
- **npm** ≥ 9.x (bundled with Node.js)
- **MongoDB** ≥ 6.x (local) **or** Docker — [mongodb.com](https://www.mongodb.com/) / [docker.com](https://www.docker.com/)
- **Git** — [git-scm.com](https://git-scm.com/)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/vedantb7/trado.git
cd trado
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

---

### Step 3 — Set Up MongoDB Replica Set

Prisma **requires** a MongoDB Replica Set to enable transactions. Choose one option:

#### Option A — Docker (Recommended for new setups)

```bash
# Pull and start a MongoDB container with replica set enabled
docker run -d \
  --name trado-mongo \
  -p 27017:27017 \
  mongo:latest --replSet rs0

# Wait ~3 seconds, then initialize the replica set
docker exec -it trado-mongo mongosh --eval "rs.initiate()"
```

Verify it worked — you should see `"ok": 1` in the output.

#### Option B — Local `mongod` (Linux / macOS)

1. Open your MongoDB config (usually `/etc/mongod.conf`):
   ```yaml
   replication:
     replSetName: "rs0"
   ```

2. Restart and initiate:
   ```bash
   sudo systemctl restart mongod
   mongosh --eval "rs.initiate()"
   ```

#### Option C — MongoDB Atlas (Cloud)

Use a free Atlas M0 cluster. Atlas clusters are replica sets by default.

Your `DATABASE_URL` will look like:
```
mongodb+srv://USER:PASSWORD@cluster.mongodb.net/trado?retryWrites=true&w=majority
```

---

### Step 4 — Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set all required values (see [Environment Variables](#-environment-variables) below).

---

### Step 5 — Set Up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project (or reuse an existing one)
3. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs**
4. Application type: **Web application**
5. Add Authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback/google` (local dev)
   - `https://your-production-domain.com/api/auth/callback/google` (production)
6. Copy your **Client ID** and **Client Secret** into `.env`

> **Note:** Only `@iitgn.ac.in` accounts will be permitted through the sign-in gate. This is enforced server-side in `src/lib/auth.ts`.

---

### Step 6 — Set Up Cloudinary (for Image Uploads)

1. Create a free account at [cloudinary.com](https://cloudinary.com/)
2. In the **Dashboard**, note your **Cloud Name**
3. Go to **Settings → Upload → Upload Presets → Add upload preset**
   - Set **Signing Mode** to `Unsigned` (required for client-side uploads)
4. Copy the cloud name and preset name into `.env`

> **Note:** Cloudinary is optional for basic local testing. Listings can be created without images.

---

### Step 7 — Initialize the Database

Push the Prisma schema to MongoDB and generate the client:

```bash
npx prisma generate
npx prisma db push
```

You can visually inspect the database using Prisma Studio:

```bash
npx prisma studio
# Opens at http://localhost:5555
```

---

### Step 8 — Run the Development Server

```bash
npm run dev
```

The app will be available at: **[http://localhost:3001](http://localhost:3001)**

> **Why port 3001?** The custom Express + Socket.io server in `server.js` listens on `3001` (or `$PORT` in production). Standard Next.js dev on port `3000` is not used.

---

## 🔑 Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# ─── Database ───────────────────────────────────────────────────────────────
# Local MongoDB Replica Set:
DATABASE_URL="mongodb://127.0.0.1:27017/trado?replicaSet=rs0&directConnection=true"

# OR MongoDB Atlas:
# DATABASE_URL="mongodb+srv://USER:PASS@cluster.mongodb.net/trado?retryWrites=true&w=majority"

# ─── NextAuth ────────────────────────────────────────────────────────────────
# Google OAuth credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"

# A random 32-character secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-32-char-random-secret"

# Must match the port your server runs on
NEXTAUTH_URL="http://localhost:3001"

# ─── Cloudinary ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-unsigned-preset"
# CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"  # Optional
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | MongoDB connection URI (must include a replica set) |
| `GOOGLE_CLIENT_ID` | ✅ Yes | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | OAuth 2.0 client secret |
| `NEXTAUTH_SECRET` | ✅ Yes | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✅ Yes | Full URL where the app is running |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ⚠️ Optional | Required for image uploads |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | ⚠️ Optional | Required for image uploads |

---

## 🚀 Running & Building

| Command | Description |
|---|---|
| `npm run dev` | Starts the custom Node.js server (Next.js + Socket.io) in dev mode |
| `npm run build` | Compiles the Next.js production bundle |
| `npm start` | Runs the compiled production bundle via `server.js` |
| `npm run lint` | Runs ESLint |
| `npx prisma generate` | Regenerates the Prisma client (run after schema changes) |
| `npx prisma db push` | Syncs the Prisma schema to MongoDB (creates indexes, etc.) |
| `npx prisma studio` | Opens the visual database browser at `localhost:5555` |

---

## 👑 Granting Admin Access

Admin roles are managed directly in MongoDB. To promote a user to Admin:

```bash
# Open a mongo shell (local)
mongosh

# OR if using Docker:
docker exec -it trado-mongo mongosh
```

Then run:

```javascript
use trado;

db.User.updateOne(
  { email: "user.email@iitgn.ac.in" },
  { $set: { roles: ["Admin"] } }
);
```

To grant both Seller and Admin roles simultaneously:

```javascript
db.User.updateOne(
  { email: "user.email@iitgn.ac.in" },
  { $set: { roles: ["Buyer", "Seller", "Admin"] } }
);
```

Admin users gain access to the `/admin` panel which includes:
- **Flag Management** — Review and resolve community reports
- **Order Management** — Inspect all platform offers/deals
- **User Management** — Suspend/unsuspend accounts

---

## 📁 Project Structure

```
trado/
├── server.js                   # Custom Node.js entry point (Express + Socket.io)
├── next.config.mjs             # Next.js config (PWA, image domains)
├── prisma/
│   └── schema.prisma           # Full database schema (models, enums, relations)
├── prisma.config.ts            # Prisma Studio config
├── .env.example                # Environment variable template
├── docs/
│   └── problem-statement.pdf   # Original project brief
└── src/
    ├── app/                    # Next.js App Router
    │   ├── layout.tsx          # Root layout (fonts, session provider)
    │   ├── page.tsx            # Landing / redirect page
    │   ├── loading.tsx         # Global loading UI
    │   ├── login/              # Login page
    │   ├── auth/               # NextAuth callback & error pages
    │   ├── dashboard/          # User dashboard (listings, offers, karma)
    │   ├── listings/           # Listing browse + detail pages
    │   │   └── [id]/           # Dynamic listing detail page
    │   ├── sell/               # Create new listing page
    │   ├── offers/             # Offer management + chat interface
    │   ├── profile/            # Public user profile pages
    │   └── admin/              # Admin-only panel
    │       ├── flags/          # Flag review interface
    │       └── orders/         # Order management interface
    │
    ├── api/                    # Next.js API Routes (REST endpoints)
    │   ├── auth/               # NextAuth handler
    │   ├── listings/           # CRUD for listings
    │   ├── offers/             # Offer lifecycle (propose, counter, accept, decline)
    │   ├── bookmarks/          # Watchlist management
    │   ├── messages/           # Chat message history
    │   ├── reviews/            # Post-trade peer reviews
    │   ├── profiles/           # User profile data
    │   ├── flags/              # Flag submission
    │   └── admin/              # Admin-only API endpoints
    │
    ├── components/             # Reusable UI components
    │   ├── layout/             # Navbar, Shell
    │   ├── listings/           # ListingCard, ListingGrid, filters
    │   ├── chat/               # ChatWindow, MessageBubble
    │   └── home/               # Hero, FeaturedListings
    │
    ├── lib/                    # Core business logic & utilities
    │   ├── auth.ts             # NextAuth config (OAuth, JWT callbacks, domain guard)
    │   ├── prisma.ts           # Prisma client singleton
    │   ├── karma.ts            # Karma score recalculation engine
    │   ├── handshake.ts        # Handshake code generation
    │   ├── socket.ts           # Client-side Socket.io connection helper
    │   └── listingsWithSellers.ts  # Shared Prisma query helpers
    │
    ├── hooks/                  # Custom React hooks
    └── providers/              # React context providers (SessionProvider, SocketProvider)
```

---

## 🌐 API Overview

All API routes are under `/api/` and are protected by server-side session checks. Here is a summary of the key endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/listings` | Fetch all available listings (with filters) |
| `POST` | `/api/listings` | Create a new listing |
| `GET` | `/api/listings/[id]` | Get a single listing with seller info |
| `PATCH` | `/api/listings/[id]` | Update a listing |
| `DELETE` | `/api/listings/[id]` | Delete a listing |
| `POST` | `/api/offers` | Create a new offer on a listing |
| `GET` | `/api/offers/[id]` | Get offer details + chat room |
| `PATCH` | `/api/offers/[id]` | Update offer (counter, accept, decline, complete) |
| `GET` | `/api/messages/[roomId]` | Fetch chat history for a room |
| `POST` | `/api/bookmarks` | Add/remove a bookmark |
| `POST` | `/api/reviews` | Submit a peer review after trade |
| `POST` | `/api/flags` | Submit a flag/report |
| `GET` | `/api/admin/flags` | (Admin) List all flags |
| `PATCH` | `/api/admin/flags/[id]` | (Admin) Resolve or dismiss a flag |
| `GET` | `/api/admin/offers` | (Admin) List all platform offers |
| `PATCH` | `/api/admin/offers/[id]` | (Admin) Manage an offer |

---

## ☁️ Deployment

Trado is deployed on **[Render](https://render.com/)** as a Web Service using the Node.js runtime.

### Key Deployment Settings

| Setting | Value |
|---|---|
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `node server.js` |
| **Environment** | All variables from `.env` must be added as Render Environment Variables |
| **Database** | MongoDB Atlas (free M0 tier is sufficient) |

### Production Checklist

- [ ] `DATABASE_URL` points to MongoDB Atlas (not `localhost`)
- [ ] `NEXTAUTH_URL` is set to the live production domain (e.g., `https://trado-j935.onrender.com`)
- [ ] Google OAuth Authorized redirect URI includes the production callback URL
- [ ] `NEXTAUTH_SECRET` is a strong random value (not the example placeholder)
- [ ] Cloudinary upload preset exists and is set to `Unsigned`

---

<div align="center">

Built for the IITGN community · [Live App](https://trado-j935.onrender.com/)

</div>
