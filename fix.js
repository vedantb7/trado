const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB hotfix...");
  
  // Mapping of old hostels to new hostels
  const updates = [
    { old: "Aiyana", new: "Aibaan" },
    { old: "Duari", new: "Duven" },
    { old: "Ekaant", new: "Emiet" },
    { old: "Falgun", new: "Firpeal" },
    { old: "Gagan", new: "Griwiksh" },
    { old: "Hridaya", new: "Hiqom" },
    { old: "Indu", new: "Ijokha" },
    { old: "Jasubai", new: "Jurqia" } // Also maybe some had unknown, but let's just force all old ones.
  ];

  for (const { old, new: newName } of updates) {
    try {
      const result = await prisma.$runCommandRaw({
        update: "Listing",
        updates: [
          {
            q: { locationHostel: old },
            u: { $set: { locationHostel: newName } },
            multi: true
          }
        ]
      });
      console.log(`Updated ${old} -> ${newName}:`, result);
    } catch (err) {
      console.error(`Failed to update ${old}:`, err);
    }
    
    // Also update any Offers and Messages if they have embedded data (maybe they don't have hostel field, but let's be safe). 
    // Wait, the error is inside Listing querying.
  }

  console.log("Hotfix finished.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
