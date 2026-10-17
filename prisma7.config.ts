import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // الرابط المباشر (بدون pooler) لأوامر Prisma CLI والـmigrations
    url: process.env["DATABASE_URL"],
  },
});