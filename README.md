# Trado: IITGN Campus Marketplace

Trado is a premium, real-time campus marketplace designed exclusively for the IIT Gandhinagar community. It enables students to buy, sell, and negotiate deals securely within the campus.

---

## 🚀 Quick Setup (New Device)

Follow these steps to get Trado up and running on your local machine.

### 1. Clone and Install
```bash
git clone https://github.com/your-username/trado.git
cd trado
npm install
```

### 2. Configure MongoDB (Replica Set Required)
Trado requires a MongoDB Replica Set for Prisma transactions.

**Using Docker (Easiest):**
```bash
docker run -d --name trado-mongo -p 27017:27017 mongo:latest --replSet rs0
docker exec -it trado-mongo mongosh --eval "rs.initiate()"
```

**Local Mongod (Linux/Mac):**
Ensure `replication.replSetName: "rs0"` is in your `mongod.conf`, then:
```bash
sudo systemctl restart mongod
mongosh --eval "rs.initiate()"
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET
# Recommended: DATABASE_URL="mongodb://127.0.0.1:27017/trado?replicaSet=rs0&directConnection=true"
```

### 4. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Launch
```bash
npm run dev
```
Accessible at: [http://localhost:3001](http://localhost:3001)

---

## ✨ Features

### 🛒 Marketplace Essentials
- **Campus Listings**: Post and browse items with categories, hostel locations, and high-quality images via Cloudinary.
- **Dynamic Side Scroller**: Interactive "Freshly Added" section with smooth horizontal navigation arrows for quick discovery.
- **Urgent Badges**: Real-time visual indicators for time-sensitive deals.

### 🤝 Trading & Negotiation
- **Real-time Offers**: Propose and counter-offer prices instantly using Socket.io.
- **Secure Chat**: Negotiate safely within the platform's integrated chat rooms.
- **Handshake System**: Verified deal completion with unique handshake codes for trust.

### 📊 Active Hub (User Profile)
- **Central Dashboard**: Tracking center for your entire market activity.
- **Buying Track**: Manage all your active bids and negotiation statuses.
- **Selling Track**: Monitor your active listings and incoming offers.
- **Watchlist (Bookmarks)**: Save listings for later with a single click.

### 🔔 Smart Notifications
- **Price-Drop Alerts**: Automatically notified via UI badges in your Watchlist when a seller lowers the price of a saved item.
- **Karma Score**: Dynamic reputation system based on successful trades and community reviews.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Real-time**: Socket.io + Express Custom Server
- **Database**: MongoDB + Prisma ORM
- **Auth**: NextAuth.js (Email restricted to `@iitgn.ac.in`)
- **Styling**: Vanilla CSS with Modern Glassmorphism
- **Images**: Cloudinary Integration

---

## 📂 Project Structure
- `server.js`: Combined Next.js & Socket.io server.
- `src/app/`: Core application routes and logic.
- `src/components/`: Reusable UI components (Listings, Chat, Layout).
- `prisma/`: Database schema and migrations.
- `public/`: Static assets and PWA configuration.
