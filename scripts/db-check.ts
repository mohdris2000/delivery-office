import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL_POOLED!,
  });
  const prisma = new PrismaClient({ adapter });
  try {
    const [drivers, orders, settlements] = await Promise.all([
      prisma.driver.count(),
      prisma.order.count(),
      prisma.settlement.count(),
    ]);
    console.log(
      "OK - drivers/orders/settlements:",
      drivers,
      orders,
      settlements,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
