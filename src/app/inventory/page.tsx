import Link from "next/link";
import { Suspense } from "react";
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
import { Toast } from "./Toast";
import { ItemGrid, type ItemView } from "./ItemGrid";
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

  // Build view-models for the client grid: pre-compute image URLs (publicUrl
  // is server-only) and convert Dates to millisecond numbers (Dates don't
  // serialize across the server/client boundary). The client component gets
  // plain, serializable data and never imports server-only modules.
  const itemViews: ItemView[] = pageItems.map((item) => ({
    id: item.id,
    description: item.description,
    condition: item.condition,
    dimensions: item.dimensions,
    pricePence: item.pricePence,
    costPence: item.costPence,
    status: item.status,
    location: item.location,
    listingUrl: item.listingUrl,
    createdAtMs: item.createdAt.getTime(),
    soldAtMs: item.soldAt ? item.soldAt.getTime() : null,
    thumbUrl: item.thumbKey ? publicUrl(item.thumbKey) : null,
    imageUrl: item.imageKey ? publicUrl(item.imageKey) : null,
  }));

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <Suspense>
        <Toast />
      </Suspense>
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
          <ItemGrid items={itemViews} />

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
