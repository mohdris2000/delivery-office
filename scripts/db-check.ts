import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL_POOLED!,
  });
  const prisma = new PrismaClient({ adapter });
  try {
    const count = await prisma.driver.count();
    console.log("OK - drivers count:", count);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});