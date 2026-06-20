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

  const hasFilters =
    filters.q ||
    filters.minPence !== undefined ||
    filters.maxPence !== undefined ||
    filters.from ||
    filters.to;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-muted">
            {allItems.length} item{allItems.length === 1 ? "" : "s"}
            {session?.user?.name ? ` · ${session.user.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/inventory/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Add item
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm text-muted transition-colors hover:bg-paper"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <FilterBar current={sp} />

      {allItems.length === 0 ? (
        <p className="mt-10 text-center text-muted">
          {hasFilters ? (
            <>
              No items match these filters.{" "}
              <Link href="/inventory" className="text-accent underline underline-offset-2">
                Clear filters
              </Link>
              .
            </>
          ) : (
            <>
              No items yet.{" "}
              <Link href="/inventory/new" className="text-accent underline underline-offset-2">
                Add your first one
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          {allItems.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-sm"
            >
              <Link href={`/inventory/${item.id}`} className="block text-inherit no-underline">
                <div className="flex aspect-[4/3] items-center justify-center bg-paper">
                  {item.thumbKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicUrl(item.thumbKey)}
                      alt={item.description}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-faint">No photo</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="truncate font-medium text-ink">{item.description}</p>
                  <p className="mt-1.5 text-base text-ink">{formatPrice(item.pricePence)}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span
                      className={
                        item.status === "sold"
                          ? "rounded bg-sold-bg px-1.5 py-0.5 text-sold-text"
                          : "rounded bg-sale-bg px-1.5 py-0.5 text-sale-text"
                      }
                    >
                      {statusLabel(item.status)}
                    </span>
                    <span className="text-muted">{locationLabel(item.location)}</span>
                  </div>
                  <p className="mt-2 text-xs text-faint">Added {formatDate(item.createdAt)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
