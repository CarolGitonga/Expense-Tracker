import { db } from "./client";
import { categories } from "./schema";

async function main() {
  const names = ["Food", "Transport", "Bills", "Shopping", "Entertainment"];

  for (const name of names) {
    try {
      await db.insert(categories).values({ name });
    } catch {
      // ignore duplicates
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
