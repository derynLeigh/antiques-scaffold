import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit reads this to generate and apply SQL migrations.
 *
 *   npx drizzle-kit generate   -> writes versioned SQL to ./drizzle
 *   npx drizzle-kit migrate    -> applies pending migrations to Neon
 *
 * Generate-then-migrate (rather than `push`) keeps a reviewable SQL
 * history in your repo — worth the small extra step because you can
 * see exactly what DDL runs against your database, which matters once
 * there's real data you don't want to lose.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
