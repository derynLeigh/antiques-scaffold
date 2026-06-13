import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Neon's HTTP driver is built for serverless: each query is a stateless
 * HTTP request, so there's no connection pool to exhaust when Vercel
 * spins up many short-lived function instances. This is the specific
 * reason we chose Neon over a traditional Postgres + pooler setup.
 *
 * Passing the schema in gives you the fully-typed query API
 * (db.query.items.findMany(...)) alongside the SQL-style builder.
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
