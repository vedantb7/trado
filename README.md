# 🛡️ Trado: IITGN Campus Marketplace

Trado is a premium, real-time campus marketplace designed exclusively for the **IIT Gandhinagar** community. It features a high-trust "Campus Portal" aesthetic with strict Google OAuth security and real-time negotiation capabilities.

---

## 🚀 Quick Setup (New Device)

Follow these steps to get Trado up and running on your local machine.

### 1. Clone and Install
```bash
git clone https://github.com/vedantb7/trado.git
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

### 3. Environment Setup (`.env`)
Create a `.env` file in the root directory and paste the following, replacing placeholders with your real keys:

```bash
# MongoDB
DATABASE_URL="mongodb://127.0.0.1:27017/trado?replicaSet=rs0&directConnection=true"

# NextAuth (Google OAuth - Restricted to @iitgn.ac.in)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
NEXTAUTH_SECRET="your-32-char-random-secret"
NEXTAUTH_URL="http://localhost:3001"

# Cloudinary (Image Hosting)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-preset"
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
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

## 🔐 Authentication & Security
- **Strict OAuth**: Login is restricted exclusively to `@iitgn.ac.in` email addresses.
- **Account Selection**: Users can switch between multiple Google accounts during the login flow.
- **Identity Verification**: Profile pictures and names are automatically synced from Google to ensure campus-wide trust.

---

## 👑 Granting Admin Access
To grant a user **Admin** privileges, use the following command in your terminal (`mongosh`):

```javascript
// Connect to the trado database
use trado;

// Update the user's role
db.User.updateOne(
  { email: "user.email@iitgn.ac.in" }, 
  { $set: { roles: ["Admin"] } }
);
```

---

## ✨ Core Features
- **Premium Glassmorphic UI**: High-contrast, transparent interface designed for a modern campus feel.
- **Real-time Negotiation**: Propose, counter-offer, and accept deals instantly via Socket.io.
- **Secure Handshake**: Each deal generates a unique code that both parties must verify to complete the trade.
- **Karma Reputation**: Multi-factor scoring based on account age and successful trade history.
- **Dynamic Watchlist**: Bookmarked items show real-time "Price Drop" badges when sellers lower their prices.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Real-time**: Socket.io + Express Custom Server (`server.js`)
- **Database**: MongoDB + Prisma ORM
- **Authentication**: NextAuth.js (Google Provider)
- **Styling**: Vanilla CSS (Global Design System)
- **Image Hosting**: Cloudinary
