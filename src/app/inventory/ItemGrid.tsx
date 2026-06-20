"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice, statusLabel, locationLabel, formatDate } from "@/lib/format";

/**
 * Client-side item grid + detail modal.
 *
 * Replaces the parallel/intercepting-route modal with a plain state-driven
 * overlay. The list data is already loaded by the server page (the list
 * query fetches full rows), so opening a modal is instant — no fetch, no
 * URL change, no route interception. The full detail page at
 * /inventory/[id] still exists for direct links and refreshes.
 *
 * Why a view-model with pre-computed image URLs: the server page builds
 * the image URLs (publicUrl needs server-only env access) and passes them
 * as plain strings, so this client component never imports r2.ts. Clean
 * server/client boundary.
 */
export type ItemView = {
  id: number;
  description: string;
  condition: string | null;
  dimensions: string | null;
  pricePence: number;
  costPence: number;
  status: string;
  location: string;
  listingUrl: string | null;
  createdAtMs: number;
  soldAtMs: number | null;
  thumbUrl: string | null;
  imageUrl: string | null;
};

export function ItemGrid({ items }: { items: ItemView[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = items.find((i) => i.id === openId) ?? null;

  // Escape to close + lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
        {items.map((item) => (
          <li
            key={item.id}
            className="overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenId(item.id)}
              className="block w-full text-left text-inherit"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-paper">
                {item.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbUrl} alt={item.description} className="h-full w-full object-cover" />
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
                <p className="mt-2 text-xs text-faint">Added {formatDate(new Date(item.createdAtMs))}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenId(null);
          }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-xl sm:p-8">
            <button
              type="button"
              onClick={() => setOpenId(null)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold tracking-tight text-ink">{open.description}</h2>

            {open.imageUrl && (
              <div className="mt-4">
                {open.listingUrl ? (
                  <a href={open.listingUrl} target="_blank" rel="noopener noreferrer" title="View this item's online listing">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={open.imageUrl} alt={open.description} className="max-h-[60vh] w-full rounded-xl border border-line object-contain" />
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={open.imageUrl} alt={open.description} className="max-h-[60vh] w-full rounded-xl border border-line object-contain" />
                )}
              </div>
            )}

            <dl className="mt-5 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-base">
              <dt className="text-muted">Price</dt><dd className="text-ink">{formatPrice(open.pricePence)}</dd>
              <dt className="text-muted">Cost</dt><dd className="text-ink">{formatPrice(open.costPence)}</dd>
              {open.condition && (<><dt className="text-muted">Condition</dt><dd className="text-ink">{open.condition}</dd></>)}
              {open.dimensions && (<><dt className="text-muted">Dimensions</dt><dd className="text-ink">{open.dimensions}</dd></>)}
              <dt className="text-muted">Status</dt><dd className="text-ink">{statusLabel(open.status)}</dd>
              <dt className="text-muted">Location</dt><dd className="text-ink">{locationLabel(open.location)}</dd>
              <dt className="text-muted">Added</dt><dd className="text-ink">{formatDate(new Date(open.createdAtMs))}</dd>
              {open.soldAtMs && (<><dt className="text-muted">Sold</dt><dd className="text-ink">{formatDate(new Date(open.soldAtMs))}</dd></>)}
              {open.listingUrl && (
                <>
                  <dt className="text-muted">Listing</dt>
                  <dd className="text-ink">
                    <a href={open.listingUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">View online listing ↗</a>
                  </dd>
                </>
              )}
            </dl>

            <div className="mt-6">
              <Link
                href={`/inventory/${open.id}/edit`}
                className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
              >
                Edit item
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
