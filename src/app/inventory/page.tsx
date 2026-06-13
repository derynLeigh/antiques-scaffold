import { auth } from "@/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * The first page behind the gate. For Phase 0 it just proves three things
 * are wired together: the session (you only see this if signed in), the
 * database (it counts rows), and the schema (the import resolves).
 *
 * In Phase 3 this becomes the real inventory list. For now it's the
 * "hello, the stack holds together" page — the end of your first thin
 * vertical slice.
 */
export default async function InventoryPage() {
  const session = await auth();

  // Cheap query that confirms the Neon connection and schema are live.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(items);

  return (
    <main style={{ maxWidth: 720, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Inventory</h1>
      <p style={{ color: "#666" }}>
        Signed in as {session?.user?.email}. Items in database: {count}.
      </p>
      <p style={{ color: "#999", fontSize: 14, marginTop: "2rem" }}>
        This stub confirms auth, the database connection, and the schema
        are all wired together. The real item list arrives in Phase 3.
      </p>
    </main>
  );
}
