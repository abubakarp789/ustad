// npm install --save-dev prisma dotenv
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL is used by Prisma CLI (migrations, db push) — bypasses Supabase's PgBouncer pooler
    // The runtime Prisma Client (src/lib/prisma.ts) uses DATABASE_URL (pooled connection)
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});

