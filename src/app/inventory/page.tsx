import Link from "next/link";
import { desc } from "drizzle-orm";
import { getSession } from "@/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { publicUrl } from "@/lib/r2";
import { parseItemFilters, buildItemWhere } from "@/lib/item-filters";
import { FilterBar } from "./FilterBar";
import { signOut } from "./sign-out";
import { formatPrice, statusLabel, locationLabel, formatDate } from "@/lib/format";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; minPrice?: string; maxPrice?: string; from?: string; to?: string; }>;
}) {
  const session = await getSession();

  const sp = await searchParams;
  const filters = parseItemFilters(sp);
  const where = buildItemWhere(filters);

  const allItems = await db.select().from(items).where(where).orderBy(desc(items.createdAt));

  return (
    <main style={{ maxWidth: 960, margin: "3rem auto", padding: "0 1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Inventory</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#666", fontSize: 14 }}>
            {allItems.length} item{allItems.length === 1 ? "" : "s"}
            {session?.user?.name ? ` · ${session.user.name}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/inventory/new" style={{ padding: "0.55rem 1rem", background: "#111", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 14 }}>
            + Add item
          </Link>
          <form action={signOut}>
            <button type="submit" style={{ padding: "0.55rem 0.9rem", background: "#fff", color: "#666", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <FilterBar current={sp} />

      {allItems.length === 0 ? (
        <p style={{ color: "#666" }}>
          {filters.q || filters.minPence !== undefined || filters.maxPence !== undefined || filters.from || filters.to ? (
            <>No items match these filters. <Link href="/inventory">Clear filters</Link>.</>
          ) : (
            <>No items yet. <Link href="/inventory/new">Add your first one</Link>.</>
          )}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
          {allItems.map((item) => (
            <li key={item.id} style={{ border: "1px solid #e5e5e5", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
              <Link href={`/inventory/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ aspectRatio: "4 / 3", background: "#f3f3f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.thumbKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={publicUrl(item.thumbKey)} alt={item.description} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#bbb", fontSize: 13 }}>No photo</span>
                  )}
                </div>
                <div style={{ padding: "0.75rem" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>
                  <p style={{ margin: "0.4rem 0 0", fontSize: 14 }}>{formatPrice(item.pricePence)}</p>
                  <p style={{ margin: "0.4rem 0 0", fontSize: 12, color: "#666", display: "flex", gap: "0.5rem" }}>
                    <span style={{ padding: "0.1rem 0.4rem", borderRadius: 4, background: item.status === "sold" ? "#fde2e2" : "#e2f0e2", color: item.status === "sold" ? "#a11" : "#161" }}>
                      {statusLabel(item.status)}
                    </span>
                    <span>{locationLabel(item.location)}</span>
                  </p>
                  <p style={{ margin: "0.4rem 0 0", fontSize: 12, color: "#999" }}>Added {formatDate(item.createdAt)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
