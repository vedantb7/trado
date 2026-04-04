# MongoDB Setup Guide - Bazaar@IITGN

## Quick Start

### Option 1: Local MongoDB

#### Install MongoDB (Linux/Ubuntu)
```bash
sudo apt-get update
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### Connect and Test
```bash
mongosh  # or mongo in older versions
> show dbs
> exit
```

#### Update .env
```env
DATABASE_URL="mongodb://localhost:27017/trado_db"
```

---

### Option 2: MongoDB Atlas (Cloud - Recommended)

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free account
3. Create a cluster (M0 free tier)
4. Create a database user with password
5. Get connection string from "Connect" → "Drivers"
6. Format: `mongodb+srv://username:password@cluster.mongodb.net/trado_db?retryWrites=true&w=majority`
7. Add to `.env`:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/trado_db?retryWrites=true&w=majority"
```

---

### Option 3: Docker MongoDB

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=trado_db \
  mongo:latest
```

Then use: `DATABASE_URL="mongodb://localhost:27017/trado_db"`

---

## Initialize Database

```bash
cd /mnt/DISK/Web_Dev/trado

# Generate Prisma client
npx prisma generate

# (Optional) Seed database
npx prisma db seed  # if seed file exists

# View database in GUI
npx prisma studio
```

---

## Test Data Commands

```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/trado_db"

# View collections
> show collections

# Check users
> db.User.find().pretty()

# Check listings
> db.Listing.find().pretty()

# Clear all data (caution!)
> db.User.deleteMany({})
```

---

## Important Notes

- ✅ All PostgreSQL references removed
- ✅ Schema optimized for MongoDB with ObjectId fields
- ✅ Prisma handles all queries automatically
- ✅ Decimal prices converted to Float for MongoDB compatibility
- ✅ All relations work with MongoDB

---

## Troubleshooting

**Error: "connect ECONNREFUSED 127.0.0.1:27017"**
- MongoDB not running. Start it: `sudo systemctl start mongodb`

**Error: "connection timeout"**
- If using Atlas, check:
  - IP whitelist in Security settings (add 0.0.0.0/0 for dev)
  - Connection string correct
  - Database user password correct

**Error: "M13 error: no replication set configured"**
- Using old MongoDB version. Update to v4.0+

---

## Quick Commands

```bash
# Start MongoDB
sudo systemctl start mongodb

# Stop MongoDB
sudo systemctl stop mongodb

# View logs
sudo journalctl -u mongodb

# Connect to shell
mongosh

# Reset database
npx prisma migrate reset

# Push schema to MongoDB
npx prisma db push
```

All done! Your project now uses **MongoDB** instead of PostgreSQL.
