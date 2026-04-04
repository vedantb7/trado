# Trado (Bazaar@IITGN)

Campus marketplace for IIT Gandhinagar: listings, offers, real-time chat via Socket.io, and NextAuth (credentials, `@iitgn.ac.in` only). Built with Next.js 14 (App Router), Prisma, and MongoDB.

## Features

- Browse and post listings (categories, hostel pickup, Cloudinary images)
- Offers, chat rooms, handshake codes, and karma updates
- PWA support (service worker generated on `next dev` / `next build`)
- Custom Node server (`server.js`) so Socket.io shares the same HTTP port as Next.js

## Prerequisites

- **Node.js** 20.x or newer  
- **MongoDB** 6.x+ with a **replica set** (required for Prisma **transactions** when accepting or completing deals)

## 1. Clone and install

```bash
git clone https://github.com/<your-org>/trado.git
cd trado
npm ci
```

Use `npm install` instead of `npm ci` if you do not commit `package-lock.json`.

## 2. MongoDB (replica set)

Prisma uses transactions for critical offer/listing updates. MongoDB must run as a replica set (even a single-node `rs0` is fine).

### Local (Linux example)

1. Enable replication in `/etc/mongod.conf`:

   ```yaml
   replication:
     replSetName: "rs0"
   ```

2. Restart MongoDB and initiate the set:

   ```bash
   sudo systemctl restart mongod
   mongosh --eval 'rs.initiate()'
   ```

3. Use a URI that includes the replica set name, for example:

   `mongodb://localhost:27017/trado?replicaSet=rs0`

### MongoDB Atlas

Use the connection string from Atlas. Atlas clusters are replica sets by default; paste the SRV URL into `DATABASE_URL` in `.env`.

### Docker (quick local node)

```bash
docker run -d --name mongo-rs -p 27017:27017 mongo:7 --replSet rs0
docker exec -it mongo-rs mongosh --eval 'rs.initiate()'
```

Then set `DATABASE_URL="mongodb://127.0.0.1:27017/trado?replicaSet=rs0"`.

## 3. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MongoDB connection string (must include `replicaSet=...` for local single-node setups) |
| `NEXTAUTH_SECRET` | Random secret (e.g. `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App origin; local dev default: `http://localhost:3001` |
| `NEXT_PUBLIC_CLOUDINARY_*` | Optional for uploads; widget falls back to preset name in code if unset |

Authentication is **email + password** for `@iitgn.ac.in` addresses (register tab on `/login`), not Google OAuth.

## 4. Database schema

```bash
npx prisma generate
npx prisma db push
```

Optional: `npx prisma studio` to inspect data.

## 5. Run the app (development)

The app expects the **custom server** so API routes and Socket.io share one process:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). On `/login`, use the **Register** tab with an `@iitgn.ac.in` email, then sign in.

> **Note:** `npm start` runs `next start` only and does **not** start Socket.io. For production-like runs with realtime features, build then run the custom server (see below).

## 6. Production build (local)

```bash
npm run build
NODE_ENV=production node server.js
```

Ensure `NEXTAUTH_URL` points at your public URL when deployed.

## Project layout

| Path | Role |
|------|------|
| `server.js` | HTTP server + Socket.io; mounts Next.js |
| `src/app/` | App Router pages and API routes |
| `prisma/schema.prisma` | Data model (MongoDB) |
| `src/lib/listingsWithSellers.ts` | Listing queries resilient to missing seller users |

## PWA files

Files such as `public/sw.js` and `public/workbox-*.js` are **generated** by `next-pwa`. They are listed in `.gitignore`. After clone, run `npm run dev` or `npm run build` once to create them.

## Pushing to GitHub

```bash
git add -A
git status   # confirm no .env or .next/
git commit -m "Describe your change"
git remote add origin https://github.com/<you>/<repo>.git   # if not set
git push -u origin main
```

Never commit `.env`, `.next/`, `node_modules/`, or generated PWA assets.

## Docs

- `docs/problem-statement.pdf` — original problem statement (if bundled with the repo)

## Credits

Built for the IITGN community / SAC context (e.g. HackRush’26); stakeholders and authors as listed in your course or org materials.
