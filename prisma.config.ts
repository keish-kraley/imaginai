import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is required at runtime (migrate / db seed) but may be absent
// during `prisma generate` at Docker build time. Fall back to a placeholder so
// generate succeeds; migrate deploy will surface a clear connection error.
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
