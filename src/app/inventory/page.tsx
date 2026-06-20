import Link from "next/link";
import { desc, count } from "drizzle-orm";
import { getSession } from "@/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { publicUrl } from "@/lib/r2";
import {
  parseItemFilters,
  buildItemWhere,
  parsePage,
  pageHref,
  PAGE_SIZE,
} from "@/lib/item-filters";
import { FilterBar } from "./FilterBar";
import { signOut } from "./sign-out";
import { ThemeToggle } from "../ThemeToggle";
import { formatPrice, statusLabel, locationLabel, formatDate } from "@/lib/format";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; minPrice?: string; maxPrice?: string; from?: string; to?: string; page?: string; }>;
}) {
  const session = await getSession();

  const sp = await searchParams;
  const filters = parseItemFilters(sp);
  const where = buildItemWhere(filters);
  const page = parsePage(sp.page);

  // Total matching count drives how many pages exist. Separate query from
  // the page slice — it counts all matches, the slice fetches only 8.
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(items)
    .where(where);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Clamp the requested page to the valid range (e.g. if filters shrank
  // the result set below the current page).
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const pageItems = await db
    .select()
    .from(items)
    .where(where)
    .orderBy(desc(items.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

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
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Inventory</h1>
          <p className="mt-1 text-sm text-muted">
            {total} item{total === 1 ? "" : "s"}
            {session?.user?.name ? ` · ${session.user.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
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

      {pageItems.length === 0 ? (
        <p className="mt-10 text-center text-muted">
          {hasFilters ? (
            <>
              No items match these filters.{" "}
              <Link href="/inventory" className="text-accent underline underline-offset-2">Clear filters</Link>.
            </>
          ) : (
            <>
              No items yet.{" "}
              <Link href="/inventory/new" className="text-accent underline underline-offset-2">Add your first one</Link>.
            </>
          )}
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
            {pageItems.map((item) => (
              <li
                key={item.id}
                className="overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-sm"
              >
                <Link href={`/inventory/${item.id}`} className="block text-inherit no-underline">
                  <div className="flex aspect-[4/3] items-center justify-center bg-paper">
                    {item.thumbKey ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={publicUrl(item.thumbKey)} alt={item.description} className="h-full w-full object-cover" />
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

          {totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {currentPage > 1 ? (
                <Link
                  href={pageHref(sp, currentPage - 1)}
                  className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm text-ink transition-colors hover:bg-paper"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="rounded-lg border border-line px-3.5 py-2 text-sm text-faint">← Previous</span>
              )}

              <span className="px-3 text-sm text-muted">
                Page {currentPage} of {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={pageHref(sp, currentPage + 1)}
                  className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm text-ink transition-colors hover:bg-paper"
                >
                  Next →
                </Link>
              ) : (
                <span className="rounded-lg border border-line px-3.5 py-2 text-sm text-faint">Next →</span>
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
