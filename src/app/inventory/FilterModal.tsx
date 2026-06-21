"use client";

import { useState, useEffect } from "react";
import type { SearchParams } from "@/lib/item-filters";

/**
 * Filter modal — a button that opens an overlay containing the full filter
 * form. The form is a GET form (method="get"), so submitting navigates to
 * /inventory?<filters> exactly like the old inline bar did: filters stay
 * URL-driven, shareable, and survive refresh. The modal is just a nicer
 * container for the same form.
 *
 * Reuses the same client-overlay pattern as ItemGrid (open state + Escape
 * + scroll lock + backdrop click) rather than any route machinery.
 *
 * activeCount drives the badge on the button so the user can see at a
 * glance that filters are applied even before opening.
 */
export function FilterModal({
  current,
  activeCount,
}: {
  current: SearchParams;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const field =
    "mt-1 w-full rounded-lg border border-line-strong bg-search-bg px-3 py-2.5 text-base text-ink " +
    "placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 transition-colors";
  const label = "block text-sm font-medium text-ink";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
      >
        Filters
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Filter inventory"
        >
          <div className="relative my-8 w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl sm:p-8">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold tracking-tight text-ink">Filters</h2>

            <form method="get" className="mt-5 flex flex-col gap-4">
              <div>
                <label htmlFor="f-q" className={label}>Search</label>
                <input
                  id="f-q"
                  type="text"
                  name="q"
                  defaultValue={current.q ?? ""}
                  placeholder="Description or condition…"
                  className={field}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="f-status" className={label}>Status</label>
                  <select id="f-status" name="status" defaultValue={current.status ?? ""} className={field}>
                    <option value="">Any</option>
                    <option value="for_sale">For sale</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="f-location" className={label}>Location</label>
                  <select id="f-location" name="location" defaultValue={current.location ?? ""} className={field}>
                    <option value="">Any</option>
                    <option value="centre_a">Donkey's Years Antiques</option>
                    <option value="centre_b">Morley Antiques Centre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="f-min" className={label}>Min £</label>
                  <input id="f-min" type="number" name="minPrice" step="0.01" min="0" defaultValue={current.minPrice ?? ""} className={field} />
                </div>
                <div>
                  <label htmlFor="f-max" className={label}>Max £</label>
                  <input id="f-max" type="number" name="maxPrice" step="0.01" min="0" defaultValue={current.maxPrice ?? ""} className={field} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="f-from" className={label}>Added from</label>
                  <input id="f-from" type="date" name="from" defaultValue={current.from ?? ""} className={field} />
                </div>
                <div>
                  <label htmlFor="f-to" className={label}>Added to</label>
                  <input id="f-to" type="date" name="to" defaultValue={current.to ?? ""} className={field} />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <a href="/inventory" className="text-sm text-muted underline underline-offset-2 hover:text-ink">
                  Clear all
                </a>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  Apply filters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
