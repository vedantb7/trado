# Bazaar@IITGN | The Community Exchange 🎓♻️

**Bazaar@IITGN** is a high-performance, premium Marketplace designed to revolutionize peer-to-peer trading at IIT Gandhinagar. Orchestrated for the Student Academic Council (SAC), it replaces fragmented WhatsApp groups with a verified, trust-based transactional engine.

---

## 🏛️ The Core Mechanism
1. **Real-time Sync**: Uses a custom Node.js Socket.io bridge for instant chat and offer notifications.
2. **Atomic Trades**: Powered by MongoDB Replica Sets to ensure deal integrity (no race conditions).
3. **Verified Handshake**: Physical exchange verification via unique session codes.
4. **Trust Engine**: Dynamic Karma Score based on successful trade completions.

---

## 🛠️ Installation & Linux Setup

### 1. Prerequisites
- **Node.js**: 20.x or higher.
- **MongoDB**: 6.0+ (Mandatory: **Replica Set** mode).

### 2. Mandatory: MongoDB Replica Set
Prisma transactions (used for Accepting/Completing deals) **require** a replica set.
```bash
# Ubuntu/Debian
# 1. Edit /etc/mongod.conf
# 2. Add or uncomment:
# replication:
#   replSetName: "rs0"

# 3. Restart Mongo
sudo systemctl restart mongod

# 4. Initiate the set in mongosh
mongosh --eval "rs.initiate()"
```

### 3. Setup
```bash
git clone https://github.com/your-username/trado-iitgn.git
cd trado-iitgn
npm install
cp .env.example .env
# Edit .env with your Google & Cloudinary keys
```

### 4. Database Sync
```bash
npx prisma generate
npx prisma db push
```

### 5. Running the App
Bazaar uses a **Custom Server** for real-time WebSocket stability. Don't use `next dev` directly.
```bash
# Start the production-ready dev environment
npm run dev
```
Open [http://localhost:3001](http://localhost:3001)

---

## 🏗️ Architecture
- **Server**: `server.js` (Express + Next.js + Socket.io)
- **Frontend**: Next.js 14 App Router
- **ORM**: Prisma (MongoDB Connector)
- **Real-time**: Custom `useSocket` Hook

---

## 📜 Authors
- **Stakeholders:** Vivek Raj, Akshit Chhabra.
- **Built for:** Student Academic Council (IIT Gandhinagar) - HackRush'26.
