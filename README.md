# Bazaar@IITGN | The Community Exchange 🎓♻️

**Bazaar@IITGN** is a high-performance, premium Progressive Web Application (PWA) designed to revolutionize peer-to-peer trading at IIT Gandhinagar. Orchestrated for the Student Academic Council (SAC), it replaces fragmented WhatsApp groups with a verified, trust-based transactional engine.

Built for **HackRush'26**, this platform prioritizes campus safety, verified identity, and high-velocity negotiation.

---

## 🏛️ The Four Pillars

1. **Identity & Profile (@iitgn.ac.in):** Mandatory Google OAuth restricted to campus emails. Every user has a **Karma Score** derived from their trading history.
2. **Smart Listings:** Hyper-local filtering (Aiyana, Beauki, Chimair) and **AI-powered tagging** for automated item categorization and price insights.
3. **Transaction Layer:** A real-time **Offer State Machine** (Proposed → Countered → Accepted) and a built-in negotiation chat via WebSockets.
4. **Safety & Reliability:** **Verified Handshake** (QR/OTP logic) for physical exchanges and full offline support via PWA Service Workers.

---

## 🛠️ Technical Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, CSS Modules.
- **Backend:** Next.js API Routes, Node.js.
- **Database:** PostgreSQL with **Prisma ORM** for atomic state management.
- **Real-time:** Socket.io for immediate chat and offer updates.
- **Media:** Cloudinary for high-performance image hosting and verification.
- **PWA:** `next-pwa` for offline reliability and mobile-first experience.

---

## ⚙️ Setup & Installation

Follow these steps to replicate the environment:

### 1. Prerequisites
Ensure you have **Node.js 18+**, **PostgreSQL**, and the following cloud credentials:
- **Google Cloud Console:** Client ID and Secret (restricted to `@iitgn.ac.in`).
- **Cloudinary:** Cloud name and upload preset.

### 2. Clone and Install
```bash
git clone https://github.com/your-repo/bazaar-iitgn.git
cd bazaar-iitgn
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and populate it:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/trado_db"

# NextAuth (Google OAuth)
GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"
NEXTAUTH_SECRET="random-string-for-session"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="bazaar_preset"
```

### 4. Database Initialization
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Run the Engine
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see Bazaar in action.

---

## 🚀 Advanced Features

### 🤝 The Verified Handshake
To ensure security, once an offer is "Accepted", the seller generates a unique **Handshake Code**. The buyer must scan/input this code during the physical meeting to formally complete the transaction and unlock the **Karma rewards**.

### 🤖 AI Brownie Points
- **Auto-Tagging:** The platform uses keyword extraction to automatically tag listings (e.g., "Used," "Mint," "Urgent").
- **Pricing Insights:** Real-time calculation of average campus prices for specific categories to help sellers price competitively.

### 🍱 Inventory Sync
The moment a deal is accepted, the item is marked as **"Reserved."** Once the handshake is verified, it transitions to **"Sold,"** ensuring no race conditions for popular campus items like Cycles or Kindle.

---

## 📜 Authors & Stakeholders
- **Stakeholders:** Vivek Raj, Akshit Chhabra.
- **Built for:** Student Academic Council (IIT Gandhinagar) - HackRush'26.
- **Current Context:** April 04, 2026.
